/*
 * The poses the figure can be put into, written as joint rotations.
 *
 * Kept free of three.js, and of anything that knows how to build a clip, for
 * the same reason the framing numbers are: the buttons that offer these sit on
 * the canvas, which is on the page from the first paint, while the skeleton
 * they are applied to is inside the chunk a narrow screen never loads. Only the
 * labels cross that split. Turning one of these into something a mixer can play
 * is `src/lib/pose-clip.ts`, on the far side of it.
 *
 * A pose is one of two things. It is either the name of a clip the model was
 * exported carrying, which is how the placeholder stands still and breathes,
 * or it is a set of joint rotations written out below. The second kind is the
 * one worth having. A photogrammetry scan arrives with no clips at all, so
 * anything it is ever going to do has to be described somewhere that is not the
 * model, and a rotation per joint is small enough to write by hand and to read
 * back later, which a few megabytes of baked animation is not.
 *
 * None of this can make an unrigged model move. A pose is a set of instructions
 * for a skeleton, and a scan exported straight out of photogrammetry is a
 * single mesh with no skeleton to give them to. What it does mean is that a scan
 * that comes back from an auto rigger needs no number here retuned, provided it
 * comes back bound in a T-pose: every rotation below is measured from where a
 * joint rests, so a rig bound with its arms already down takes the arm poses a
 * second time and folds them through its own chest. Legs are indifferent to it,
 * resting hanging down either way. See `public/models/README.md`.
 */

/*
 * The axes every rotation below is measured about, and the frame it is measured
 * in.
 *
 * The figure stands with +Y up, faces +Z, and +X is its own left. So a rotation
 * about X pitches a joint forwards and backwards, about Y turns it on the spot,
 * and about Z tips it out to the side. Degrees, and applied in X, Y, Z order.
 *
 * Each joint's rotation is measured in its parent's frame rather than the
 * figure's, which for a joint hanging off the hips or the spine is the same
 * thing, because those sit unrotated at rest. Further down a limb it is the
 * difference between a number that means something and one that does not: an
 * elbow written this way is 60 degrees of elbow however the shoulder above it
 * happens to be turned, which is what lets the arm poses below be dropped into
 * a frame without being rethought.
 *
 * Two directions worth writing down, because the sign is not guessable and
 * every number below depends on it. A joint that hangs downwards at rest, which
 * is every joint in a leg, swings backwards under a positive X and forwards
 * under a negative one. A joint that points upwards, which is the spine and the
 * neck, does the opposite.
 */

/** Degrees. An axis left out is not turned. */
export type Turn = { readonly x?: number; readonly y?: number; readonly z?: number };

/**
 * The joints to turn and how far, keyed by their name in the rig with any
 * prefix left off: `LeftUpLeg` rather than `mixamorig:LeftUpLeg`, so that a rig
 * whose exporter rewrote the prefix, which Blender does, still matches. Every
 * joint not named here is left at rest.
 */
export type Shape = Readonly<Record<string, Turn>>;

/** A shape and the moment in the pose it is held at, in seconds. */
export type Frame = { readonly at: number; readonly shape: Shape };

export type Pose = {
  readonly id: string;
  readonly label: string;
  /**
   * A clip the model itself carries, by name. Falls back to the model's first
   * clip, and then to standing at rest, so a figure that has never heard of
   * this clip still has something to do.
   */
  readonly clip?: string;
  /** Or a shape to hold, or several to move between. */
  readonly frames?: readonly Frame[];
  /**
   * How wide the figure gets in this pose, as a fraction of its height, for a
   * pose that reaches wider than the framing allows for. The same kind of
   * number as a view's own width, and taken instead of it when it is the larger
   * of the two, so that the camera holds whichever of the two is really the
   * thing that must not be cropped.
   *
   * Only a pose that needs it says anything. Left out, a pose is framed exactly
   * as the figure standing still is, and pressing for it does not move the
   * camera at all.
   */
  readonly span?: number;
};

/*
 * The same shape on the other side of the body.
 *
 * A pose reflected across the figure's centre line swaps its left and right
 * joints, and on the rotations themselves keeps the pitch while reversing the
 * turn and the tip. That is what a reflection does to a rotation, and it is
 * exact rather than an approximation, so a walk written for one side is a walk
 * on the other. Worth having for anything with a stride in it: the alternative
 * is writing both halves out and finding out later that one of the signs was
 * wrong.
 */
export function mirror(shape: Shape): Shape {
  const flipped: Record<string, Turn> = {};

  for (const [joint, turn] of Object.entries(shape)) {
    const other = joint.startsWith("Left")
      ? `Right${joint.slice(4)}`
      : joint.startsWith("Right")
        ? `Left${joint.slice(5)}`
        : joint;

    flipped[other] = {
      ...(turn.x === undefined ? {} : { x: turn.x }),
      ...(turn.y === undefined ? {} : { y: -turn.y }),
      ...(turn.z === undefined ? {} : { z: -turn.z }),
    };
  }

  return flipped;
}

/*
 * A hand left alone rather than held open.
 *
 * Worth the twenty lines because of what a rig rests in. A Mixamo skeleton is
 * bound with the fingers straight and spread, so a pose that says nothing about
 * them gets that: flat palms and splayed fingers, which on a figure squatting
 * with its arms out in front reads as jazz hands. The recorded clips all curl
 * the fingers, which is why the placeholder standing still has never looked
 * wrong, and it is only the poses written here that have to say so.
 *
 * The knuckles are the same joint three times over, so the curl runs down the
 * digit rather than being written per joint, tightening a little towards the
 * tip. The thumb takes less of it, having further to go before it fouls the
 * palm.
 */
const KNUCKLES = [16, 26, 22];
const DIGITS = ["Index", "Middle", "Ring", "Pinky"];

function hand(side: "Left" | "Right"): Shape {
  // The fingers point along the arm, out to the side, so curling them into the
  // palm is a tip about the axis the figure faces along, and the two hands
  // curl opposite ways for the same reason their arms hang opposite ways.
  const inwards = side === "Left" ? -1 : 1;
  const shape: Record<string, Turn> = {};

  for (const digit of [...DIGITS, "Thumb"]) {
    const share = digit === "Thumb" ? 0.45 : 1;
    KNUCKLES.forEach((curl, knuckle) => {
      shape[`${side}Hand${digit}${knuckle + 1}`] = { z: inwards * curl * share };
    });
  }

  return shape;
}

const HANDS: Shape = { ...hand("Left"), ...hand("Right") };

/*
 * Standing there, which is only a pose worth writing because of what a rigged
 * scan arrives as.
 *
 * The placeholder has a recording of somebody standing still and uses that. A
 * scan that has been through an auto rigger has no clips at all, and it rests in
 * the T it had to be bound in, so without this its Default would be the T pose
 * under another name. Arms down, elbows soft, and nothing else: the scan's own
 * stance, the width of its feet and the set of its shoulders, is already in the
 * rig and does not want overriding.
 */
const STAND: Shape = {
  ...HANDS,
  LeftArm: { x: -6, z: -81 },
  LeftForeArm: { y: -14 },
  RightArm: { x: -6, z: 81 },
  RightForeArm: { y: 14 },
};

/*
 * Sitting into a deep squat: thighs down past horizontal, knees bent under and
 * splayed a little outside the feet, ankles taking the difference so the soles
 * stay flat, and the arms out in front as the counterweight they are.
 *
 * Nothing here says how far the hips drop, and that is deliberate. Bending the
 * legs this far lifts the feet most of half a metre off the floor, and the
 * amount the hips have to come down to put them back is a consequence of how
 * long this particular rig's thighs and shins are. Solving it against the
 * skeleton, which is what the builder does, means the same numbers below sit a
 * short scan and a tall one both squarely on the ground.
 */
const SQUAT: Shape = {
  ...HANDS,

  LeftUpLeg: { x: -74, z: 13 },
  LeftLeg: { x: 108 },
  LeftFoot: { x: -34 },
  RightUpLeg: { x: -74, z: -13 },
  RightLeg: { x: 108 },
  RightFoot: { x: -34 },

  // Chest forward over the knees, which is where the weight has to be, and then
  // the neck back the other way so the figure is looking ahead rather than at
  // the floor.
  Spine: { x: 11 },
  Spine1: { x: 9 },
  Spine2: { x: 6 },
  Neck: { x: -12 },
  Head: { x: -10 },

  // Down out of the T and swung forward, elbows soft.
  LeftArm: { x: -66, z: -76 },
  LeftForeArm: { y: -62 },
  RightArm: { x: -66, z: 76 },
  RightForeArm: { y: 62 },
};

/*
 * One half of the shuffle: the left foot flat and forward, the right heel
 * popped high behind it, hips turned into the step and the arms swinging
 * against the legs.
 *
 * It is the dance move rather than the illusion. A moonwalk reads as a moonwalk
 * because the flat foot slides backwards along a floor while the body does not,
 * and out here there is no floor to slide along and nothing near the figure to
 * measure it against. What survives without one is the shape: the heel pops,
 * the knee break, the lean and the counterswing, alternating. That is the funny
 * part anyway.
 */
const GLIDE: Shape = {
  ...HANDS,

  // Left hip carried forward with the leading leg.
  Hips: { y: -7 },

  // Planted: near straight, and the ankle set so the sole finishes level.
  LeftUpLeg: { x: -24, z: 2 },
  LeftLeg: { x: 14 },
  LeftFoot: { x: 10 },

  /*
   * Popped: knee broken, ankle driven over so the figure is up on the toe.
   *
   * The thigh comes forward here rather than trailing behind, which looks wrong
   * written down and is right on the figure. A leg thrown backwards from the hip
   * puts the foot a long way behind the body, and since the builder keeps the
   * figure standing in the middle of its own feet, a stride that reaches further
   * back than it does forward is one that walks the whole figure off the axis it
   * is being turned on. Breaking at the knee instead keeps the toe under the
   * body, which is where somebody up on it actually stands.
   */
  RightUpLeg: { x: -6, z: -2 },
  RightLeg: { x: 36 },
  RightFoot: { x: 52 },

  Spine: { x: 6, y: 4 },
  Spine1: { x: 4, y: 3 },
  Neck: { x: -5, y: 3 },
  Head: { x: -4, y: 4 },

  // Opposite the legs, as an arm is: the left leg leads, so the right arm does.
  LeftArm: { x: 24, z: -68 },
  LeftForeArm: { y: -38 },
  RightArm: { x: -26, z: 68 },
  RightForeArm: { y: 38 },
};

/*
 * The moment between the two halves, with the feet level and both heels just
 * off the floor. Symmetrical, so it serves for the pass in either direction.
 *
 * It exists to keep the step from being a straight swing between one side and
 * the other, which is a sway rather than a walk. The legs are also straighter
 * here and both toes are down, which lifts the figure four centimetres or so as
 * it passes through, because the builder stands a pose on its own feet and this
 * is a pose standing on two of them. That is deliberately small. A moonwalk is
 * smooth, and a figure bobbing through the middle of every step is marching.
 */
const PASS: Shape = {
  ...HANDS,

  LeftUpLeg: { x: -4 },
  LeftLeg: { x: 10 },
  LeftFoot: { x: 26 },
  RightUpLeg: { x: -4 },
  RightLeg: { x: 10 },
  RightFoot: { x: 26 },

  Spine: { x: 6 },
  Spine1: { x: 4 },
  Neck: { x: -5 },
  Head: { x: -3 },

  LeftArm: { z: -70 },
  LeftForeArm: { y: -36 },
  RightArm: { z: 70 },
  RightForeArm: { y: 36 },
};

/*
 * A step and its mirror, closing on the shape it opened with so the loop has no
 * seam in it. The pass is given the short end of each half: a long slide and a
 * quick change of feet is the rhythm, and splitting the beat evenly turns it
 * into a march.
 */
const MOONWALK: readonly Frame[] = [
  { at: 0, shape: GLIDE },
  { at: 0.55, shape: PASS },
  { at: 0.7, shape: mirror(GLIDE) },
  { at: 1.25, shape: PASS },
  { at: 1.4, shape: GLIDE },
];

/*
 * The poses the buttons offer, in the order they are offered.
 *
 * The first entry is what every figure opens on. It is the model's own idle
 * clip, which on the placeholder is a real recording of somebody standing
 * still, and which no amount of joint rotations written by hand is going to
 * beat. The rest are written here and so belong to no model in particular.
 *
 * The T pose is the empty shape, which is not a joke: it is the pose the
 * skeleton was bound in, and the one every rig sits in with nothing applied to
 * it. Asking for it is asking for nothing to be applied.
 */
export const POSES = [
  /*
   * Two ways of standing there, and the model decides which it gets. A model
   * carrying `idle` plays it, because a recording of a person standing still
   * beats anything written by hand. A rigged scan, which carries no clips,
   * falls back to the shape.
   */
  {
    id: "default",
    label: "Default",
    clip: "idle",
    frames: [{ at: 0, shape: STAND }],
  },
  /*
   * The span is the one number a T pose needs and no other pose does. Arms
   * straight out is the widest a figure gets, and a standing person is about as
   * far across the fingertips as they are tall, which is the only proportion on
   * this page old enough to be named after Vitruvius. Without it the hands are
   * cropped off the side of the window for about a fifth of every turn, which
   * is exactly long enough to notice and to be unable to say why.
   *
   * Measured, the placeholder spans 0.955 of its height and the scan 0.996, so
   * the ratio Vitruvius gives is both the rounder number and the safer one.
   */
  {
    id: "t-pose",
    label: "T-pose",
    frames: [{ at: 0, shape: {} }],
    span: 1.0,
  },
  { id: "squat", label: "Squat", frames: [{ at: 0, shape: SQUAT }] },
  { id: "moonwalk", label: "Moonwalk", frames: MOONWALK },
] as const satisfies readonly Pose[];

export type PoseId = (typeof POSES)[number]["id"];

export function poseOf(id: PoseId): Pose {
  return POSES.find((candidate) => candidate.id === id) ?? POSES[0];
}
