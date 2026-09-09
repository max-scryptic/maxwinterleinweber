"use client";

import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";

import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  type Material,
  type Mesh,
  type Object3D,
  type PerspectiveCamera,
  type ShaderMaterial,
  type Texture,
} from "three";

import type { Surface } from "@/lib/surface";

/*
 * The two halves of the swap between figures: the cloud of particles a figure
 * comes apart into, and the erosion that eats the model's own surface away
 * underneath it.
 *
 * They are one effect and share one set of numbers, which is why they are in
 * one file. The cloud alone would be a swarm of specks passing in front of a
 * figure that fades; the erosion alone would be a figure eaten away with
 * nothing coming off it. Together the surface crumbles and what comes off it is
 * what flies away, and in reverse the specks arrive and the surface grows back
 * out of where they land.
 */

/*
 * Where a figure is between the two states, and how each of them is drawn.
 * Three numbers written once a frame by whatever is running the transition and
 * read straight out of the shaders, rather than React state: they change every
 * frame, and nothing about the page's markup depends on them.
 */
export type Transition = {
  /** 0 fully scattered, 1 fully gathered. Decides where every particle is. */
  form: { value: number };
  /** How brightly the cloud is drawn at all. 0 while the figure is whole. */
  fade: { value: number };
  /** How much of the model's own surface survives. 1 is all of it. */
  solid: { value: number };
};

/*
 * How much of the transition is spent letting the particles arrive at
 * different times. At zero they move as one sheet, which reads as a texture
 * being slid rather than as a cloud condensing.
 */
const STAGGER = 0.45;

// Radians the loose end of a particle's path is twisted about the figure's own
// axis, so the cloud spirals in and out rather than travelling straight along
// the normals it was scattered down.
const SWIRL = 1.1;

// How far a loose particle wanders on its own, as a fraction of the figure's
// height. This is what keeps the scattered cloud alive rather than hanging in
// the air like a held breath.
const SHIMMER = 0.014;

// Metres. A particle is a speck of light rather than an object, but it is a
// speck at a place, so unlike a star it grows as the camera comes to it.
const MOTE = 0.0045;

// Screen pixels. The lower bound keeps the far specks from dropping below a
// pixel and flickering; the upper one stops a particle the camera is right on
// top of from becoming a disc.
const SMALLEST = 1.0;
const LARGEST = 16.0;

function cloudVertex(skinned: boolean) {
  return /* glsl */ `
    uniform float uTime;
    uniform float uForm;
    uniform float uFade;
    uniform float uPoint;
    uniform float uShimmer;
    ${skinned ? "uniform highp sampler2D uBones;" : ""}

    attribute vec3 aScatter;
    attribute vec3 aTint;
    attribute float aSeed;
    ${skinned ? "attribute float aBone;" : ""}

    varying vec3 vColour;

    ${
      skinned
        ? /* glsl */ `
    // Lifted from three's own skinning chunk, because the cloud has to be posed
    // by the same skeleton as the figure it is coming off and three only wires
    // that up for a skinned mesh. One bone rather than four: the weights the
    // renderer blends between are per vertex, and a particle sits inside a
    // triangle rather than on one of its corners.
    mat4 boneMatrix(const in float i) {
      int size = textureSize(uBones, 0).x;
      int j = int(i) * 4;
      int x = j % size;
      int y = j / size;
      vec4 v1 = texelFetch(uBones, ivec2(x, y), 0);
      vec4 v2 = texelFetch(uBones, ivec2(x + 1, y), 0);
      vec4 v3 = texelFetch(uBones, ivec2(x + 2, y), 0);
      vec4 v4 = texelFetch(uBones, ivec2(x + 3, y), 0);
      return mat4(v1, v2, v3, v4);
    }`
        : ""
    }

    void main() {
      // Each particle runs the whole of its own journey inside a window of the
      // transition, and its seed says where that window sits. Everything moving
      // in step is what gives a morph away as one; this way the cloud thins and
      // thickens as it goes.
      float own = clamp(
        (uForm - aSeed * ${STAGGER.toFixed(2)}) / ${(1 - STAGGER).toFixed(2)},
        0.0,
        1.0
      );

      // Eased at both ends: a particle leaves the surface gently, crosses the
      // gap quickly and settles onto its place rather than stopping dead on it.
      float home = own * own * (3.0 - 2.0 * own);
      float loose = 1.0 - home;

      vec3 reach = (aScatter - position) * loose;

      // The twist is on the offset from the surface rather than on the position,
      // so it is a turn about the figure's own axis wherever the figure happens
      // to be standing.
      float turn = loose * ${SWIRL.toFixed(2)} * (aSeed - 0.5);
      float sine = sin(turn);
      float cosine = cos(turn);
      reach = vec3(
        reach.x * cosine - reach.z * sine,
        reach.y,
        reach.x * sine + reach.z * cosine
      );

      // Three unrelated periods, so nothing in the cloud is ever seen to pulse.
      // Folded away as the particle lands, because a speck that has arrived has
      // to hold still against the surface it is part of.
      vec3 shimmer = vec3(
        sin(uTime * 1.7 + aSeed * 41.0),
        sin(uTime * 1.3 + aSeed * 57.0),
        sin(uTime * 2.1 + aSeed * 23.0)
      ) * uShimmer * loose;

      vec3 place = position + reach + shimmer;

      // A skinned particle is carried into the world by its bone, which already
      // holds every transform above it, so it takes no model matrix of its own.
      // An unskinned one has nothing to carry it and rides the cloud's place in
      // the scene like any other object.
      vec4 world = ${skinned ? "boneMatrix(aBone)" : "modelMatrix"} * vec4(place, 1.0);
      vec4 seen = viewMatrix * world;

      gl_Position = projectionMatrix * seen;
      gl_PointSize = clamp(
        uPoint / -seen.z,
        ${SMALLEST.toFixed(1)},
        ${LARGEST.toFixed(1)}
      );

      // Brighter while it is loose. A particle about to become part of a lit
      // surface should be handing its light over to it, not competing with it.
      vColour = aTint * uFade * (0.45 + 0.55 * loose);
    }
  `;
}

const cloudFragment = /* glsl */ `
  precision mediump float;

  varying vec3 vColour;

  void main() {
    // The same soft round falloff the stars use. At two or three pixels across a
    // hard edged point reads as dirt on the screen.
    float falloff = 1.0 - smoothstep(0.0, 0.5, length(gl_PointCoord - vec2(0.5)));
    if (falloff <= 0.0) discard;

    gl_FragColor = vec4(vColour * falloff, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/*
 * The cloud itself, hung in the scene beside the model it was sampled from and
 * drawn as one points object however many meshes the model is made of.
 */
export function Cloud({
  surface,
  transition,
}: {
  surface: Surface;
  transition: RefObject<Transition>;
}) {
  const material = useRef<ShaderMaterial>(null);

  const skinned = Boolean(surface.skeleton);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uForm: { value: 1 },
      uFade: { value: 0 },
      uPoint: { value: 0 },
      uShimmer: { value: surface.span * SHIMMER },
      uBones: { value: null as Texture | null },
    }),
    [surface],
  );

  useLayoutEffect(() => {
    if (!material.current) return;
    const current = material.current.uniforms;

    // Pointed at the very objects the erosion is reading rather than at copies
    // of them, so that the surface and what comes off it can never be a frame
    // apart. Wired up here rather than where the uniforms are built because a
    // ref is not something a component may look inside while it renders.
    current.uForm = transition.current.form;
    current.uFade = transition.current.fade;

    const skeleton = surface.skeleton;
    if (!skeleton) return;

    // The renderer builds this the first time it draws a skinned mesh and
    // fills it whenever it draws one, which is a frame later than the cloud is
    // first drawn, and the matrices start as zeroes: left to that, the opening
    // frame would collapse every particle onto the origin.
    if (!skeleton.boneTexture) skeleton.computeBoneTexture();
    skeleton.update();
    current.uBones.value = skeleton.boneTexture;
  }, [surface, transition]);

  useFrame((state) => {
    if (!material.current) return;
    const current = material.current.uniforms;

    current.uTime.value = state.clock.elapsedTime;

    // How many pixels a metre covers at a metre from the camera, which is what
    // turns a size in the world into a gl_PointSize. Taken from the drawing
    // buffer rather than from the window, because the canvas is capped below
    // full density on a retina display.
    const camera = state.camera as PerspectiveCamera;
    const focal =
      (state.size.height * state.viewport.dpr) /
      (2 * Math.tan((camera.fov * Math.PI) / 360));
    current.uPoint.value = MOTE * focal;
  });

  return (
    // Never culled, for the same reason the figure is not: the bounding sphere
    // of these positions is the figure's own, and a scattered cloud is a long
    // way outside it.
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[surface.rest, 3]} />
        <bufferAttribute attach="attributes-aScatter" args={[surface.scatter, 3]} />
        <bufferAttribute attach="attributes-aTint" args={[surface.tint, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[surface.seed, 1]} />
        {surface.bone ? (
          <bufferAttribute attach="attributes-aBone" args={[surface.bone, 1]} />
        ) : null}
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={cloudVertex(skinned)}
        fragmentShader={cloudFragment}
        // Particles add to whatever is behind them and never occlude each
        // other. They do test against the depth buffer, which is what keeps the
        // ones behind the figure behind it while it is still solid.
        blending={AdditiveBlending}
        depthWrite={false}
        transparent
      />
    </points>
  );
}

// Cycles of the coarsest noise over the figure's height. This is the size of
// the flakes the surface comes apart in: too few and the model opens in slabs,
// too many and it thins out evenly like a fade.
const GRAIN = 26;

// Added to the fragments about to go, and the width of the band that gets it.
const EMBER = "vec3(0.62, 0.48, 0.95)";
const BAND = 0.16;

/*
 * The noise the surface is eaten away along, in the model's own rest space so
 * that the pattern is fixed to the body and does not swim through it as the
 * figure turns or breathes.
 *
 * Value noise, smoothed to spread it back over the whole of its range. Two
 * octaves of it cluster hard around the middle, and a threshold walked across
 * that would take the surface from whole to gone over a fifth of its travel.
 */
const CRUMBLE = /* glsl */ `
  float speck(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float grain(vec3 x) {
    vec3 cell = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(
        mix(speck(cell + vec3(0.0, 0.0, 0.0)), speck(cell + vec3(1.0, 0.0, 0.0)), f.x),
        mix(speck(cell + vec3(0.0, 1.0, 0.0)), speck(cell + vec3(1.0, 1.0, 0.0)), f.x),
        f.y
      ),
      mix(
        mix(speck(cell + vec3(0.0, 0.0, 1.0)), speck(cell + vec3(1.0, 0.0, 1.0)), f.x),
        mix(speck(cell + vec3(0.0, 1.0, 1.0)), speck(cell + vec3(1.0, 1.0, 1.0)), f.x),
        f.y
      ),
      f.z
    );
  }

  float crumble(vec3 p) {
    float coarse = grain(p);
    float fine = grain(p * 2.13 + 7.0);
    return smoothstep(0.24, 0.76, coarse * 0.66 + fine * 0.34);
  }
`;

/*
 * Eats the model's own surface away in step with the cloud coming off it.
 *
 * This is a discard rather than a fade to nothing. A model going transparent
 * has to be sorted against itself, shows its own inside through its outside,
 * and reads as a ghost; a model with holes opening in it reads as a solid thing
 * coming apart, which is what is happening. It also leaves the material opaque,
 * so nothing about the rest of the scene's draw order changes.
 *
 * The materials are cloned rather than patched in place because useGLTF hands
 * out one cached scene per file: whatever is done to them here would otherwise
 * still be done to them on the next visit to the page.
 */
export function useErosion(scene: Object3D, transition: RefObject<Transition>) {
  useLayoutEffect(() => {
    const originals = new Map<Mesh, Material | Material[]>();
    const spent: Material[] = [];

    scene.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;

      // The noise is sampled in the mesh's own coordinates, which are in
      // whatever units the model was exported in, so the grain has to be sized
      // against the mesh rather than given as a number of cycles per metre.
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      const box = mesh.geometry.boundingBox;
      const height = box ? box.max.y - box.min.y : 0;
      const density = height > 0 ? GRAIN / height : GRAIN;

      const eaten = (material: Material) => {
        const patched = material.clone();

        patched.onBeforeCompile = (shader) => {
          shader.uniforms.uSolid = transition.current.solid;
          shader.uniforms.uGrain = { value: density };

          shader.vertexShader = shader.vertexShader
            .replace(
              "#include <common>",
              "#include <common>\nvarying vec3 vRest;",
            )
            // Before the skinning chunk further down overwrites it, so this is
            // the vertex where the model was built rather than where the
            // animation has put it. The pattern belongs to the body.
            .replace(
              "#include <begin_vertex>",
              "#include <begin_vertex>\n\tvRest = transformed;",
            );

          shader.fragmentShader = shader.fragmentShader
            .replace(
              "#include <common>",
              `#include <common>
               uniform float uSolid;
               uniform float uGrain;
               varying vec3 vRest;
               ${CRUMBLE}`,
            )
            // At the end, where there is a finished colour to add the burning
            // edge to. Discarding earlier would save the shading of fragments
            // that are about to be thrown away, which on two models of fifty
            // thousand triangles is not worth splitting the noise in two for.
            .replace(
              "#include <dithering_fragment>",
              `#include <dithering_fragment>
               // The noise flattens out at both ends of its range, so the
               // threshold has to travel a little past them. Stopped exactly at
               // zero it leaves behind every patch the noise bottomed out on,
               // and the figure is never quite gone.
               float threshold = mix(-0.01, 1.01, uSolid);
               float bite = crumble(vRest * uGrain);
               if (bite > threshold) discard;

               // The edge of the erosion is where the surface is turning into
               // light, so it is the brightest thing on the figure while the
               // change runs, and nothing at all once the figure is whole.
               gl_FragColor.rgb += ${EMBER}
                 * smoothstep(threshold - ${BAND.toFixed(2)}, threshold, bite)
                 * (1.0 - smoothstep(0.94, 1.0, uSolid));`,
            );
        };

        spent.push(patched);
        return patched;
      };

      originals.set(mesh, mesh.material);
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map(eaten)
        : eaten(mesh.material);
    });

    return () => {
      for (const [mesh, material] of originals) mesh.material = material;
      for (const material of spent) material.dispose();
    };
  }, [scene, transition]);
}
