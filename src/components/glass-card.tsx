"use client";

import { Slider } from "radix-ui";
import * as React from "react";

import styles from "@/components/glass-card.module.css";

/*
 * The card, as a pane of glass held up in front of the sky.
 *
 * The nebula is not covered by it, it carries on behind: blurred, lightened and
 * a little more saturated than it really is, which is what a frosted pane does
 * to what is behind it and what makes the card read as part of the picture
 * rather than as a rectangle laid over it. The sky moves, so the card moves
 * with it.
 *
 * How frosted the pane is can be slid, and the two things that make frost move
 * together: a clear pane is thin enough to see the cloud through and barely
 * blurs it, a frosted one is close to white paper and blurs the sky into a
 * wash. Sliding one without the other gives either a grey film over a sharp
 * picture or a milky panel with nothing behind it, and neither reads as glass.
 */

/** The thinnest the pane goes: most of the sky through, only softened. */
const CLEAREST = { fill: 0.3, blur: 7, saturation: 1.42, brightness: 1.08 };

/** The thickest: near enough white paper, the sky only a wash behind it. */
const FROSTIEST = {
  fill: 0.86,
  blur: 48,
  saturation: 1.12,
  brightness: 1.16,
};

/*
 * Where the slider sits before anyone touches it: near the clear end, so the
 * card opens as a thin pane with the cloud still legible through it and the
 * frost is there to be reached for rather than started from. It is safe to open
 * this low because the floor above is set by the name, which is the only text
 * that sits on the glass rather than on a card of its own: at 0.35 it is still
 * black on mid lavender even when the darkest part of the cloud passes behind
 * it, and at 80px it is large enough for that to be a comfortable read rather
 * than a borderline one.
 */
const OPENS_AT = 0.1;

function mix(from: number, to: number, at: number) {
  return from + (to - from) * at;
}

export function GlassCard({ children }: { children: React.ReactNode }) {
  const [frost, setFrost] = React.useState(OPENS_AT);

  const fill = mix(CLEAREST.fill, FROSTIEST.fill, frost);
  const blur = mix(CLEAREST.blur, FROSTIEST.blur, frost);
  const saturation = mix(CLEAREST.saturation, FROSTIEST.saturation, frost);
  const brightness = mix(CLEAREST.brightness, FROSTIEST.brightness, frost);
  // Prefixed as well as not: this is the effect iOS is named for, and Safari
  // still wants it spelled its own way.
  const glass = `blur(${blur.toFixed(1)}px) saturate(${saturation.toFixed(2)}) brightness(${brightness.toFixed(2)})`;
  const brightFill = Math.min(fill + 0.13, 0.96);
  const middleFill = fill * 0.88;
  const coolFill = fill * 0.68;
  const surface = [
    `linear-gradient(145deg, rgb(255 255 255 / ${brightFill.toFixed(3)}) 0%, rgb(248 246 255 / ${middleFill.toFixed(3)}) 48%, rgb(224 232 255 / ${coolFill.toFixed(3)}) 100%)`,
  ].join(", ");

  return (
    /* The shell holds the glass and clips it to the card's shape; the scrolling
       happens in the column inside, so the pane stays put while its contents
       move over it.

       The hairline of white on the top edge and the ring around it are the lit
       edge of a sheet of glass, and the three shadows are the pane's contact
       with the sky, its thickness, and its own darkness thrown well behind it. */
    <div
      className={`pointer-events-auto ${styles.surface}`}
      style={{
        "--texture-opacity": (0.035 + frost * 0.045).toFixed(3),
        background: surface,
        backdropFilter: glass,
        WebkitBackdropFilter: glass,
      } as React.CSSProperties}
    >
      <div aria-hidden="true" className={styles.specular} />
      <div aria-hidden="true" className={styles.texture} />
      <div aria-hidden="true" className={styles.rim} />

      {/* A query container, so the name inside can size itself against this
          card's content box rather than the viewport, and keeps fitting if the
          split between the two halves ever changes. */}
      {/* Horizontally centred but top aligned: the name and the cards sit at
          the head of the card and grow downwards, rather than riding up and
          down with the height of the window. */}
      <div
        className={`@container flex h-full min-h-0 flex-col items-center justify-start overflow-y-auto overscroll-contain px-4 pt-10 pb-6 sm:px-6 md:px-10 md:pt-12 ${styles.content}`}
      >
        {children}

        {/* Held at the foot of the card by the auto margin while there is room
            for it, and pushed below the contents rather than over them when
            there is not, which is what keeps it off the last card on a short
            window. */}
        <div className="mt-auto w-full pt-16">
          <FrostSlider frost={frost} onChange={setFrost} />
        </div>
      </div>
    </div>
  );
}

/*
 * Radix's slider parts rather than the one in ui/, because the thumb is what
 * carries the control's name for a screen reader and that one gives its thumb
 * no way to be named, and because this one is dressed for glass rather than for
 * the app's own surfaces.
 *
 * Quiet until it is wanted: it sits at half strength in the empty foot of the
 * card and comes up when the pointer or the keyboard reaches it.
 */
function FrostSlider({
  frost,
  onChange,
}: {
  frost: number;
  onChange: (frost: number) => void;
}) {
  const percent = Math.round(frost * 100);

  return (
    <div className="mx-auto flex w-full max-w-[17rem] items-center gap-3 opacity-65 transition-opacity duration-200 focus-within:opacity-100 hover:opacity-100">
      <End>Clear</End>
      <Slider.Root
        className="relative flex flex-1 touch-none items-center select-none"
        value={[percent]}
        onValueChange={([next]) => onChange(next / 100)}
        min={0}
        max={100}
        step={1}
      >
        <Slider.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-white/28 shadow-[inset_0_1px_2px_rgba(26,15,70,0.25),0_1px_0_rgba(255,255,255,0.45)]">
          <Slider.Range className="absolute h-full rounded-full bg-neutral-900/38" />
        </Slider.Track>
        <Slider.Thumb
          aria-label="How frosted the glass is"
          aria-valuetext={`${percent}% frosted`}
          className="block size-4 rounded-full bg-[linear-gradient(145deg,#fff_20%,#dfe5fa_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_5px_rgba(10,4,40,0.38)] ring-1 ring-neutral-900/18 focus-visible:ring-2 focus-visible:ring-neutral-900/45 focus-visible:outline-none"
        />
      </Slider.Root>
      <End>Frosted</End>
    </div>
  );
}

function End({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="text-[10px] leading-none font-semibold tracking-[0.14em] text-neutral-600 uppercase select-none"
    >
      {children}
    </span>
  );
}
