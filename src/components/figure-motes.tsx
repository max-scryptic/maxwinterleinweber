"use client";

import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  MathUtils,
  Matrix4,
  Vector3,
  type Mesh,
  type Object3D,
  type PerspectiveCamera,
  type Points,
  type ShaderMaterial,
} from "three";

import { HEIGHT } from "@/lib/figure";

/*
 * How the figure arrives the first time: as a cloud of motes drifting in out of
 * the nebula and settling onto its surface, with the figure itself coming up
 * underneath them as they land.
 *
 * The swap between two figures is a fall, and a fall works because there is
 * already a figure on screen to replace. The opening has nothing to cut from:
 * the model is several megabytes and lands whenever it lands, so whatever
 * happens at that moment has to work as an entrance in its own right rather
 * than as a transition out of something.
 */

// Enough for the silhouette to read while they are still spread out. Points
// are cheap; this is one draw call either way.
const COUNT = 9000;

// Seconds one mote spends in flight, and how far apart their departures are
// spread. A mote is on its way for SPAN; the swarm as a whole is FORMATION.
const SPAN = 1.45;
const STAGGER = 0.6;
export const FORMATION = SPAN + STAGGER;

// Seconds. Under reduced motion nothing is thrown anywhere and the figure is
// simply brought up, which still has to take long enough not to be a cut.
export const STILL_FADE = 0.7;

// How far out the swarm starts, in metres, and how far it winds around the
// figure on the way in, in radians.
const REACH = HEIGHT * 1.15;
const SWIRL = 1.5;

// Metres. A mote has a size in the world rather than on screen, so the swarm
// coarsens as the camera is zoomed in on it, like everything else out here.
const SMALLEST = 0.004;
const LARGEST = 0.013;

/**
 * How much of the figure itself is showing, at an age in seconds.
 *
 * It comes up from nothing while the swarm is still landing, so that what is
 * left when the last motes fade is a figure already at full strength rather
 * than one that appears once they are gone.
 */
export function revealed(age: number, still: boolean) {
  return still
    ? MathUtils.smoothstep(age, 0, STILL_FADE)
    : MathUtils.smoothstep(age, FORMATION * 0.42, FORMATION * 0.96);
}

const vertexShader = /* glsl */ `
  uniform float uAge;
  uniform float uScale;

  attribute vec3 aOffset;
  attribute float aDelay;
  attribute float aSize;
  attribute vec3 aTint;

  varying vec3 vColour;

  void main() {
    float t = clamp((uAge - aDelay) / ${SPAN.toFixed(2)}, 0.0, 1.0);

    // Fastest at the start and easing off at the end: the swarm rushes in out
    // of the cloud and settles onto the figure. A linear approach reads as the
    // points being moved into place by something.
    float eased = 1.0 - pow(1.0 - t, 3.0);

    // What is left of the throw, unwound about the figure's own axis so the
    // motes spiral in rather than converging down straight lines.
    float angle = (1.0 - eased) * ${SWIRL.toFixed(2)};
    float c = cos(angle);
    float s = sin(angle);
    vec3 rest = aOffset * (1.0 - eased);
    vec3 swirl = vec3(rest.x * c - rest.z * s, rest.y, rest.x * s + rest.z * c);

    vec4 seen = modelViewMatrix * vec4(position + swirl, 1.0);

    // Lit as it leaves and out again as it arrives, so a mote never stops dead
    // on the surface: it is gone by the time it would have to.
    vColour = aTint * smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.62, 1.0, t));

    gl_PointSize = aSize * uScale / max(-seen.z, 0.001);
    gl_Position = projectionMatrix * seen;
  }
`;

const fragmentShader = /* glsl */ `
  precision mediump float;

  varying vec3 vColour;

  void main() {
    // The same soft round falloff as a star: at a few pixels across, a hard
    // edged point reads as a speck of dust on the screen.
    float falloff = 1.0 - smoothstep(0.0, 0.5, length(gl_PointCoord - vec2(0.5)));
    if (falloff <= 0.0) discard;

    gl_FragColor = vec4(vColour * falloff, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/*
 * Everything about a mote that does not depend on the model: where it comes
 * from, when it leaves, how big it is and what colour. Built once, and built
 * without the figure, so it is ready before the model is.
 */
function build() {
  const targets = new Float32Array(COUNT * 3);
  const offsets = new Float32Array(COUNT * 3);
  const delays = new Float32Array(COUNT);
  const sizes = new Float32Array(COUNT);
  const tints = new Float32Array(COUNT * 3);

  const from = new Vector3();
  const tint = new Color();

  for (let mote = 0; mote < COUNT; mote += 1) {
    from.setFromSphericalCoords(
      REACH * (0.3 + 0.7 * Math.random()),
      // acos of a uniform value spreads the directions evenly over the sphere.
      Math.acos(1 - 2 * Math.random()),
      Math.random() * Math.PI * 2,
    );
    // Flattened, so the cloud the figure gathers out of is wider than it is
    // tall: it reads as drifting in off the sky either side rather than as a
    // ball wrapped around where the figure is about to be.
    from.y *= 0.5;
    offsets.set([from.x, from.y, from.z], mote * 3);

    delays[mote] = Math.random() * STAGGER;

    // Biased hard towards the small end, so the swarm is fine grained with a
    // scattering of brighter motes through it rather than evenly speckled.
    sizes[mote] =
      SMALLEST + (LARGEST - SMALLEST) * Math.pow(Math.random(), 2.2);

    // The colours of the cloud they come out of: mostly the lilac of its lit
    // filaments, a few warmed towards the key light on the figure.
    tint.setHSL(
      Math.random() < 0.82 ? 0.72 : 0.09,
      0.25 + 0.35 * Math.random(),
      0.72 + 0.2 * Math.random(),
    );
    tints.set([tint.r, tint.g, tint.b], mote * 3);
  }

  return { targets, offsets, delays, sizes, tints };
}

const corner = new Vector3();
const landing = new Vector3();
const toLocal = new Matrix4();

/*
 * Scatters the swarm's landing points over the surface of the figure.
 *
 * Points on triangles rather than the vertices themselves: sampling vertices
 * would give a mannequin of a few thousand of them over and over, and would
 * pack the swarm wherever the mesh happens to be dense instead of spreading it
 * over the figure. getVertexPosition is what makes this work on a skinned
 * mesh, whose vertex buffer holds the bind pose, arms straight out, and not
 * the pose it is actually standing in.
 */
function land(scene: Object3D, points: Points, targets: Float32Array) {
  const meshes: Mesh[] = [];
  const triangles: number[] = [];

  scene.traverse((object) => {
    const mesh = object as Mesh;
    const position = mesh.isMesh ? mesh.geometry?.getAttribute("position") : null;
    if (!position) return;

    const index = mesh.geometry.getIndex();
    const count = Math.floor((index ? index.count : position.count) / 3);
    if (count === 0) return;

    meshes.push(mesh);
    triangles.push(count);
  });

  const total = triangles.reduce((sum, count) => sum + count, 0);
  if (total === 0) return false;

  // The pose is written onto the skeleton before the first frame is drawn, but
  // nothing has walked the graph to turn it into world matrices yet, and both
  // the vertices below and the space they are being read into come off those.
  scene.updateWorldMatrix(true, true);
  points.updateWorldMatrix(true, false);
  toLocal.copy(points.matrixWorld).invert();

  for (let mote = 0; mote < COUNT; mote += 1) {
    let pick = Math.floor(Math.random() * total);
    let which = 0;
    while (pick >= triangles[which]) {
      pick -= triangles[which];
      which += 1;
    }

    const mesh = meshes[which];
    const index = mesh.geometry.getIndex();
    const first = pick * 3;

    // A uniform point on the triangle: two random numbers, folded back over
    // the diagonal when they land outside it.
    let u = Math.random();
    let v = Math.random();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }

    landing.set(0, 0, 0);
    for (const [slot, weight] of [
      [0, 1 - u - v],
      [1, u],
      [2, v],
    ] as const) {
      mesh.getVertexPosition(
        index ? index.getX(first + slot) : first + slot,
        corner,
      );
      landing.addScaledVector(corner.applyMatrix4(mesh.matrixWorld), weight);
    }

    landing.applyMatrix4(toLocal);
    targets.set([landing.x, landing.y, landing.z], mote * 3);
  }

  return true;
}

export function Motes({ scene }: { scene: Object3D }) {
  const points = useRef<Points>(null);
  const material = useRef<ShaderMaterial>(null);

  // The swarm's own clock. Measured from the frame it is first drawn on, for
  // the same reason the figure's is: the canvas has been running since well
  // before the model arrived.
  const born = useRef<number | null>(null);
  const placed = useRef(false);

  const cloud = useMemo(() => build(), []);

  const uniforms = useMemo(
    () => ({ uAge: { value: 0 }, uScale: { value: 1 } }),
    [],
  );

  useFrame((state) => {
    const swarm = points.current;
    if (!swarm || !material.current) return;

    // On the first frame, and only then: the landing points are read off the
    // model in the pose it is holding, which is not known until it is mounted
    // and posed. Filling them here, before this frame is drawn, means the
    // swarm is never drawn against a buffer of zeroes.
    if (!placed.current) {
      placed.current = true;
      swarm.visible = land(scene, swarm, cloud.targets);
      swarm.geometry.getAttribute("position").needsUpdate = true;
    }

    if (born.current === null) born.current = state.clock.elapsedTime;

    const current = material.current.uniforms;
    current.uAge.value = state.clock.elapsedTime - born.current;

    // Pixels across a metre held one metre from the camera, which is what
    // turns a mote's size in the world into a size on screen. Read every frame
    // because the window can be resized and the camera zoomed mid-flight.
    const camera = state.camera as PerspectiveCamera;
    current.uScale.value =
      (state.size.height * state.viewport.dpr) /
      (2 * Math.tan((camera.fov * Math.PI) / 360));
  });

  return (
    // Never culled: the geometry says where the motes come to rest, which is
    // most of a metre from where they spend the flight, and a bounding sphere
    // measured off it would throw the whole swarm away as the camera turns.
    //
    // Drawn after the figure, so the motes in front of it glow over it while
    // the ones behind are hidden by it, which is what keeps the swarm wrapped
    // around a body rather than sprayed across a flat picture of one.
    <points ref={points} frustumCulled={false} renderOrder={1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[cloud.targets, 3]} />
        <bufferAttribute attach="attributes-aOffset" args={[cloud.offsets, 3]} />
        <bufferAttribute attach="attributes-aDelay" args={[cloud.delays, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[cloud.sizes, 1]} />
        <bufferAttribute attach="attributes-aTint" args={[cloud.tints, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        // Motes are light rather than matter: they add to the sky and to each
        // other, and never occlude anything.
        blending={AdditiveBlending}
        depthWrite={false}
        transparent
      />
    </points>
  );
}
