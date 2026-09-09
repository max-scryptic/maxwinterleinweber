"use client";

import { useEffect, useMemo, useRef } from "react";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Box3, Group, MathUtils, Mesh, PerspectiveCamera, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import {
  CENTRE,
  COLUMN,
  HEIGHT,
  VIEWS,
  framing,
  type ViewId,
} from "@/lib/figure";

/*
 * The figure adrift on the right hand side of the page, together with the light
 * on it and the camera work that keeps it there. Swapping the placeholder for a
 * scan is meant to be a one-line change: point MODEL_URL at the new file and
 * the scene re-fits itself around it. Everything below is derived from the
 * model's own bounding box rather than from numbers measured against this
 * particular mesh, so a scan exported at a different scale, in different units,
 * or sitting off its own origin still lands upright, centred and framed.
 */
const MODEL_URL = "/models/mannequin.glb";

// Seconds per revolution. Slow enough to read as a turntable rather than as
// something spinning, and slow enough that a viewer trying to look at one side
// is not chased off it.
const TURN_SECONDS = 32;

// How far the figure rises and falls, in metres, and how long a full rise and
// fall takes. Nothing is holding it up out here, so it drifts; the amplitude is
// small enough that the framing does not visibly breathe with it.
const DRIFT = 0.05;
const DRIFT_SECONDS = 9;

function Model({ still }: { still: boolean }) {
  const { scene, animations } = useGLTF(MODEL_URL);
  const root = useRef<Group>(null);
  const { actions, names } = useAnimations(animations, root);

  // Normalise the model: uniform scale to HEIGHT, centred on X and Z, feet on
  // the plane through the origin. This runs on the first render, before the
  // groups below it exist, so the box it measures is the model's own and
  // carries none of the transforms that are about to be put above it. The
  // loaded scene graph itself is left untouched, because useGLTF caches and
  // shares it.
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

  useFrame((state, delta) => {
    if (!root.current || still) return;

    // Turning the figure rather than the camera. Orbiting the camera instead
    // would drag the framing and the lighting around with it; this way the key
    // light stays put and the turn is what reveals the form. It also leaves
    // the camera free for the buttons to drive.
    //
    // Negative is clockwise seen from above. Delta is clamped because a tab
    // returning from the background reports the whole time it was away, which
    // would arrive as a jump.
    const step = (Math.PI * 2) / TURN_SECONDS;
    root.current.rotation.y -= step * Math.min(delta, 0.1);

    // There is nothing under the feet out here, so the figure rises and falls
    // rather than standing. Set from the clock rather than accumulated, so a
    // long pause cannot leave it drifted somewhere odd.
    const cycle = (Math.PI * 2) / DRIFT_SECONDS;
    root.current.position.y = Math.sin(state.clock.elapsedTime * cycle) * DRIFT;
  });

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
 * Slides the camera's frustum sideways so that the figure, which sits at the
 * origin, projects into the middle of the right hand half rather than into the
 * middle of the window.
 *
 * This is a change to the projection, not a move: the figure holds its place on
 * screen however far the camera is orbited around it. Offsetting the orbit
 * target instead would not, because that offset would swing round with the
 * camera and carry the figure across the page with it.
 */
function ColumnFraming() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);

  useEffect(() => {
    // The full size is the viewport's own, so nothing is scaled: only the
    // window onto the frustum moves. Negative, because putting the subject to
    // the right of centre means looking at a region that starts left of it.
    camera.setViewOffset(
      size.width,
      size.height,
      (0.5 - CENTRE) * size.width,
      0,
      size.width,
      size.height,
    );
    camera.updateProjectionMatrix();

    return () => {
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
  }, [camera, size]);

  return null;
}

/*
 * Drag to orbit, wheel or pinch to zoom, right-drag or two fingers to pan.
 *
 * These are three.js's own OrbitControls rather than the pair drei re-exports:
 * drei's come from three-stdlib, a fork that predates the target clamping this
 * relies on to keep the figure on screen.
 */
function Controls({ view, fitId }: { view: ViewId; fitId: number }) {
  const camera = useThree((state) => state.camera);
  const domElement = useThree((state) => state.gl.domElement);
  const size = useThree((state) => state.size);

  const controls = useMemo(() => {
    const orbit = new OrbitControls(camera, domElement);

    // The full-body focus, matching where the camera is pointed at mount. The
    // controls otherwise start aimed at the origin, which is between the feet.
    orbit.target.set(0, HEIGHT / 2, 0);

    // Weight behind the drag, so a flick coasts to a stop instead of halting
    // with the pointer. Damping is what makes update() below need a frame loop.
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;

    // Panning is what makes a close-up useful: it walks the orbit centre up to
    // the face or down to the feet. Confining that centre to a sphere that
    // reaches the head and the feet, and no further, is what stops the figure
    // being dragged off screen and lost.
    orbit.cursor.set(0, HEIGHT / 2, 0);
    orbit.maxTargetRadius = HEIGHT / 2;

    // Wide enough to contain every framing the buttons ask for, with room to
    // zoom past them in both directions, and far short of the nearest stars so
    // that the field is never flown into.
    orbit.minDistance = HEIGHT * 0.2;
    orbit.maxDistance = HEIGHT * 4;

    // Stop just short of both poles, where the horizon flips over and the
    // figure is seen from directly overhead or from directly underneath.
    orbit.minPolarAngle = Math.PI * 0.08;
    orbit.maxPolarAngle = Math.PI * 0.92;

    return orbit;
  }, [camera, domElement]);

  useEffect(() => () => controls.dispose(), [controls]);

  // Where the camera is being eased to, or null once it has arrived or the
  // viewer has taken over.
  const goal = useRef<{ focus: number; distance: number } | null>(null);

  useEffect(() => {
    // fitId changes on every press, including a press of the button that is
    // already active, so a viewer who has dragged somewhere odd can press it
    // again to be put back.
    const preset = VIEWS.find((candidate) => candidate.id === view) ?? VIEWS[0];
    goal.current = framing(preset, (size.width * COLUMN) / size.height);
  }, [view, fitId, size]);

  useEffect(() => {
    // A drag, a wheel or a pinch hands control back to the viewer mid-flight,
    // rather than the camera fighting them for the rest of the transition.
    const release = () => {
      goal.current = null;
    };

    controls.addEventListener("start", release);
    return () => controls.removeEventListener("start", release);
  }, [controls]);

  useFrame((_, delta) => {
    const target = goal.current;

    if (target) {
      // Ease both the point being looked at and the distance from it, keeping
      // whatever direction the viewer has orbited to. damp is a half-life, so
      // the approach is the same shape whatever the frame rate.
      const offset = camera.position.clone().sub(controls.target);
      const focus = MathUtils.damp(controls.target.y, target.focus, 4, delta);
      const distance = MathUtils.damp(offset.length(), target.distance, 4, delta);

      controls.target.set(0, focus, 0);
      camera.position.copy(controls.target).add(offset.setLength(distance));

      const arrived =
        Math.abs(focus - target.focus) < 0.001 &&
        Math.abs(distance - target.distance) < 0.001;
      if (arrived) goal.current = null;
    }

    controls.update();
  });

  return null;
}

export default function MannequinRig({
  view,
  fitId,
  still,
}: {
  view: ViewId;
  fitId: number;
  still: boolean;
}) {
  return (
    <>
      {/* The figure is the only lit thing in the scene: the sky and the stars
          draw themselves. A warm key from the front left, a violet fill from
          the opposite side so the shadowed half picks up the colour of the
          cloud it is floating in rather than going black, and a cool rim from
          behind to hold the silhouette off a background of a similar value. */}
      <ambientLight intensity={0.5} color="#b9a8f0" />
      <directionalLight position={[3, 4, 4]} intensity={2.6} color="#fff4ea" />
      <directionalLight position={[-4, 2, -1]} intensity={0.9} color="#7b5ad6" />
      <directionalLight position={[0, 3, -5]} intensity={1.4} color="#cbb6ff" />

      <Model still={still} />
      <ColumnFraming />
      <Controls view={view} fitId={fitId} />
    </>
  );
}

// Start fetching the model as soon as this chunk is parsed, in parallel with
// React mounting it, rather than waiting for the first render. The chunk itself
// is only loaded on a viewport wide enough to show the figure, so a phone never
// pays for either.
useGLTF.preload(MODEL_URL);
