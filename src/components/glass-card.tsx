"use client";

import { Slider } from "radix-ui";
import * as React from "react";

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
const CLEAREST = { fill: 0.4, blur: 4 };

/** The thickest: near enough white paper, the sky only a wash behind it. */
const FROSTIEST = { fill: 0.96, blur: 52 };

/*
 * Where the slider sits before anyone touches it: near the clear end, so the
 * card opens as a thin pane with the cloud still legible through it and the
 * frost is there to be reached for rather than started from. It is safe to open
 * this low because the floor above is set by the name, which is the only text
 * that sits on the glass rather than on a card of its own: at 0.4 it is still
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
  // Prefixed as well as not: this is the effect iOS is named for, and Safari
  // still wants it spelled its own way.
  const glass = `blur(${blur.toFixed(1)}px) saturate(150%)`;

  return (
    /* The shell holds the glass and clips it to the card's shape; the scrolling
       happens in the column inside, so the pane stays put while its contents
       move over it.

       The hairline of white on the top edge and the ring around it are the lit
       edge of a sheet of glass, and the shadows under them are the pane's
       contact with the sky, its thickness, and its own darkness thrown behind
       it.

       They are stacked the way they are because of how little room there is to
       cast into: the card is held 10px off the top, left and bottom of the
       window, so everything but the open half of the sky on its right is read
       in a band about a finger's width wide. A single wide, far thrown shadow
       spends all of its darkness outside that band and leaves the card looking
       pasted on, so the near layers do the work of lifting it. The contact
       line draws the edge, the unoffset halo puts darkness on the left and top
       as well as below (a shadow thrown straight down has nothing to show in
       the gutters at the sides), and the two thrown layers carry the weight out
       into the sky on the right, where there is depth to fall through. */
    <div
      className="pointer-events-auto relative isolate min-h-0 overflow-hidden rounded-[28px] ring-1 ring-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_3px_rgba(3,2,37,0.55),0_0_18px_-2px_rgba(3,2,37,0.5),0_12px_28px_-6px_rgba(3,2,37,0.6),0_40px_80px_-16px_rgba(3,2,37,0.85)]"
      style={{
        backgroundColor: `rgb(255 255 255 / ${fill.toFixed(3)})`,
        backdropFilter: glass,
        WebkitBackdropFilter: glass,
      }}
    >
      {/* A query container, so the name inside can size itself against this
          card's content box rather than the viewport, and keeps fitting if the
          split between the two halves ever changes. */}
      {/* Horizontally centred but top aligned: the name and the cards sit at
          the head of the card and grow downwards, rather than riding up and
          down with the height of the window. */}
      <div className="@container flex h-full min-h-0 flex-col items-center justify-start overflow-y-auto overscroll-contain px-4 pt-10 pb-6 sm:px-6 md:px-10 md:pt-12">
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
    <div className="mx-auto flex w-full max-w-[17rem] items-center gap-3 opacity-55 transition-opacity duration-200 focus-within:opacity-100 hover:opacity-100">
      <End>Clear</End>
      <Slider.Root
        className="relative flex flex-1 touch-none items-center select-none"
        value={[percent]}
        onValueChange={([next]) => onChange(next / 100)}
        min={0}
        max={100}
        step={1}
      >
        <Slider.Track className="relative h-1 grow overflow-hidden rounded-full bg-neutral-900/15">
          <Slider.Range className="absolute h-full bg-neutral-900/45" />
        </Slider.Track>
        <Slider.Thumb
          aria-label="How frosted the glass is"
          aria-valuetext={`${percent}% frosted`}
          className="block size-3.5 rounded-full bg-white shadow-[0_1px_3px_rgba(10,4,40,0.4)] ring-1 ring-neutral-900/15 focus-visible:ring-2 focus-visible:ring-neutral-900/45 focus-visible:outline-none"
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
