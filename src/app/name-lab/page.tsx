"use client";

import dynamic from "next/dynamic";
import { Orbitron } from "next/font/google";
import { Slider } from "radix-ui";
import * as React from "react";

/*
 * A bench for one question: how to make the name hold its own on the left card
 * when the glass is at the clear end of the slider.
 *
 * The name is the only text on the page that sits on bare glass rather than on
 * a card of its own, so at 0.4 fill it is read against whatever the nebula is
 * doing behind it. That is not uniformly dark, it swings: neutral-900 on the
 * plate is about 3.5:1 where the empty sky passes behind and about 11.6:1 where
 * a hot filament does. Which is why recolouring the letters cannot fix it. No
 * flat colour clears the whole swing, white least of all, since white goes the
 * other way and dies at 1.6:1 on the bright cloud. Anything that works has to
 * bring its own local background with it.
 *
 * So every variant below is that, in a different form, plus the two that change
 * the pane instead of the name. All eight sit on one slider and one backdrop, so
 * the only difference between two panes is the treatment.
 *
 * This route is a scratch bench, not part of the site. Delete it, and lab-sky
 * next to it, once the treatment is picked.
 */

// The sky only exists on the client, same as the page's own backdrop.
const LabSky = dynamic(() => import("./lab-sky"), { ssr: false });

// Variable, so a pane can ask for any weight without loading a face per weight.
// The card itself pins 700 today.
const orbitron = Orbitron({ subsets: ["latin"] });

/*
 * The glass, copied from GlassCard rather than imported, so that trying things
 * here cannot change the card. If a variant is adopted these have to stay in
 * step with the real ones.
 */
const CLEAREST = { fill: 0.4, blur: 4 };
const FROSTIEST = { fill: 0.96, blur: 52 };

function mix(from: number, to: number, at: number) {
  return from + (to - from) * at;
}

/*
 * The four colours the nebula shader mixes, offered as flat backdrops as well as
 * the live sky.
 *
 * The live sky is the honest test of how a variant feels, but it is a poor test
 * of whether it works: each pane sits over a different patch of cloud, so a
 * variant can look strong because it happened to land on a dark void and weak
 * because it landed on a filament. Dropping a flat swatch behind everything
 * puts all eight panes on the same value, and the void swatch is the worst case
 * the drifting cloud actually reaches.
 */
const BACKDROPS = {
  sky: { label: "Live sky", colour: null },
  void: { label: "Void", colour: "#0e0930" },
  deep: { label: "Deep", colour: "#33206e" },
  bright: { label: "Bright", colour: "#7d5bcf" },
  hot: { label: "Hot", colour: "#c6a2ee" },
} as const;

type BackdropId = keyof typeof BACKDROPS;

type Treatment = {
  id: string;
  label: string;
  note: string;
  /** Weight asked of the variable face. */
  weight: number;
  /** Extra classes on the name itself. */
  className?: string;
  /** The parts CSS has no Tailwind utility for. */
  style?: React.CSSProperties;
  /** Drawn behind the name, inside the pane. */
  behind?: "bloom" | "plate";
  /** Replaces how thin this pane's glass goes at the clear end. */
  clearest?: { fill: number; blur: number };
};

/*
 * The bloom, as a radial gradient rather than a blurred ellipse.
 *
 * A blurred shape still has an edge, just a soft one, and inside a pane this
 * short that edge lands where it can be seen: the name comes out sitting on a
 * lozenge of haze. A gradient that runs to fully transparent has no edge to
 * find at all, so what is left reads as the middle of the pane being thicker,
 * which is the thing it is meant to look like.
 */
const BLOOM =
  "radial-gradient(58% 92% at 50% 50%, rgba(255,255,255,0.62), rgba(255,255,255,0.34) 46%, rgba(255,255,255,0) 76%)";

/* A hairline of white under each letter and of dark above it: glass engraving. */
const ETCH =
  "0 1px 0 rgba(255,255,255,0.9), 0 -1px 0 rgba(10,4,40,0.18)";

const TREATMENTS: Treatment[] = [
  {
    id: "now",
    label: "1. As it is now",
    note: "Orbitron 700, neutral-900, bare glass. The one to beat.",
    weight: 700,
  },
  {
    id: "weight",
    label: "2. Heavier",
    note: "Orbitron 800 and a little tracking. Same ratio, more ink per letter, which is most of what reads as contrast at this size.",
    weight: 800,
    className: "tracking-[0.01em]",
  },
  {
    id: "bloom",
    label: "3. Frost bloom",
    note: "A soft white radial under the name only. No edge to see: it reads as the pane being thicker where the name is cut into it.",
    weight: 800,
    className: "tracking-[0.01em]",
    behind: "bloom",
  },
  {
    id: "halo",
    label: "4. White halo",
    note: "Stacked white shadows lift the background right at the stroke edges, which is where contrast is actually judged.",
    weight: 800,
    className: "tracking-[0.01em]",
    style: {
      textShadow:
        "0 0 2px rgba(255,255,255,0.9), 0 0 10px rgba(255,255,255,0.7), 0 0 24px rgba(255,255,255,0.5)",
    },
  },
  {
    id: "etched",
    label: "5. Etched",
    note: "A hairline of white below each letter and a hairline of dark above: how engraving on real frosted glass reads. Buys definition, not ratio.",
    weight: 800,
    className: "tracking-[0.01em]",
    style: { textShadow: ETCH },
  },
  {
    id: "outline",
    label: "6. White outline",
    note: "2px, with paint-order so the stroke sits under the fill instead of eating into the letterform. Watch the bowls of the a and the e.",
    weight: 700,
    style: {
      WebkitTextStroke: "2px rgba(255,255,255,0.92)",
      paintOrder: "stroke fill",
    },
  },
  {
    id: "plate",
    label: "7. Nameplate",
    note: "The name given a surface of its own, like every other piece of text on the card. The most robust, and the most likely to read as a fourth card.",
    weight: 800,
    className: "tracking-[0.01em]",
    behind: "plate",
  },
  {
    id: "floor",
    label: "8. Clear end raised to 0.55",
    note: "The name untouched, the pane never allowed as thin as 0.4. One number, and it costs exactly what the clear end is for.",
    weight: 700,
    clearest: { fill: 0.55, blur: 6 },
  },
  {
    id: "stack",
    label: "9. Heavier plus bloom plus etch",
    note: "2, 3 and 5 together, which is the one to actually ship if any of them are. None of the three is visible as an effect on its own.",
    weight: 800,
    className: "tracking-[0.01em]",
    style: { textShadow: ETCH },
    behind: "bloom",
  },
];

export default function NameLab() {
  const [frost, setFrost] = React.useState(0);
  const [backdrop, setBackdrop] = React.useState<BackdropId>("sky");

  const swatch = BACKDROPS[backdrop].colour;

  return (
    <>
      <div className="fixed inset-0 z-0 bg-[#0e0930]">
        {swatch ? (
          <div className="absolute inset-0" style={{ backgroundColor: swatch }} />
        ) : (
          <LabSky />
        )}
      </div>

      <div className="relative z-10 min-h-svh px-4 pb-16 sm:px-6">
        <Controls
          frost={frost}
          onFrost={setFrost}
          backdrop={backdrop}
          onBackdrop={setBackdrop}
        />

        <div className="mx-auto grid max-w-[1800px] gap-6 md:grid-cols-2">
          {TREATMENTS.map((treatment) => (
            <Pane key={treatment.id} treatment={treatment} frost={frost} />
          ))}
        </div>
      </div>
    </>
  );
}

function Pane({
  treatment,
  frost,
}: {
  treatment: Treatment;
  frost: number;
}) {
  const clearest = treatment.clearest ?? CLEAREST;
  const fill = mix(clearest.fill, FROSTIEST.fill, frost);
  const blur = mix(clearest.blur, FROSTIEST.blur, frost);
  const glass = `blur(${blur.toFixed(1)}px) saturate(150%)`;

  return (
    <section>
      <header className="mb-2 px-1">
        <h2 className="text-[13px] font-semibold text-white">
          {treatment.label}
        </h2>
        <p className="mt-0.5 max-w-[64ch] text-[12px] leading-snug text-white/65">
          {treatment.note}
        </p>
      </header>

      {/* The pane, with the card's own edge light, ring and shadows, so a
          variant is judged on the surface it would actually live on. */}
      <div
        className="relative isolate overflow-hidden rounded-[28px] ring-1 ring-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_2px_4px_rgba(3,2,37,0.2),0_36px_80px_-28px_rgba(3,2,37,0.9)]"
        style={{
          backgroundColor: `rgb(255 255 255 / ${fill.toFixed(3)})`,
          backdropFilter: glass,
          WebkitBackdropFilter: glass,
        }}
      >
        {/* A query container with the card's own padding, so the name sizes
            itself off the pane exactly as it does off the card. These panes are
            narrower than the real card, so the name lands near 60px here
            against the 46px to 80px the card gives it between a laptop and a
            wide display. */}
        <div className="@container flex flex-col items-center px-4 py-12 sm:px-6 md:px-10">
          <div className="relative">
            {treatment.behind === "bloom" && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-24 -inset-y-16 -z-10"
                style={{ backgroundImage: BLOOM }}
              />
            )}

            {treatment.behind === "plate" && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-6 -inset-y-3 -z-10 rounded-full bg-white/80 ring-1 ring-white/70"
              />
            )}

            <h1
              className={`${orbitron.className} ${treatment.className ?? ""} text-[min(5rem,7.3cqi)] leading-tight whitespace-nowrap text-neutral-900`}
              style={{ fontWeight: treatment.weight, ...treatment.style }}
            >
              Max Winter-Leinweber
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}

function Controls({
  frost,
  onFrost,
  backdrop,
  onBackdrop,
}: {
  frost: number;
  onFrost: (frost: number) => void;
  backdrop: BackdropId;
  onBackdrop: (backdrop: BackdropId) => void;
}) {
  const percent = Math.round(frost * 100);
  const fill = mix(CLEAREST.fill, FROSTIEST.fill, frost);

  return (
    <div className="sticky top-0 z-20 -mx-4 mb-6 bg-[#0e0930]/80 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-8 gap-y-4">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-white/70 uppercase">
            Clear
          </span>
          <Slider.Root
            className="relative flex w-56 touch-none items-center select-none"
            value={[percent]}
            onValueChange={([next]) => onFrost(next / 100)}
            min={0}
            max={100}
            step={1}
          >
            <Slider.Track className="relative h-1 grow overflow-hidden rounded-full bg-white/20">
              <Slider.Range className="absolute h-full bg-white/70" />
            </Slider.Track>
            <Slider.Thumb
              aria-label="How frosted the glass is"
              aria-valuetext={`${percent}% frosted`}
              className="block size-3.5 rounded-full bg-white shadow-[0_1px_3px_rgba(10,4,40,0.4)] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            />
          </Slider.Root>
          <span className="text-[11px] font-semibold tracking-[0.14em] text-white/70 uppercase">
            Frosted
          </span>
          <span className="text-[12px] tabular-nums text-white/50">
            {percent}% frost, {fill.toFixed(2)} fill
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-white/70 uppercase">
            Behind
          </span>
          {(Object.keys(BACKDROPS) as BackdropId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onBackdrop(id)}
              aria-pressed={backdrop === id}
              className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                backdrop === id
                  ? "bg-white text-neutral-900"
                  : "bg-white/10 text-white/75 hover:bg-white/20"
              }`}
            >
              {BACKDROPS[id].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
