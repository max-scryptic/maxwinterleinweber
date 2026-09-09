import {
  Color,
  Matrix4,
  Object3D,
  Vector3,
  type BufferAttribute,
  type InterleavedBufferAttribute,
  type Mesh,
  type Skeleton,
  type SkinnedMesh,
} from "three";

/*
 * Scattering a loaded model into the cloud of particles it comes apart into,
 * and back together out of.
 *
 * The particles are drawn from the model's own surface rather than from a shape
 * invented to stand in for it: a point per unit of area, so a dense mesh and a
 * sparse one both give an even skin of them, and every particle knows the piece
 * of the figure it belongs to. That is what lets the cloud read as the figure
 * itself dispersed, and what lets it converge back onto a silhouette rather
 * than into a blob.
 *
 * Nothing here knows about React or about the scene. It is given a loaded glTF
 * and hands back the buffers a points cloud is built from.
 */

type Attribute = BufferAttribute | InterleavedBufferAttribute;

export type Surface = {
  /** Where each particle sits when the figure is whole. Three floats each. */
  rest: Float32Array;
  /** Where it sits when the figure is fully scattered. */
  scatter: Float32Array;
  /** Its own colour, so the cloud is not one flat tone. */
  tint: Float32Array;
  /** A random number each, which the stagger, the swirl and the shimmer all key off. */
  seed: Float32Array;
  /**
   * Which bone carries each particle, or null for a model with no skeleton.
   * One bone rather than the four a vertex is normally weighted between: the
   * seams that simplification opens at the joints are a few millimetres wide,
   * and these are loose specks of light rather than a surface that can tear.
   */
  bone: Float32Array | null;
  /** The skeleton those indices are into, and whose pose the cloud follows. */
  skeleton: Skeleton | null;
  /** The model's height, in the same space rest and scatter are given in. */
  span: number;
};

/*
 * How far a scattered particle drifts from the surface it came off, as a
 * fraction of the figure's height, and how much of that direction is the
 * surface normal rather than a random one.
 *
 * All normal gives a shell that holds the silhouette and reads as an inflated
 * copy of the figure; all random gives a shapeless ball with nothing of the
 * figure left in it. Most of the way to random, with enough normal left to push
 * the cloud out of the body rather than through it, is what looks like
 * something coming apart.
 */
const NEAREST = 0.05;
const FURTHEST = 0.42;
const OUTWARD = 0.55;

/*
 * The share of the particles that take the key light's colour rather than the
 * fill's. Nothing lights a particle, so it has to carry its own colour, and
 * these are the two lamps that are on the figure: the cloud is the figure
 * coming apart, so it is lit as the figure was.
 */
const WARM = 0.32;

/*
 * A mesh's transform into the space its particles are given in.
 *
 * For a skinned mesh that space is the one its bind matrix maps into, because
 * the skeleton's own matrices are built to carry a point from exactly there
 * into the world. For everything else it is the space the loaded scene sits in,
 * which is the space the cloud is hung in beside it.
 */
function placement(root: Object3D, mesh: Mesh) {
  const skinned = mesh as SkinnedMesh;
  if (skinned.isSkinnedMesh) return skinned.bindMatrix;

  // Walked and recomputed from each node's own position and rotation rather
  // than read off matrixWorld, which is only brought up to date when the scene
  // is rendered and is stale or absent on a model that has just finished
  // loading.
  const matrix = new Matrix4();
  for (let node: Object3D | null = mesh; node; node = node.parent) {
    node.updateMatrix();
    matrix.premultiply(node.matrix);
    if (node === root) break;
  }

  return matrix;
}

type Piece = {
  /** Every vertex, already in the space above. Three floats each. */
  points: Float32Array;
  index: Attribute | null;
  triangles: number;
  skinIndex: Attribute | null;
  skinWeight: Attribute | null;
};

function pieces(root: Object3D) {
  const found: Piece[] = [];
  let skeleton: Skeleton | null = null;

  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;

    const geometry = mesh.geometry;
    const position = geometry.getAttribute("position");
    if (!position) return;

    const skinned = mesh as SkinnedMesh;
    if (skinned.isSkinnedMesh && !skeleton) skeleton = skinned.skeleton;

    // Transformed once here rather than three times per triangle below, where
    // every vertex is read again by each of the faces around it. Read through
    // the attribute's accessors rather than off its array, because a meshopt
    // compressed model arrives interleaved and its positions are not three
    // floats in a row.
    const points = new Float32Array(position.count * 3);
    const vertex = new Vector3();
    const matrix = placement(root, mesh);

    for (let at = 0; at < position.count; at += 1) {
      vertex.fromBufferAttribute(position, at).applyMatrix4(matrix);
      points[at * 3] = vertex.x;
      points[at * 3 + 1] = vertex.y;
      points[at * 3 + 2] = vertex.z;
    }

    const index = geometry.getIndex();

    found.push({
      points,
      index,
      triangles: Math.floor((index ? index.count : position.count) / 3),
      skinIndex: skinned.isSkinnedMesh ? geometry.getAttribute("skinIndex") : null,
      skinWeight: skinned.isSkinnedMesh ? geometry.getAttribute("skinWeight") : null,
    });
  });

  return { found, skeleton: skeleton as Skeleton | null };
}

// The first cumulative area at or above a share of the total. The areas run
// upwards, so a binary search finds it, and picking the share uniformly is then
// picking a triangle in proportion to its area.
function chosen(cumulative: Float64Array, share: number) {
  let low = 0;
  let high = cumulative.length - 1;

  while (low < high) {
    const middle = (low + high) >> 1;
    if (cumulative[middle] < share) low = middle + 1;
    else high = middle;
  }

  return low;
}

export function sampleSurface(root: Object3D, count: number): Surface {
  const { found, skeleton } = pieces(root);

  // Where each piece's triangles start in the one numbering the search below
  // runs over. Two or three entries for any real model, so finding the piece a
  // number lands in is a walk rather than a second search.
  const starts: number[] = [];
  let triangles = 0;
  for (const piece of found) {
    starts.push(triangles);
    triangles += piece.triangles;
  }

  const rest = new Float32Array(count * 3);
  const scatter = new Float32Array(count * 3);
  const tint = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const bone = skeleton ? new Float32Array(count) : null;

  if (triangles === 0) {
    return { rest, scatter, tint, seed, bone, skeleton, span: 1 };
  }

  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const edge = new Vector3();
  const across = new Vector3();
  const normal = new Vector3();
  const point = new Vector3();
  const away = new Vector3();
  const colour = new Color();

  const corner = (piece: Piece, at: number, into: Vector3) => {
    const vertex = piece.index ? piece.index.getX(at) : at;
    return into.fromArray(piece.points, vertex * 3);
  };

  // Areas, accumulated as they are measured. Doing this in one pass over every
  // triangle in the model is the whole cost of the sampling, and it is what
  // buys an even spread: taking triangles uniformly instead would crowd the
  // particles wherever the mesh happens to be finely divided, which on a scan
  // is wherever the photogrammetry found detail rather than wherever the
  // surface is.
  const cumulative = new Float64Array(triangles);
  let area = 0;
  let at = 0;

  for (const piece of found) {
    for (let triangle = 0; triangle < piece.triangles; triangle += 1) {
      corner(piece, triangle * 3, a);
      corner(piece, triangle * 3 + 1, b);
      corner(piece, triangle * 3 + 2, c);

      area +=
        edge
          .subVectors(b, a)
          .cross(across.subVectors(c, a))
          .length() * 0.5;
      cumulative[at] = area;
      at += 1;
    }
  }

  // The figure's height in this space, taken from the vertices rather than from
  // a bounding box, so that everything below is a fraction of the model's own
  // size and lands the same whatever units it was exported in.
  let lowest = Infinity;
  let highest = -Infinity;
  for (const piece of found) {
    for (let index = 1; index < piece.points.length; index += 3) {
      const height = piece.points[index];
      if (height < lowest) lowest = height;
      if (height > highest) highest = height;
    }
  }
  const span = highest > lowest ? highest - lowest : 1;

  for (let particle = 0; particle < count; particle += 1) {
    const ordinal = chosen(cumulative, Math.random() * area);

    let which = starts.length - 1;
    while (which > 0 && starts[which] > ordinal) which -= 1;
    const piece = found[which];
    const triangle = (ordinal - starts[which]) * 3;

    corner(piece, triangle, a);
    corner(piece, triangle + 1, b);
    corner(piece, triangle + 2, c);

    // Uniform over the triangle. The square root is what stops the points
    // piling into the corner the barycentric coordinates are measured from.
    const split = Math.sqrt(Math.random());
    const along = Math.random();
    const weights = [1 - split, split * (1 - along), split * along];

    point
      .set(0, 0, 0)
      .addScaledVector(a, weights[0])
      .addScaledVector(b, weights[1])
      .addScaledVector(c, weights[2]);
    rest.set([point.x, point.y, point.z], particle * 3);

    // The face's normal rather than the interpolated vertex normals: this only
    // decides which way a speck drifts, and a torn scan has faces whose vertex
    // normals point at nothing in particular.
    normal
      .copy(edge.subVectors(b, a))
      .cross(across.subVectors(c, a))
      .normalize();

    // Evenly over the sphere, by the same acos trick the starfield uses.
    away.setFromSphericalCoords(
      1,
      Math.acos(1 - 2 * Math.random()),
      Math.random() * Math.PI * 2,
    );

    away.addScaledVector(normal, OUTWARD).normalize();
    if (away.lengthSq() === 0) away.copy(normal);

    // Biased outwards, so the cloud has a body to it instead of most of its
    // particles hanging just off the skin where they are lost against it.
    const reach =
      span * (NEAREST + (FURTHEST - NEAREST) * Math.pow(Math.random(), 0.7));
    point.addScaledVector(away, reach);
    scatter.set([point.x, point.y, point.z], particle * 3);

    seed[particle] = Math.random();

    if (bone && piece.skinIndex && piece.skinWeight) {
      // The corner of the triangle this particle sits nearest, and then the one
      // bone that corner leans on hardest.
      let nearest = 0;
      if (weights[1] > weights[nearest]) nearest = 1;
      if (weights[2] > weights[nearest]) nearest = 2;

      const vertex = piece.index
        ? piece.index.getX(triangle + nearest)
        : triangle + nearest;

      const weight = piece.skinWeight;
      const index = piece.skinIndex;
      let heaviest = weight.getX(vertex);
      let held = index.getX(vertex);

      if (weight.getY(vertex) > heaviest) {
        heaviest = weight.getY(vertex);
        held = index.getY(vertex);
      }
      if (weight.getZ(vertex) > heaviest) {
        heaviest = weight.getZ(vertex);
        held = index.getZ(vertex);
      }
      if (weight.getW(vertex) > heaviest) held = index.getW(vertex);

      bone[particle] = held;
    }

    // Weighted towards the faint end, with a handful bright enough to read as
    // individual sparks, for the same reason the stars are.
    const brightness = Math.pow(Math.random(), 2.0);
    const warm = Math.random() < WARM;
    colour.setHSL(warm ? 0.08 : 0.72, warm ? 0.5 : 0.62, 0.52 + 0.4 * brightness);
    tint.set([colour.r, colour.g, colour.b], particle * 3);
  }

  return { rest, scatter, tint, seed, bone, skeleton, span };
}
