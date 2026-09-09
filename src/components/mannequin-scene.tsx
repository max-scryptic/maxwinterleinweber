"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";

import { ContactShadows, useAnimations, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Box3, Group, Mesh, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/*
 * The figure standing in the right-hand column. Swapping the placeholder for a
 * scan is meant to be a one-line change: point MODEL_URL at the new file and
 * the scene re-fits itself around it. Everything below is derived from the
 * model's own bounding box rather than from numbers measured against this
 * particular mesh, so a scan exported at a different scale, in different units,
 * or sitting off its own origin still lands upright, centred and framed.
 */
const MODEL_URL = "/models/mannequin.glb";

// Metres. The model is rescaled to this, so it also sets the scale of every
// distance below.
const HEIGHT = 1.8;

// What the camera looks at and orbits around: the middle of the figure, so it
// sits centred in the column.
const FOCUS = HEIGHT * 0.5;

// The camera starts above the focus point rather than level with it, looking
// very slightly down. Level with it, the ground plane is edge on and the
// contact shadow under the feet collapses to nothing.
const CAMERA_HEIGHT = HEIGHT * 0.72;

function Model() {
  const { scene, animations } = useGLTF(MODEL_URL);
  const root = useRef<Group>(null);
  const { actions, names } = useAnimations(animations, root);

  // Normalise the model: uniform scale to HEIGHT, centred on X and Z, feet on
  // the ground plane. Measured once per model, in the model's own units, and
  // then applied as a transform so the loaded scene graph is left untouched
  // (useGLTF caches and shares it).
  const { scale, offset } = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3());

    return {
      scale: size.y > 0 ? HEIGHT / size.y : 1,
      offset: [-centre.x, -box.min.y, -centre.z] as const,
    };
  }, [scene]);

  useEffect(() => {
    // A skinned mesh is culled against its bind pose, not its animated one, so
    // an arm swinging out of that box can flicker the whole figure away when
    // the camera is close. There is one figure on screen; culling it saves
    // nothing worth this.
    scene.traverse((object) => {
      if ((object as Mesh).isMesh) object.frustumCulled = false;
    });
  }, [scene]);

  useEffect(() => {
    // The placeholder carries a set of Mixamo clips. "idle" is the standing
    // one, which is the only one that suits a figure at rest; any other model
    // falls back to its first clip, and a model with no clips just stands
    // still.
    const clip = names.includes("idle") ? "idle" : names[0];
    const action = clip ? actions[clip] : undefined;
    if (!action) return;

    action.reset().fadeIn(0.4).play();
    return () => {
      action.fadeOut(0.3);
    };
  }, [actions, names]);

  return (
    <group ref={root}>
      <group scale={scale}>
        <group position={offset}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  );
}

/*
 * Drag to orbit, wheel or pinch to zoom, right-drag or two fingers to pan.
 *
 * These are three.js's own OrbitControls rather than the pair drei re-exports:
 * drei's come from three-stdlib, a fork that predates the target clamping this
 * relies on to keep the figure on screen.
 */
function Controls() {
  const camera = useThree((state) => state.camera);
  const domElement = useThree((state) => state.gl.domElement);

  const controls = useMemo(() => {
    const orbit = new OrbitControls(camera, domElement);
    orbit.target.set(0, FOCUS, 0);

    // Weight behind the drag, so a flick coasts to a stop instead of halting
    // with the pointer. Damping is what makes update() below need a frame loop.
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;

    // Panning is what makes a close-up useful: it walks the orbit centre up to
    // the face or down to the feet. Confining that centre to a sphere that
    // reaches the head and the ground, and no further, is what stops the figure
    // being dragged off screen and lost.
    orbit.cursor.set(0, FOCUS, 0);
    orbit.maxTargetRadius = HEIGHT * 0.5;

    // Close enough to read a face, far enough out to see the whole figure with
    // room around it.
    orbit.minDistance = HEIGHT * 0.4;
    orbit.maxDistance = HEIGHT * 4;

    // Stop just short of both poles, where the horizon flips over and the
    // figure is seen from directly overhead or from underneath the floor.
    orbit.minPolarAngle = Math.PI * 0.08;
    orbit.maxPolarAngle = Math.PI * 0.92;

    return orbit;
  }, [camera, domElement]);

  useEffect(() => () => controls.dispose(), [controls]);

  useFrame(() => controls.update());

  return null;
}

export default function MannequinScene() {
  return (
    <Canvas
      // The only hint that the figure is more than a picture. Without it a
      // viewer has no reason to try dragging.
      className="cursor-grab active:cursor-grabbing"
      // The page background shows through, so the figure reads as standing on
      // the page rather than inside a panel cut into it.
      gl={{ alpha: true, antialias: true }}
      // Full device pixel ratio on a retina display costs four times the
      // fragments for a figure this smoothly shaded. Two is the point past
      // which the edges stop visibly improving.
      dpr={[1, 2]}
      camera={{
        fov: 35,
        // Far enough back that a 35 degree vertical field of view covers the
        // full height with air above and below.
        position: [0, CAMERA_HEIGHT, HEIGHT * 2.05],
        near: 0.1,
        far: 50,
      }}
    >
      {/* Three directional lights and a soft ambient: a key from front left,
          a weaker fill from the opposite side to keep the shadowed half from
          going flat, and a rim from behind to separate the silhouette from a
          background of almost the same value. */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 4]} intensity={2.4} />
      <directionalLight position={[-4, 2, -1]} intensity={0.7} />
      <directionalLight position={[0, 3, -5]} intensity={1.1} />

      <Suspense fallback={null}>
        <Model />
        {/* Cheaper than a shadow map and enough to stop the figure looking
            like it is floating: a blurred occlusion disc on the ground. */}
        <ContactShadows
          position={[0, 0, 0]}
          scale={HEIGHT * 3}
          opacity={0.4}
          blur={2.6}
          far={HEIGHT}
          resolution={512}
        />
      </Suspense>

      <Controls />
    </Canvas>
  );
}

// Start fetching the model as soon as this chunk is parsed, in parallel with
// React mounting the canvas, rather than waiting for the first render.
useGLTF.preload(MODEL_URL);
