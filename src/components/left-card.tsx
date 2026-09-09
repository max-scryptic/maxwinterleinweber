import { Grandstander } from "next/font/google";
import * as React from "react";

import { SaasCards } from "@/components/saas-cards";
import { SocialCards } from "@/components/social-cards";

const grandstander = Grandstander({ subsets: ["latin"], weight: "700" });

/*
 * The card the page is written on, and the handful of ways it can be dressed.
 *
 * The cards inside it are not touched by any of this: the social pills and the
 * build cards draw themselves, and everything here is the surface they sit on,
 * the light falling on it, and the space between the groups. Swapping designs
 * therefore cannot move a pill or restyle a build.
 *
 * Each design is a fill, an edge, a shadow and at most one painted light. They
 * are kept as data rather than as five copies of the markup so that the layout
 * below is written once and the difference between them stays readable as the
 * few lines it actually is.
 */

type Design = {
  /** The card's shape, fill, edge and shadow. */
  surface: string;
  /**
   * A light painted on the card rather than in it. It is pinned to the card,
   * so it stays where it falls while the contents scroll underneath it.
   */
  wash?: string;
  /** Each group of cards introduced by a small label between two rules. */
  labelled?: boolean;
};

/*
 * The flat card the page has been wearing: one grey, one shadow, square-ish
 * corners. Kept so the others can be held against it.
 */
const current: Design = {
  surface: "rounded-2xl bg-[#f4f4f4] shadow-[0_6px_24px_rgba(0,0,0,0.18)]",
};

/*
 * The same card, made of something.
 *
 * The fill falls off towards the bottom and a hairline of white sits on the top
 * edge, which is what a lit sheet does and what stops the surface reading as a
 * flat fill. The shadow is three: a tight contact shadow that pins the card to
 * the sky, a mid one that gives it thickness, and a wide soft one that is the
 * card's own darkness spread across the space behind it. One shadow can do any
 * of those; it cannot do all three.
 */
const lifted: Design = {
  surface: [
    // The via stop is what keeps a tall card from spending its whole height
    // sliding into grey: most of the sheet stays paper white and the fall off
    // happens across the last of it.
    "rounded-[28px] bg-linear-to-b from-white via-[#f7f7f8] to-[#eaeaee] ring-1 ring-black/[0.06]",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(10,4,40,0.12),0_12px_28px_-14px_rgba(10,4,40,0.45),0_48px_88px_-40px_rgba(4,2,30,0.9)]",
  ].join(" "),
};

/*
 * The card as a pane of glass held up in front of the sky.
 *
 * The nebula carries on behind it, blurred and lightened rather than covered,
 * so the card belongs to the picture instead of being pasted onto it. The fill
 * is held at 78% because that is about where the violet still comes through and
 * the name is still black on near white; thinner than that and the text starts
 * fighting whatever the sky happens to be doing behind it.
 */
const frosted: Design = {
  surface: [
    "rounded-[28px] bg-white/[0.78] backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-white/60",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_2px_4px_rgba(3,2,37,0.2),0_36px_80px_-28px_rgba(3,2,37,0.9)]",
  ].join(" "),
};

/*
 * The card lit by the sky it is standing in.
 *
 * A violet light spills over the top edge and dies out behind the name, and the
 * shadow it casts is violet rather than black, as a shadow under that sky would
 * be. The fill is off white with the barest amount of the same violet in it, so
 * the whole card sits in the page's palette without ever leaving white paper.
 */
const aurora: Design = {
  surface: [
    "rounded-[28px] bg-[#f7f6fb] ring-1 ring-white/70",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(30,14,80,0.14),0_40px_84px_-34px_rgba(76,42,150,0.95)]",
  ].join(" "),
  wash: [
    "radial-gradient(120% 52% at 50% -10%, rgba(150,110,214,0.34), rgba(150,110,214,0.08) 46%, transparent 72%)",
    "radial-gradient(80% 40% at 88% 108%, rgba(120,86,196,0.16), transparent 70%)",
  ].join(", "),
};

/*
 * The card as a page rather than a panel.
 *
 * Same lit sheet as the lifted card, with the two groups given their own names
 * and a rule apiece. The card is doing the work the gap between the groups was
 * doing before, so the gap comes in: the label already says a new group has
 * started, and 5rem of blank paper on top of that reads as a mistake.
 */
const editorial: Design = {
  surface: lifted.surface,
  labelled: true,
};

const designs = { current, lifted, frosted, aurora, editorial };

export type CardDesign = keyof typeof designs;

export const cardDesigns = Object.keys(designs) as CardDesign[];

/** The design the card is wearing unless the page is asked for another. */
export const defaultCardDesign: CardDesign = "lifted";

/** Reads a design off a URL, falling back rather than failing on a bad name. */
export function asCardDesign(value: string | string[] | undefined): CardDesign {
  return typeof value === "string" && value in designs
    ? (value as CardDesign)
    : defaultCardDesign;
}

/*
 * A group's name, held between two rules that fade out as they leave it. The
 * rules are capped at the width of a build card so the header sits over the
 * cards rather than running past them to the edges of a wide card.
 */
function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[26rem] items-center gap-3">
      <span
        aria-hidden="true"
        className="h-px flex-1 bg-linear-to-r from-transparent to-neutral-300"
      />
      <span className="text-[11px] leading-none font-semibold tracking-[0.2em] text-neutral-400 uppercase">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="h-px flex-1 bg-linear-to-l from-transparent to-neutral-300"
      />
    </div>
  );
}

export function LeftCard({ design: name }: { design: CardDesign }) {
  const design = designs[name];

  return (
    /* The shell holds the surface and clips the light to it; the scrolling
       happens in the column inside, so a wash stays pinned to the card instead
       of sliding up out of it with the contents. */
    <div
      className={`pointer-events-auto relative isolate min-h-0 overflow-hidden ${design.surface}`}
    >
      {design.wash ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ backgroundImage: design.wash }}
        />
      ) : null}

      {/* A query container, so the name below can size itself against this
          card's content box rather than the viewport, and keeps fitting if
          the split between the two halves ever changes. */}
      {/* Horizontally centred but top aligned: the name and the cards sit at
          the head of the card and grow downwards, rather than riding up and
          down with the height of the window. */}
      <div className="@container flex h-full min-h-0 flex-col items-center justify-start overflow-y-auto overscroll-contain px-4 pt-10 pb-10 sm:px-6 md:px-10 md:pt-12 md:pb-10">
        {/* The name is set on one line at any width: "Max Winter-Leinweber"
            in Grandstander 700 measures 9.375% of its own font size per
            character of column width, i.e. it exactly fills the column at
            9.375cqi, so 9cqi fits it with a little air at both ends. The cap
            stops it growing without limit on very wide displays. */}
        <h1
          className={`${grandstander.className} text-[min(5rem,9cqi)] leading-tight whitespace-nowrap text-neutral-900`}
        >
          Max Winter-Leinweber
        </h1>

        <div className="mt-8 w-full md:mt-10">
          {design.labelled ? <GroupLabel>Channels</GroupLabel> : null}
          <div className={design.labelled ? "mt-5" : undefined}>
            <SocialCards />
          </div>
        </div>

        {/* The builds sit well clear of the social row, so the two read as
            separate groups rather than one block of cards. */}
        <div
          className={
            design.labelled ? "mt-12 w-full md:mt-14" : "mt-16 w-full md:mt-20"
          }
        >
          {design.labelled ? <GroupLabel>Building</GroupLabel> : null}
          <div className={design.labelled ? "mt-5" : undefined}>
            <SaasCards />
          </div>
        </div>
      </div>
    </div>
  );
}
