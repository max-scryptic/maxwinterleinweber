"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { ContactShadows, useAnimations, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Box3, Group, MathUtils, Mesh, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { Button } from "@/components/ui/button";

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

// Seconds per revolution. Slow enough to read as a turntable rather than as
// something spinning, and slow enough that a viewer trying to look at one side
// is not chased off it.
const TURN_SECONDS = 32;

// The camera sits above whatever it is looking at, angled very slightly down.
// Level with it, the ground plane is edge on and the contact shadow under the
// feet collapses to nothing.
const CAMERA_RISE = HEIGHT * 0.22;

// How much of the frame is left empty around the part being shown. 1 would
// crop to it exactly.
const MARGIN = 1.3;

/*
 * The three framings, as fractions of the figure's height measured from the
 * ground: the band of the body each one has to fit on screen, and how wide
 * that band is at its widest point. Proportions of a standing figure, not of
 * this particular mesh, so they survive the swap to a scan: the hips sit a
 * little above half of a person's height, and the head is the top eighth.
 */
const VIEWS = [
  // Width here is what must not be cropped, which is not always the whole
  // silhouette: the full-body view has to hold the arms, but a torso shot that
  // loses the hands at the edges of a narrow column is still a torso shot, and
  // insisting on the arm span there would pull the camera back far enough to
  // show the knees.
  { id: "full", label: "Full body", bottom: 0, top: 1, width: 0.44 },
  { id: "torso", label: "Torso", bottom: 0.52, top: 1, width: 0.32 },
  { id: "head", label: "Head", bottom: 0.85, top: 1, width: 0.16 },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

/*
 * Where the camera has to be to fit one of those bands. The vertical field of
 * view is fixed, so the distance that fits the band's height is fixed too; the
 * distance that fits its width depends on the shape of the column the canvas
 * is in. Taking the larger of the two is what keeps a head from being cropped
 * down the sides in a narrow column, where fitting the height alone is not
 * enough.
 */
function framing(view: (typeof VIEWS)[number], fov: number, aspect: number) {
  const halfFov = Math.tan(MathUtils.degToRad(fov) / 2);
  const height = (view.top - view.bottom) * HEIGHT * MARGIN;
  const width = view.width * HEIGHT * MARGIN;

  return {
    focus: ((view.top + view.bottom) / 2) * HEIGHT,
    distance: Math.max(height / 2 / halfFov, width / 2 / (halfFov * aspect)),
  };
}

function Model() {
  const { scene, animations } = useGLTF(MODEL_URL);
  const root = useRef<Group>(null);
  const { actions, names } = useAnimations(animations, root);

  // Normalise the model: uniform scale to HEIGHT, centred on X and Z, feet on
  // the ground plane. This runs on the first render, before the groups below
  // it exist, so the box it measures is the model's own and carries none of
  // the transforms that are about to be put above it. The loaded scene graph
  // itself is left untouched, because useGLTF caches and shares it.
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

  useFrame((_, delta) => {
    if (!root.current) return;

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
    // reaches the head and the ground, and no further, is what stops the
    // figure being dragged off screen and lost.
    orbit.cursor.set(0, HEIGHT / 2, 0);
    orbit.maxTargetRadius = HEIGHT / 2;

    // Wide enough to contain every framing the buttons ask for, with room to
    // zoom past them in both directions.
    orbit.minDistance = HEIGHT * 0.2;
    orbit.maxDistance = HEIGHT * 4;

    // Stop just short of both poles, where the horizon flips over and the
    // figure is seen from directly overhead or from underneath the floor.
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
    goal.current = framing(preset, 35, size.width / size.height);
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

export default function MannequinScene() {
  const [view, setView] = useState<ViewId>("full");

  // Bumped on every press so that pressing the active button re-frames rather
  // than doing nothing.
  const [fitId, setFitId] = useState(0);

  function select(next: ViewId) {
    setView(next);
    setFitId((count) => count + 1);
  }

  const start = framing(VIEWS[0], 35, 1);

  return (
    <div className="relative h-full w-full">
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
          // Roughly the full-body framing. The first frame after mount corrects
          // it against the real aspect ratio of the column, so this only has to
          // be close enough not to be seen jumping.
          position: [0, start.focus + CAMERA_RISE, start.distance],
          near: 0.05,
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

        <Controls view={view} fitId={fitId} />
      </Canvas>

      {/* The row spans the canvas, so it passes clicks through everywhere the
          buttons themselves are not. Otherwise it would swallow drags along
          the whole width of that strip. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center gap-2">
        {VIEWS.map((option) => (
          <Button
            key={option.id}
            className="pointer-events-auto"
            size="sm"
            variant={option.id === view ? "default" : "outline"}
            // The button says which framing is showing, not just which one the
            // next press would give, so it is a state to announce.
            aria-pressed={option.id === view}
            onClick={() => select(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Start fetching the model as soon as this chunk is parsed, in parallel with
// React mounting the canvas, rather than waiting for the first render.
useGLTF.preload(MODEL_URL);
