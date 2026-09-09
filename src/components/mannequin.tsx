"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Box3, Group, MathUtils, Mesh, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { COLUMN, HEIGHT, VIEWS, framing, type ViewId } from "@/lib/figure";

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
  const { actions, names, mixer } = useAnimations(animations, root);

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

  useLayoutEffect(() => {
    // The placeholder carries a set of Mixamo clips. "idle" is the standing
    // one, which is the only one that suits a figure at rest; any other model
    // falls back to its first clip, and a model with no clips just stands
    // still.
    const clip = names.includes("idle") ? "idle" : names[0];
    const action = clip ? actions[clip] : undefined;
    if (!action) return;

    // Straight in at full weight, and the first frame of it written onto the
    // skeleton here rather than at the next tick of the render loop. Until a
    // clip is applied, a skinned mesh is drawn in its bind pose, which for this
    // model is the arms held straight out; fading the clip in from nothing
    // meant opening on that pose and then watching the arms drop into the idle
    // one. Starting already in the pose the figure is going to hold is what
    // standing there looks like. A layout effect, so this lands before the
    // first painted frame rather than one frame into it.
    action.reset().play();
    mixer.update(0);

    return () => {
      action.stop();
    };
  }, [actions, mixer, names]);

  // The clock has been running since the canvas was created, which is a second
  // or so of loading before this figure exists. Everything below is measured
  // from the first frame it is actually drawn on instead.
  const born = useRef<number | null>(null);

  useFrame((state, delta) => {
    if (!root.current || still) return;
    if (born.current === null) born.current = state.clock.elapsedTime;
    const age = state.clock.elapsedTime - born.current;

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
    // long pause cannot leave it drifted somewhere odd, and from the figure's
    // own age so that it starts at rest and drifts from there rather than
    // appearing part way up a swing it was never seen taking.
    const cycle = (Math.PI * 2) / DRIFT_SECONDS;
    root.current.position.y = Math.sin(age * cycle) * DRIFT;
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

  // Where the camera is being eased to, or null once it has arrived or the
  // viewer has taken over.
  const goal = useRef<{ focus: number; distance: number } | null>(null);

  const controls = useRef<OrbitControls | null>(null);

  // Built in an effect rather than in a memo, and this is not a detail. The
  // controls take hold of the camera the moment they are constructed: three
  // aims it at their target, which starts at the origin, before there is any
  // chance to say where the target really is. A memo runs while rendering, and
  // the render this component is first part of is one React throws away and
  // retries when the model below it suspends. That threw away the component but
  // not what its constructor had already done to the camera, and left a live
  // set of controls listening on the canvas with nothing to dispose it: the sky
  // pitched several degrees a second into the page, and again when the figure
  // finally landed. An effect only runs on a render that was kept, and the
  // target is set before the frame after it is drawn.
  useLayoutEffect(() => {
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

    // Puts the camera back on the target it was just given, undoing the aim at
    // the origin the constructor took, while still inside the effect and so
    // still before anything is drawn.
    orbit.update();

    // A drag, a wheel or a pinch hands control back to the viewer mid-flight,
    // rather than the camera fighting them for the rest of the transition.
    const release = () => {
      goal.current = null;
    };
    orbit.addEventListener("start", release);

    controls.current = orbit;
    return () => {
      orbit.removeEventListener("start", release);
      orbit.dispose();
      controls.current = null;
    };
  }, [camera, domElement]);

  useEffect(() => {
    // fitId changes on every press, including a press of the button that is
    // already active, so a viewer who has dragged somewhere odd can press it
    // again to be put back.
    const preset = VIEWS.find((candidate) => candidate.id === view) ?? VIEWS[0];
    goal.current = framing(preset, (size.width * COLUMN) / size.height);
  }, [view, fitId, size]);

  useFrame((_, delta) => {
    const orbit = controls.current;
    if (!orbit) return;

    const target = goal.current;

    if (target) {
      // Ease both the point being looked at and the distance from it, keeping
      // whatever direction the viewer has orbited to. damp is a half-life, so
      // the approach is the same shape whatever the frame rate.
      const offset = camera.position.clone().sub(orbit.target);
      const focus = MathUtils.damp(orbit.target.y, target.focus, 4, delta);
      const distance = MathUtils.damp(offset.length(), target.distance, 4, delta);

      orbit.target.set(0, focus, 0);
      camera.position.copy(orbit.target).add(offset.setLength(distance));

      const arrived =
        Math.abs(focus - target.focus) < 0.001 &&
        Math.abs(distance - target.distance) < 0.001;
      if (arrived) goal.current = null;
    }

    orbit.update();
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
      <Controls view={view} fitId={fitId} />
    </>
  );
}

// Start fetching the model as soon as this chunk is parsed, in parallel with
// React mounting it, rather than waiting for the first render. The chunk itself
// is only loaded on a viewport wide enough to show the figure, so a phone never
// pays for either.
useGLTF.preload(MODEL_URL);
