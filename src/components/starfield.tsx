"use client";

import { useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, ShaderMaterial, Vector3 } from "three";

/*
 * The stars. This is what makes the background read as a space rather than as a
 * picture of one: they sit at every distance from just behind the figure out to
 * the edge of the sky, so turning the camera slides the near ones across the
 * far ones. A single flat layer, however well drawn, cannot do that.
 */

/*
 * Spread over a whole sphere, of which the camera's 35 degree window shows
 * about a twentieth. It takes this many for a few hundred to be on screen, and
 * a few hundred is the difference between a sky and a handful of specks.
 */
const COUNT = 14000;

// Metres. The near end sits outside the figure and outside anywhere the camera
// can be dragged to, so the field is never flown into.
const NEAR = 14;
const FAR = 420;

// Screen pixels at a device pixel ratio of 1, before the twinkle. A star is a
// point source: it has an apparent brightness but no apparent size, so these
// are sizes on screen and not in the world.
const SMALLEST = 1.3;
const LARGEST = 3.6;

// Radians per second, and how far the brightness swings below full.
const TWINKLE_RATE = 1.6;
const TWINKLE_DEPTH = 0.4;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uTwinkle;

  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aTint;

  varying vec3 vColour;

  void main() {
    // Each star has its own phase, so the field shimmers rather than pulsing in
    // unison, which is what gives a synchronised twinkle away as an effect.
    float pulse = 1.0 - uTwinkle * (0.5 + 0.5 * sin(uTime * ${TWINKLE_RATE.toFixed(2)} + aPhase));
    vColour = aTint * pulse;

    // Fixed size on screen whatever the distance. Scaling with 1/z instead
    // would blow the near stars, the ones carrying the parallax, up into discs
    // and shrink the far ones below a pixel.
    gl_PointSize = aSize * uPixelRatio;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision mediump float;

  varying vec3 vColour;

  void main() {
    // A soft round falloff rather than a square: at two or three pixels across,
    // a hard edged point reads as a speck of dust on the screen.
    float falloff = 1.0 - smoothstep(0.0, 0.5, length(gl_PointCoord - vec2(0.5)));
    if (falloff <= 0.0) discard;

    gl_FragColor = vec4(vColour * falloff, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function build() {
  const positions = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);
  const phases = new Float32Array(COUNT);
  const tints = new Float32Array(COUNT * 3);

  const point = new Vector3();
  const tint = new Color();

  for (let index = 0; index < COUNT; index += 1) {
    // Log uniform in radius: an equal share of the stars in every doubling of
    // distance. Spreading them uniformly through the volume instead would pile
    // almost all of them against the far shell, where they never move.
    const radius = NEAR * Math.pow(FAR / NEAR, Math.random());

    // acos of a uniform value spreads the points evenly over the sphere. Taking
    // the polar angle uniformly instead crowds them at the poles.
    point.setFromSphericalCoords(
      radius,
      Math.acos(1 - 2 * Math.random()),
      Math.random() * Math.PI * 2,
    );
    positions.set([point.x, point.y, point.z], index * 3);

    // Biased hard towards the faint end: a sky of evenly bright stars reads as
    // a dither pattern, and it is the handful of bright ones that give it
    // depth.
    const brightness = Math.pow(Math.random(), 2.4);
    sizes[index] = SMALLEST + brightness * (LARGEST - SMALLEST);
    phases[index] = Math.random() * Math.PI * 2;

    // Starlight runs blue white to warm. Nearly white here, with the hue only
    // just showing on the brightest few.
    tint.setHSL(
      Math.random() < 0.55 ? 0.62 : 0.09,
      0.35 * Math.random(),
      0.72 + 0.28 * brightness,
    );
    tints.set([tint.r, tint.g, tint.b], index * 3);
  }

  return { positions, sizes, phases, tints };
}

export function Starfield({ still }: { still: boolean }) {
  const material = useRef<ShaderMaterial>(null);

  const stars = useMemo(() => build(), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uTwinkle: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    if (!material.current) return;
    const current = material.current.uniforms;

    // Read from the renderer rather than from window.devicePixelRatio: the
    // canvas is capped below full density on retina displays, and a star sized
    // against the display rather than against the buffer would be drawn at
    // twice the pixels it covers.
    current.uPixelRatio.value = state.viewport.dpr;
    current.uTwinkle.value = still ? 0 : TWINKLE_DEPTH;
    if (!still) current.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[stars.positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[stars.sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[stars.phases, 1]} />
        <bufferAttribute attach="attributes-aTint" args={[stars.tints, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        // Stars add to whatever is behind them and never occlude each other, so
        // they blend additively and write no depth. They do test against it,
        // which is what keeps them behind the figure.
        blending={AdditiveBlending}
        depthWrite={false}
        transparent
      />
    </points>
  );
}
