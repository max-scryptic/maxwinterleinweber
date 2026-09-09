"use client";

import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import { BackSide, Color, ShaderMaterial } from "three";

/*
 * The purple cloud the whole page sits inside, drawn on the inside of a sphere
 * far enough out that nothing ever reaches it.
 *
 * It is generated rather than sampled from a picture. A photograph of a nebula
 * has a fixed resolution and a seam wherever it is wrapped onto a sphere; noise
 * evaluated per fragment has neither, so it stays sharp at any display density
 * and the sky can turn without a join sliding past.
 */

// Metres, in the same units as the figure. Well inside the camera's far plane,
// which is what keeps the sphere from being clipped away.
const RADIUS = 900;

// Cycles of the coarsest octave across the sphere. The camera sees a narrow
// window onto it, so this is what decides whether the cloud has structure on
// screen or is a gradient.
const SCALE = 4.4;

// How fast the cloud itself churns, in units of noise space per second. Slow
// enough against that scale that the shapes do not visibly change while anyone
// is looking at them, only be different if someone comes back.
const CHURN = 0.01;

const vertexShader = /* glsl */ `
  varying vec3 vDirection;

  void main() {
    // The direction out from the centre of the sphere, which is what the noise
    // is sampled along. Taken from the local position, so the pattern turns
    // with the sky group rather than staying pinned to the world.
    vDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uVoid;
  uniform vec3 uDeep;
  uniform vec3 uBright;
  uniform vec3 uHot;

  varying vec3 vDirection;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  // Value noise: a random number per lattice corner, smoothed between them.
  // Cheaper than gradient noise and, once four octaves are stacked and the
  // domain is warped, indistinguishable at this scale.
  float noise(vec3 x) {
    vec3 cell = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(
        mix(hash(cell + vec3(0.0, 0.0, 0.0)), hash(cell + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(cell + vec3(0.0, 1.0, 0.0)), hash(cell + vec3(1.0, 1.0, 0.0)), f.x),
        f.y
      ),
      mix(
        mix(hash(cell + vec3(0.0, 0.0, 1.0)), hash(cell + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(cell + vec3(0.0, 1.0, 1.0)), hash(cell + vec3(1.0, 1.0, 1.0)), f.x),
        f.y
      ),
      f.z
    );
  }

  float fbm3(vec3 p) {
    float sum = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 3; i++) {
      sum += amplitude * noise(p);
      // Not exactly 2, so the lattices of successive octaves never line up and
      // the repeat that would give away is broken.
      p *= 2.03;
      amplitude *= 0.5;
    }
    return sum;
  }

  float fbm5(vec3 p) {
    float sum = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      sum += amplitude * noise(p);
      p *= 2.03;
      amplitude *= 0.5;
    }
    return sum;
  }

  void main() {
    vec3 direction = normalize(vDirection);

    // The camera only ever sees a 35 degree window onto this sphere, so the
    // base frequency has to be high enough for that window to hold whole
    // features. Sampled at a couple of cycles over the sphere the cloud is
    // there, but on screen it is a gradient.
    vec3 p = direction * ${SCALE.toFixed(1)};

    // Domain warping: displacing the sample point by a second noise field is
    // what pulls the cloud into drawn out filaments. Sampled straight, fbm
    // gives evenly spaced blobs that read as a texture rather than as gas.
    vec3 warp = vec3(fbm3(p + 11.3), fbm3(p + 27.1), fbm3(p + 41.7));
    float raw = fbm5(p + warp * 1.45 + uTime * ${CHURN.toFixed(4)});

    // fbm clusters hard around the middle of its range, so mapping colour
    // straight off it makes the whole sphere cloud. Pushing the lower half of
    // the range down to nothing is what opens the dark voids that the bright
    // filaments have to be read against.
    float density = smoothstep(0.27, 0.78, raw);

    // Empty sky, then the body of the cloud, then the lit filaments, then the
    // few hot spots. Overlapping ranges rather than hard cuts keep the edges
    // soft, and each one only ever adds to what is under it.
    vec3 colour = mix(uVoid, uDeep, smoothstep(0.0, 0.42, density));
    colour = mix(colour, uBright, smoothstep(0.38, 0.98, density) * 0.8);
    colour = mix(colour, uHot, smoothstep(0.78, 1.0, density) * 0.45);

    gl_FragColor = vec4(colour, 1.0);

    // The colours arrive linear, and the renderer is tone mapping and encoding
    // everything else. Doing neither here would leave the sky the one surface
    // on screen in a different space from the rest.
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function Nebula({ still }: { still: boolean }) {
  const material = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      // Read off the reference: near black indigo for empty sky, a mid violet
      // for the body of the cloud, lilac for its lit edges and a pale pink for
      // the few hot spots.
      uVoid: { value: new Color("#0e0930") },
      uDeep: { value: new Color("#33206e") },
      uBright: { value: new Color("#7d5bcf") },
      uHot: { value: new Color("#c6a2ee") },
    }),
    [],
  );

  useFrame((state) => {
    if (still || !material.current) return;
    material.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh renderOrder={-1}>
      {/* Only fine enough that the interpolated direction across a face is
          straight: the fragment shader normalises it again, so the segment
          count sets that error and not the silhouette. */}
      <sphereGeometry args={[RADIUS, 48, 32]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        // Seen from the inside.
        side={BackSide}
        // The sky is the ground everything else is drawn on: it writes no depth
        // and tests against none, and renderOrder puts it first, so nothing it
        // is meant to sit behind can be lost to the depth buffer at this range.
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
