import {
  AnimationClip,
  Euler,
  MathUtils,
  Matrix4,
  Quaternion,
  QuaternionKeyframeTrack,
  Vector3,
  VectorKeyframeTrack,
  type Bone,
  type Object3D,
  type Skeleton,
  type SkinnedMesh,
} from "three";

import { POSES, type Frame, type Pose, type Shape } from "@/lib/poses";

/*
 * Building the poses in `src/lib/poses.ts` onto whatever skeleton a model
 * happens to have arrived with.
 *
 * Everything here is done against the rig's own rest pose rather than against
 * measurements of any one model, for the same reason the camera work is done
 * against a bounding box: the point of writing a pose as joint rotations is
 * that it survives being handed to a different body. A rig with longer shins
 * squats lower, a rig with shorter arms reaches less far, and a rig whose
 * exporter rewrote the joint names still finds its knees.
 *
 * Nothing here knows about React or about the scene. It is given a loaded glTF
 * and hands back clips a mixer can play.
 */

/**
 * The joint a pose means by a name like `LeftUpLeg`.
 *
 * Matched on the end of the rig's own name rather than on the whole of it,
 * because the name a pose is written against is almost never the name that
 * arrives. Mixamo calls this joint `mixamorig:LeftUpLeg`; glTF has no objection
 * to that, but three strips the colon when it loads the file, since a colon is
 * one of the characters its animation paths are punctuated with, so by the time
 * the model is in a scene the joint is `mixamorigLeftUpLeg`. Blender turns the
 * same colon into an underscore. Matching the tail of the name covers all three
 * without a table of exceptions.
 *
 * This works because the names in the vocabulary are all distinctive tails:
 * `LeftUpLeg` does not end in `LeftLeg`, and `LeftForeArm` does not end in
 * `LeftArm`. A name added to a pose has to keep that true.
 */
function joint(bones: readonly Bone[], name: string) {
  return (
    bones.find((bone) => bone.name === name) ??
    bones.find((bone) => bone.name.endsWith(name)) ??
    null
  );
}

function skeletonOf(root: Object3D) {
  let found: Skeleton | null = null;

  root.traverse((object) => {
    const mesh = object as SkinnedMesh;
    if (!found && mesh.isSkinnedMesh) found = mesh.skeleton;
  });

  return found as Skeleton | null;
}

type Rest = {
  bone: Bone;
  /** Which entry in this same list carries it, or -1 for a root joint. */
  parent: number;
  /** Its own transform in its parent's frame, as the file was authored. */
  position: Vector3;
  quaternion: Quaternion;
  scale: Vector3;
  /** Where it sits, and how it is turned, in the frame the root joint hangs in. */
  world: Matrix4;
  turned: Quaternion;
};

type Rig = {
  rest: Rest[];
  /** Carriers before the joints they carry, so one pass places the whole rig. */
  order: number[];
  /**
   * The joints the figure is standing on, which for anything shaped like a
   * person is its feet and toes: everything resting within a tenth of the rig's
   * own height of its lowest joint. Found by measuring rather than by name,
   * because a rig that came back from an auto rigger with its joints called
   * something else still has a lowest tenth.
   */
  contact: number[];
};

// How much of the rig's height counts as standing on the ground.
const FOOTING = 0.1;

/*
 * The rig as it was authored, read once and kept.
 *
 * Read off the bones themselves, which is only correct at a moment when nothing
 * has posed them, and pinning that moment down is the whole reason this is
 * cached against the skeleton. A loaded glTF is shared: `useGLTF` hands the same
 * scene to every figure that asks for the same file, so the second time one is
 * mounted its joints are wherever the last mixer to touch them left them. The
 * first time is different, because the loader has just written the file's own
 * values into them and no mixer exists yet, and that is the read this keeps.
 *
 * The skeleton's inverse bind matrices are the other candidate and would need no
 * cache. They are not used because they describe the joints in world terms, and
 * recovering a root joint's own transform from one means dividing out whatever
 * the armature above it is doing, which here is a hundredfold scale.
 * Snapshotting the authored values sidesteps the question.
 */
const authored = new WeakMap<Skeleton, Rig>();

function rigOf(skeleton: Skeleton): Rig {
  const cached = authored.get(skeleton);
  if (cached) return cached;

  const at = new Map<Object3D, number>();
  skeleton.bones.forEach((bone, index) => at.set(bone, index));

  const rest: Rest[] = skeleton.bones.map((bone) => ({
    bone,
    parent: bone.parent ? (at.get(bone.parent) ?? -1) : -1,
    position: bone.position.clone(),
    quaternion: bone.quaternion.clone(),
    scale: bone.scale.clone(),
    world: new Matrix4(),
    turned: new Quaternion(),
  }));

  // Walked rather than run down the list in order, because nothing promises a
  // glTF lists a joint after the one that carries it, and a child placed before
  // its parent would be measured against an unwritten matrix. The order this
  // settles on is kept, so every pose below is one pass rather than another
  // walk.
  const order: number[] = [];
  const placed = new Set<number>();
  const local = new Matrix4();
  const spare = new Vector3();

  const place = (index: number) => {
    if (placed.has(index)) return;
    placed.add(index);

    const entry = rest[index];
    if (entry.parent >= 0) place(entry.parent);

    local.compose(entry.position, entry.quaternion, entry.scale);
    if (entry.parent < 0) entry.world.copy(local);
    else entry.world.multiplyMatrices(rest[entry.parent].world, local);

    entry.world.decompose(spare, entry.turned, new Vector3());
    order.push(index);
  };

  rest.forEach((_, index) => place(index));

  let lowest = Infinity;
  let highest = -Infinity;
  for (const entry of rest) {
    const height = spare.setFromMatrixPosition(entry.world).y;
    lowest = Math.min(lowest, height);
    highest = Math.max(highest, height);
  }

  const span = highest > lowest ? highest - lowest : 1;
  const contact = order.filter(
    (index) =>
      spare.setFromMatrixPosition(rest[index].world).y <=
      lowest + span * FOOTING,
  );

  const rig = { rest, order, contact };
  authored.set(skeleton, rig);
  return rig;
}

/*
 * A joint's rotation in its parent's frame once a pose has turned it.
 *
 * The rotation a pose asks for is measured about the figure's own axes, and the
 * one a joint stores is measured about its parent's, so the pose's rotation is
 * carried into the parent's frame before it is applied. On a Mixamo rig the two
 * are the same, because every joint rests unturned, and the conjugation
 * collapses to a copy. It is here for the rig where they are not: an auto rigger
 * is under no obligation to rest its joints square, and a pose applied to one
 * that does not would otherwise bend the knees sideways.
 */
function turn(rest: Rest[], index: number, about: Quaternion, into: Quaternion) {
  const entry = rest[index];

  if (entry.parent < 0) into.copy(about);
  else {
    const frame = rest[entry.parent].turned;
    into.copy(frame).invert().multiply(about).multiply(frame);
  }

  return into.multiply(entry.quaternion);
}

/**
 * Every joint's local rotation for one shape, in the order the rest list is in.
 *
 * Joints the shape says nothing about are given their rest rotation rather than
 * left out, so that a pose is a complete statement about the figure: blending
 * out of one lands somewhere known rather than wherever the clip before it
 * happened to leave the joints it did not mention.
 */
function locals(rig: Rig, shape: Shape) {
  const bones = rig.rest.map((entry) => entry.bone);
  const spin = new Euler();

  const asked = new Map<number, Quaternion>();
  for (const [name, wanted] of Object.entries(shape)) {
    const bone = joint(bones, name);
    if (!bone) continue;

    spin.set(
      MathUtils.degToRad(wanted.x ?? 0),
      MathUtils.degToRad(wanted.y ?? 0),
      MathUtils.degToRad(wanted.z ?? 0),
    );
    asked.set(bones.indexOf(bone), new Quaternion().setFromEuler(spin));
  }

  return rig.rest.map((entry, index) => {
    const wanted = asked.get(index);
    if (!wanted) return entry.quaternion.clone();
    return turn(rig.rest, index, wanted, new Quaternion());
  });
}

/*
 * Where the root joint has to be moved to for a posed figure to be standing
 * where the figure was standing.
 *
 * Rotating joints alone does not keep a figure's feet under it. Bending both
 * knees as far as the squat does lifts the feet the better part of half a metre
 * and swings them out in front, and a figure left like that hangs in the air
 * leaning forwards, off the axis it is being turned on. What puts it back is
 * carrying the root the other way, which is also what a squat really is: the
 * feet stay where they are and the hips travel back and down over them.
 *
 * Vertically it takes the lowest joint of the footing, so that nothing is ever
 * driven through the floor. Horizontally it takes the middle of the footing,
 * because the point there is not that some particular toe holds still but that
 * the figure's weight stays over the same patch of ground. Both are measured
 * against the same joints in both poses, so there is no step when the lowest
 * point of the pose moves from one foot to the other.
 */
function footing(rig: Rig, pose: readonly Quaternion[], into: Vector3) {
  const world = rig.rest.map(() => new Matrix4());
  const local = new Matrix4();
  const place = new Vector3();

  for (const index of rig.order) {
    const entry = rig.rest[index];
    local.compose(entry.position, pose[index], entry.scale);

    if (entry.parent < 0) world[index].copy(local);
    else world[index].multiplyMatrices(world[entry.parent], local);
  }

  if (rig.contact.length === 0) return into.set(0, 0, 0);

  const middle = new Vector3();
  const was = new Vector3();
  let lowest = Infinity;
  let wasLowest = Infinity;

  for (const index of rig.contact) {
    middle.add(place.setFromMatrixPosition(world[index]));
    lowest = Math.min(lowest, place.y);

    was.add(place.setFromMatrixPosition(rig.rest[index].world));
    wasLowest = Math.min(wasLowest, place.y);
  }

  middle.divideScalar(rig.contact.length);
  was.divideScalar(rig.contact.length);

  return into.set(was.x - middle.x, wasLowest - lowest, was.z - middle.z);
}

/**
 * One pose, as a clip. Null for a pose that names a clip the model carries
 * rather than describing a shape, and for a model with no skeleton to pose,
 * which is every photogrammetry scan until it has been through a rigger.
 */
function clipFor(pose: Pose, skeleton: Skeleton): AnimationClip | null {
  if (!pose.frames || pose.frames.length === 0) return null;

  const rig = rigOf(skeleton);
  const root = rig.rest.findIndex((entry) => entry.parent < 0);

  // A pose held rather than played still needs two moments to be held between:
  // a clip of no duration is one an action cannot loop or blend across.
  const frames: readonly Frame[] =
    pose.frames.length === 1
      ? [pose.frames[0], { at: 1, shape: pose.frames[0].shape }]
      : pose.frames;

  const times = new Float32Array(frames.map((frame) => frame.at));
  const shaped = frames.map((frame) => locals(rig, frame.shape));

  const tracks: (QuaternionKeyframeTrack | VectorKeyframeTrack)[] =
    rig.rest.map((entry, index) => {
      const values = new Float32Array(frames.length * 4);
      shaped.forEach((frame, at) => frame[index].toArray(values, at * 4));
      return new QuaternionKeyframeTrack(
        `${entry.bone.name}.quaternion`,
        times,
        values,
      );
    });

  // The root joint carries the whole figure, so it is the one that moves to put
  // the feet back under it. Every other joint keeps the position it was authored
  // with, which is what a joint does: bones turn, they do not slide.
  if (root >= 0) {
    const entry = rig.rest[root];
    const values = new Float32Array(frames.length * 3);
    const stand = new Vector3();

    shaped.forEach((frame, at) => {
      footing(rig, frame, stand).add(entry.position).toArray(values, at * 3);
    });

    tracks.push(
      new VectorKeyframeTrack(`${entry.bone.name}.position`, times, values),
    );
  }

  return new AnimationClip(named(pose.id), times[times.length - 1], tracks);
}

/** What a built pose is called, kept clear of any name a model might ship with. */
export function named(id: string) {
  return `pose:${id}`;
}

/**
 * Every pose that has to be built for this model, as clips ready to be handed to
 * a mixer alongside the ones the model was exported with. Empty for a model with
 * no skeleton, which is the whole of what "this figure cannot be posed" means.
 */
export function poseClips(root: Object3D): AnimationClip[] {
  const skeleton = skeletonOf(root);
  if (!skeleton) return [];

  return POSES.map((pose) => clipFor(pose, skeleton)).filter(
    (clip): clip is AnimationClip => clip !== null,
  );
}
