import type { CSSProperties, ReactNode } from "react";

import styles from "@/components/glass-card.module.css";

/*
 * The card, as a pane of glass held up in front of the sky.
 *
 * The nebula is not covered by it, it carries on behind: blurred, lightened and
 * a little more saturated than it really is, which is what a pane of glass does
 * to what is behind it and what makes the card read as part of the picture
 * rather than as a rectangle laid over it. The sky moves, so the card moves
 * with it.
 *
 * The pane is thin, and the two things that make it thin move together: the
 * fill is light enough to see the cloud through and the blur only softens it.
 * Taking one down without the other gives either a grey film over a sharp
 * picture or a milky panel with nothing behind it, and neither reads as glass.
 */

/*
 * How thin the pane is: most of the sky through, only softened. The floor here
 * is set by the name, which is the only text that sits on the glass rather than
 * on a card of its own: at this fill it is still black on pale lavender even
 * when the darkest part of the cloud passes behind it, and at 80px it is large
 * enough for that to be a comfortable read rather than a borderline one. The
 * saturation carries a little more of the cloud's colour than the fill alone
 * would leave, which is what keeps a pane this thin from reading as a wash.
 */
const CLEAR = { fill: 0.25, blur: 5.5, saturation: 1.46, brightness: 1.07 };

// Prefixed as well as not: this is the effect iOS is named for, and Safari
// still wants it spelled its own way.
const GLASS = `blur(${CLEAR.blur.toFixed(1)}px) saturate(${CLEAR.saturation.toFixed(2)}) brightness(${CLEAR.brightness.toFixed(2)})`;

const brightFill = Math.min(CLEAR.fill + 0.13, 0.96);
const middleFill = CLEAR.fill * 0.88;
const coolFill = CLEAR.fill * 0.68;
const SURFACE = `linear-gradient(145deg, rgb(255 255 255 / ${brightFill.toFixed(3)}) 0%, rgb(248 246 255 / ${middleFill.toFixed(3)}) 48%, rgb(224 232 255 / ${coolFill.toFixed(3)}) 100%)`;

export function GlassCard({ children }: { children: ReactNode }) {
  return (
    /* The shell holds the glass and clips it to the card's shape. On a wide
       window the scrolling happens in the column inside, so the pane stays put
       while its contents move over it; on a narrow one the pane is as tall as
       what is in it and the page scrolls instead, carrying the whole card up
       over the sky and past the figure in the band above it.

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
      className={`pointer-events-auto ${styles.surface}`}
      style={{
        "--texture-opacity": "0.032",
        background: SURFACE,
        backdropFilter: GLASS,
        WebkitBackdropFilter: GLASS,
      } as CSSProperties}
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
      {/* Height, and with it the scrolling, only from md up. Left to grow on a
          narrow window: the card is as tall as its contents and the page is what
          scrolls, which is what lets the figure's band sit above it rather than
          behind it. Taking the height here rather than clamping the card from
          outside keeps the 10px gutter even on the wide layout, where the pane
          is exactly the window and its contents move inside it. */}
      <div
        className={`@container flex min-h-0 flex-col items-center justify-start px-4 pt-10 pb-6 sm:px-6 md:h-full md:overflow-y-auto md:overscroll-contain md:px-10 md:pt-12 ${styles.content}`}
      >
        {children}
      </div>
    </div>
  );
}
