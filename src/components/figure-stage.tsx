"use client";

import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Box3,
  Group,
  MathUtils,
  Mesh,
  SpotLight,
  Vector3,
  type AnimationAction,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import {
  Cloud,
  useErosion,
  type Transition,
} from "@/components/figure-particles";
import {
  COLUMN,
  FIGURES,
  HEIGHT,
  VIEWS,
  framing,
  versionOf,
  type VersionId,
  type ViewId,
} from "@/lib/figure";
import { named, poseClips } from "@/lib/pose-clip";
import { poseOf, type PoseId } from "@/lib/poses";
import { sampleSurface } from "@/lib/surface";

/*
 * The figure adrift on the right hand side of the page, together with the light
 * on it and the camera work that keeps it there.
 *
 * There is more than one figure now, and the tabs swap between them, as do the
 * version buttons between the takes on any one of them. Adding either is an
 * entry in FIGURES and nothing else: everything below is derived from whichever
 * model is loaded, from its own bounding box rather than from
 * numbers measured against a particular mesh, so a scan exported at a different
 * scale, in different units, or sitting off its own origin still lands upright,
 * centred and framed like the one before it.
 */

// Seconds per revolution. Slow enough to read as a turntable rather than as
// something spinning, and slow enough that a viewer trying to look at one side
// is not chased off it.
const TURN_SECONDS = 32;

// How far the figure rises and falls, in metres, and how long a full rise and
// fall takes. Nothing is holding it up out here, so it drifts; the amplitude is
// small enough that the framing does not visibly breathe with it.
const DRIFT = 0.05;
const DRIFT_SECONDS = 9;

/*
 * How many particles a figure is sampled into. This is a density over the
 * surface rather than a budget for the machine: the cloud has to be thick
 * enough, once it is spread over half a metre of empty space, to read as
 * something the figure was made of rather than as a handful of sparks thrown
 * off it.
 */
const MOTES = 26000;

/*
 * The swap between two figures, as a dispersal: the one being replaced crumbles
 * into its own particles and blows apart, and the arriving one condenses out of
 * the cloud that is left.
 *
 * The arrival is held back until the departure is well under way, so that for a
 * moment both clouds are in the air together and the stage is never empty. The
 * page's own first figure has no departure to wait for and takes longer over it,
 * because there is nothing else happening and it is the first thing seen.
 */
const OPENING_SECONDS = 2.4;
const GATHER_SECONDS = 1.5;
const GATHER_DELAY = 0.45;
const DISPERSE_SECONDS = 1.1;

/*
 * How long the figure takes to move from one pose into the next.
 *
 * A pose change is a blend rather than a cut, and this is short enough to
 * answer the press immediately while still being a move the eye can follow:
 * the figure is seen dropping into the squat rather than found already in it,
 * which is the whole of the joke. Shorter than any of the times above, because
 * unlike a change of figure this is one body doing one thing.
 */
const BLEND_SECONDS = 0.5;

/**
 * Which figures are doing what. A figure is in exactly one of these for the
 * whole of its life on stage.
 */
type Phase = "opening" | "arriving" | "leaving" | "settled";

// A figure that is not changing: whole, with no cloud drawn over it at all.
// What every transition starts from and ends at, and the only state a figure is
// ever in under reduced motion.
const SETTLED = { form: 1, fade: 0, solid: 1 };

/*
 * The three numbers that describe a figure part way through a change, given how
 * long it has been in its phase.
 *
 * form is where the particles are, fade is how brightly they are drawn and
 * solid is how much of the model's own surface is left. They are separate
 * curves rather than one, because the surface has to be gone before the cloud
 * is at its thickest on the way out and cannot come back until the cloud has
 * nearly landed on the way in. Tying all three to a single ramp put the solid
 * figure and the cloud of it on screen at the same time, which reads as a
 * double exposure rather than as a change of state.
 */
function progress(phase: Phase, age: number) {
  if (phase === "settled") return SETTLED;

  if (phase === "leaving") {
    const gone = MathUtils.clamp(age / DISPERSE_SECONDS, 0, 1);
    const left = 1 - gone;

    return {
      // Fast out of the surface and slowing as it goes, which is what something
      // thrown into a space with nothing in it does.
      form: left * left * left,
      fade:
        MathUtils.smoothstep(gone, 0, 0.1) *
        (1 - MathUtils.smoothstep(gone, 0.42, 1)),
      solid: 1 - MathUtils.smoothstep(gone, 0.03, 0.34),
    };
  }

  const over = phase === "opening" ? OPENING_SECONDS : GATHER_SECONDS;
  const delay = phase === "opening" ? 0 : GATHER_DELAY;
  const made = MathUtils.clamp((age - delay) / over, 0, 1);
  const left = 1 - made;

  return {
    form: 1 - left * left * left,
    fade:
      MathUtils.smoothstep(made, 0, 0.14) *
      (1 - MathUtils.smoothstep(made, 0.72, 1)),
    solid: MathUtils.smoothstep(made, 0.58, 0.96),
  };
}

function Model({
  url,
  shift,
  rise,
  yaw,
  pose,
  phase,
  still,
}: {
  url: string;
  shift: number;
  rise: number;
  yaw: number;
  pose: PoseId;
  phase: Phase;
  still: boolean;
}) {
  const { scene, animations } = useGLTF(url);
  const root = useRef<Group>(null);

  /*
   * The clips this figure can be asked for: the ones it was exported carrying,
   * and the poses in `src/lib/poses.ts` built onto its own skeleton.
   *
   * Both go into the one mixer, so a pose written by hand and a recording of
   * somebody standing still are the same kind of thing by the time anything
   * here has to choose between them, and blending between the two is no
   * different from blending between two recordings. A model with no skeleton
   * contributes nothing to the second list and is left with whatever it
   * arrived with, which for a photogrammetry scan is nothing at all.
   */
  const built = useMemo(() => poseClips(scene), [scene]);
  const clips = useMemo(() => [...animations, ...built], [animations, built]);

  const { actions, names, mixer } = useAnimations(clips, root);

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

  // The cloud this figure comes apart into and comes back together out of, and
  // the erosion of its own surface that the cloud is coming off. Both are
  // driven by the one set of numbers written below, once a frame.
  //
  // A ref, because they are written from inside the render loop, which is
  // outside anything React tracks, and because a value React hands back from a
  // hook is not one it allows to be written to.
  const transition = useRef<Transition>({
    form: { value: 1 },
    fade: { value: 0 },
    solid: { value: 1 },
  });
  const surface = useMemo(
    () => (still ? null : sampleSurface(scene, MOTES)),
    [scene, still],
  );

  useErosion(scene, transition);

  useEffect(() => {
    // A skinned mesh is culled against its bind pose, not its animated one, so
    // an arm swinging out of that box can flicker the whole figure away when
    // the camera is close. There is one figure on screen, two for a moment
    // while they change over; culling them saves nothing worth this.
    scene.traverse((object) => {
      if ((object as Mesh).isMesh) object.frustumCulled = false;
    });
  }, [scene]);

  /*
   * Which of those clips the pose being asked for comes down to.
   *
   * The clip a pose names wins over the shape it describes, for the one pose
   * that offers both: a model carrying a recording of somebody standing still
   * should play it rather than hold a standing shape written by hand. A rigged
   * scan carries no recordings at all, so it takes the shape. Failing both,
   * whatever clip the model does have, and failing that nothing, which is a
   * scan with no skeleton standing there as it was going to anyway.
   */
  const clip = useMemo(() => {
    const wanted = poseOf(pose);
    const shaped = wanted.frames ? named(wanted.id) : null;

    if (wanted.clip && names.includes(wanted.clip)) return wanted.clip;
    if (shaped && names.includes(shaped)) return shaped;
    return names[0];
  }, [pose, names]);

  // What the figure is holding now, so the next pose has something to blend out
  // of. A ref rather than state because nothing renders differently for it, and
  // because the blend below has to see the value the last press left rather than
  // the one this render was given.
  const holding = useRef<AnimationAction | null>(null);

  useLayoutEffect(() => {
    const action = clip ? actions[clip] : undefined;
    if (!action) return;

    const previous = holding.current;
    holding.current = action;

    /*
     * Already in this pose and still holding it, so there is nothing to do.
     *
     * Asking whether it is running, rather than trusting the ref alone, is what
     * makes a second run of this repair the first rather than assume it. React
     * runs an effect, tears it down and runs it again on mount in development,
     * and the teardown in between is the one belonging to the hook above, which
     * stops every action on the mixer. Returning on the ref by itself left the
     * figure stopped in its bind pose with this convinced it was mid idle.
     */
    if (previous === action && action.isRunning()) return;

    if (previous && previous !== action && !still) {
      // Out of the pose it was in and into the new one over the same moment, so
      // the figure travels between the two rather than being replaced by itself.
      // Not warped: these clips are of quite different lengths, and stretching a
      // two second idle onto a one second squat to match them up would slow the
      // breathing to a halt on the way out of it.
      //
      // The outgoing action is faded rather than stopped, and is left running at
      // no weight afterwards. There are four poses, so that is at most four
      // silent actions on a mixer that drops all of them together when the
      // figure leaves the stage. Stopping it here instead would take its own
      // fade out with it and cut the figure to the new pose on the frame of the
      // press, which is the thing this is here to avoid.
      action.reset().play().crossFadeFrom(previous, BLEND_SECONDS, false);
      return;
    }

    // Straight in at full weight, and the first frame of it written onto the
    // skeleton here rather than at the next tick of the render loop. Until a
    // clip is applied, a skinned mesh is drawn in its bind pose, which for this
    // model is the arms held straight out; fading the clip in from nothing
    // meant opening on that pose and then watching the arms drop into the idle
    // one. Starting already in the pose the figure is going to hold is what
    // standing there looks like. A layout effect, so this lands before the
    // first painted frame rather than one frame into it.
    //
    // Also the whole of a pose change under reduced motion, where a press is
    // answered with the figure already in the pose rather than with a move into
    // it. There the outgoing action is stopped outright, because there is no
    // fade left for it to be doing.
    previous?.stop();
    action.reset().play();
    mixer.update(0);
  }, [actions, mixer, clip, still]);

  // The clock has been running since the canvas was created, which is a second
  // or so of loading before this figure exists. Transition progress is
  // therefore measured from the first frame of the current phase rather than
  // from the canvas clock's origin.
  const phaseStarted = useRef<{ phase: Phase; at: number } | null>(null);

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    if (!phaseStarted.current || phaseStarted.current.phase !== phase) {
      phaseStarted.current = { phase, at: now };
    }

    const phaseAge = now - phaseStarted.current.at;

    // Under reduced motion there is no change to be part way through: the
    // figure is simply whole, and the cloud is never built or drawn.
    const at = still ? SETTLED : progress(phase, phaseAge);
    transition.current.form.value = at.form;
    transition.current.fade.value = at.fade;
    transition.current.solid.value = at.solid;
  });

  return (
    // Inside the shared turntable but outside the normalised model, so this
    // figure-specific alignment follows the common motion without being scaled.
    <group position={[shift, rise, 0]} rotation={[0, yaw, 0]}>
      <group ref={root}>
        <group scale={scale}>
          <group position={offset}>
            <primitive object={scene} />

            {/* Beside the model rather than around it, and under the same two
                groups, so that a cloud with no skeleton to carry it is scaled and
                stood on the ground plane with the figure it was taken off. A
                skinned one is carried by the bones instead, which are inside this
                same pair and so end up in the same place. */}
            {surface ? (
              <Cloud surface={surface} transition={transition} />
            ) : null}
          </group>
        </group>
      </group>
    </group>
  );
}

/*
 * Which figures are on stage. Normally one; during a swap, two, the one being
 * replaced blowing apart and its replacement condensing out of the cloud.
 *
 * The swap runs from an effect rather than straight off the prop because the
 * figure being replaced has to outlive the press that replaced it, and once
 * the prop has changed the only record of what was showing is here.
 */
function Stage({
  version,
  pose,
  still,
}: {
  version: VersionId;
  pose: PoseId;
  still: boolean;
}) {
  // The turntable belongs to the stage rather than to either model. Both the
  // departing and arriving figures consequently occupy the same angle during
  // a swap, and the next figure continues the exact tempo and position of the
  // one it replaces instead of mounting at its own zero rotation.
  const turntable = useRef<Group>(null);
  const age = useRef(0);

  useFrame((_, delta) => {
    const root = turntable.current;
    if (still || !root) return;

    // Turning the figures rather than the camera keeps the framing and light
    // fixed. Negative is clockwise seen from above. Delta is clamped because
    // a tab returning from the background reports the whole time it was away,
    // which would otherwise arrive as a jump.
    const elapsed = Math.min(delta, 0.1);
    const step = (Math.PI * 2) / TURN_SECONDS;
    age.current += elapsed;
    root.rotation.y -= step * elapsed;

    // There is nothing under the feet out here, so the stage rises and falls.
    // Driving every figure from this same age keeps their drift aligned too.
    const cycle = (Math.PI * 2) / DRIFT_SECONDS;
    root.position.y = Math.sin(age.current * cycle) * DRIFT;
  });

  const [cast, setCast] = useState<{
    arriving: VersionId;
    leaving: VersionId | null;
    phase: Phase;
  }>({ arriving: version, leaving: null, phase: "opening" });

  // Adjusted while rendering rather than from an effect. The swap is not a
  // synchronisation with anything outside React, it is the direct consequence
  // of the prop changing, and React re-runs this component with the new state
  // before it commits anything: the departing figure is never drawn a frame
  // still standing in its place.
  if (cast.arriving !== version) {
    setCast({
      arriving: version,
      // Under reduced motion the swap is a cut. Nothing comes apart; the new
      // figure is simply the one that is there.
      leaving: still ? null : cast.arriving,
      phase: still ? "settled" : "arriving",
    });
  }

  useEffect(() => {
    if (!cast.leaving) return;

    // Dropped on a timer rather than when its own dispersal reaches the end,
    // because that is measured in the render loop and a backgrounded tab does
    // not run one. A figure blown apart and then left there would otherwise
    // still be mounted, and still being drawn, whenever the tab came back.
    const timer = setTimeout(
      () => setCast((current) => ({ ...current, leaving: null })),
      DISPERSE_SECONDS * 1000,
    );

    return () => clearTimeout(timer);
  }, [cast.leaving]);

  const arriving = versionOf(cast.arriving);
  const leaving = cast.leaving ? versionOf(cast.leaving) : null;

  return (
    <group ref={turntable}>
      {/* A boundary each, not one around the pair. The arriving figure
          suspends on its model, and a boundary shared with the departing one
          would replace both with the fallback: the figure being replaced would
          vanish on the press instead of coming apart. The key belongs on the
          boundary rather than on Model: when an active figure moves into the
          leaving slot, React must move that whole boundary and preserve the
          live model instance. Remounting it here would restart its animation
          and transition and, because useGLTF shares the scene, could measure
          its normalisation while it was still parented under the previous
          instance's transforms. */}
      {leaving ? (
        <Suspense key={leaving.id} fallback={null}>
          <Model
            url={leaving.url}
            shift={leaving.shift}
            rise={leaving.rise}
            yaw={leaving.yaw}
            pose={pose}
            phase="leaving"
            still={still}
          />
        </Suspense>
      ) : null}

      <Suspense key={arriving.id} fallback={null}>
        <Model
          url={arriving.url}
          shift={arriving.shift}
          rise={arriving.rise}
          yaw={arriving.yaw}
          pose={pose}
          phase={cast.phase}
          still={still}
        />
      </Suspense>
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
function Controls({
  view,
  fitId,
  span,
}: {
  view: ViewId;
  fitId: number;
  span: number;
}) {
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
    //
    // span is here so that pressing for a pose the current framing cannot hold
    // steps the camera back far enough to hold it. It is a number rather than
    // the pose itself deliberately: every pose but the T pose leaves it at zero,
    // so moving between the other three does not re-run this and does not take
    // the camera off wherever the viewer has dragged it to.
    const preset = VIEWS.find((candidate) => candidate.id === view) ?? VIEWS[0];
    goal.current = framing(preset, (size.width * COLUMN) / size.height, span);
  }, [view, fitId, size, span]);

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

/*
 * The light hung above the stage.
 *
 * A spot rather than a bare point source, so it arrives as a cone aimed down
 * the figure instead of spilling evenly in every direction: the head and
 * shoulders take the hot middle of it and it falls away towards the feet, which
 * is what something lit from above looks like. Being a cone is also what lets it
 * be this bright without flattening the figure, since none of it goes anywhere
 * except onto the figure.
 *
 * Hung forward of the figure and off to one side rather than straight overhead,
 * where it would light the top of the head and leave the face in shadow. It
 * sits on the same side as the warm key below, so the two agree about where the
 * light in this scene is coming from.
 */
const OVERHEAD = [-1.3, HEIGHT * 2.05, 1.5] as const;

// What it is pointed at: the middle of the chest, a little above the halfway
// mark, so the brightest part of the cone lands on the part of the figure the
// framings are usually centred on.
const AIM = [0, HEIGHT * 0.55, 0] as const;

function Overhead() {
  const light = useRef<SpotLight>(null);

  // A spot light aims at a target object that three keeps beside the light
  // rather than inside it, and that by default is never added to the scene at
  // all. Nothing is going to compute a world matrix for an object that is not
  // in the graph, so it is written here, once, before the first frame.
  useLayoutEffect(() => {
    const spot = light.current;
    if (!spot) return;

    spot.target.position.set(...AIM);
    spot.target.updateMatrixWorld();
  }, []);

  return (
    <spotLight
      ref={light}
      position={OVERHEAD}
      // Wide enough to hold the whole figure at every framing, with the feet
      // well inside it: the edge of the cone is never a line drawn across the
      // model. The penumbra is what does the visible work, taking the light
      // down gradually over most of that width rather than at the rim.
      angle={0.52}
      penumbra={0.75}
      intensity={44}
      // Inverse square falloff, cut off far enough out that the window three
      // applies at the limit takes nothing off the figure itself.
      distance={12}
      decay={2}
      color="#fff1dc"
    />
  );
}

export default function FigureRig({
  version,
  pose,
  view,
  fitId,
  still,
}: {
  version: VersionId;
  pose: PoseId;
  view: ViewId;
  fitId: number;
  still: boolean;
}) {
  return (
    <>
      {/* The figure is the only lit thing in the scene: the sky and the stars
          draw themselves. A warm key from the front left, a violet fill from
          the opposite side so the shadowed half picks up the colour of the
          cloud it is floating in rather than going black, a warm spot hung
          above the stage and aimed down at the figure, and a cool rim from
          behind to hold the silhouette off a background of a similar value. */}
      <ambientLight intensity={0.5} color="#b9a8f0" />
      <directionalLight position={[3, 4, 4]} intensity={2.6} color="#fff4ea" />
      <directionalLight position={[-4, 2, -1]} intensity={0.9} color="#7b5ad6" />
      <directionalLight position={[0, 3, -5]} intensity={1.4} color="#cbb6ff" />
      <Overhead />

      <Stage version={version} pose={pose} still={still} />
      <Controls view={view} fitId={fitId} span={poseOf(pose).span ?? 0} />
    </>
  );
}

// Start fetching the figure the page opens on as soon as this chunk is parsed,
// in parallel with React mounting it, rather than waiting for the first render.
// The chunk itself is only loaded on a viewport wide enough to show a figure,
// so a phone never pays for either. The rest are fetched when a tab or a version
// button for them is hovered, which is the canvas's job rather than this one's.
useGLTF.preload(FIGURES[0].versions[0].url);
