"use client";

import { useEffect, useRef, useState } from "react";

import { BAND } from "@/lib/figure";

/*
 * How much of the figure is left as the card is scrolled up over it.
 *
 * Only the narrow layout has anything to scroll: on a wide window the page is
 * exactly the window and this reports a figure permanently at full strength.
 */

/*
 * How far the page has to scroll before the figure is completely gone, as a
 * fraction of the band's own height.
 *
 * Less than the whole band on purpose. The figure has to be gone by the time the
 * card reaches the top of the window rather than at the moment it arrives there,
 * or the last of it is still dissolving behind a card that has already taken over
 * the screen.
 */
const FADE_OVER = 0.8;

/**
 * The figure's remaining strength, 1 at rest and 0 once it is scrolled away.
 *
 * Returned three ways because three different things need it and they need it at
 * three different rates. `veil` is read inside the render loop, every frame, and
 * is a ref so that writing it costs nothing; `overlay` is a wrapper whose opacity
 * is written along with it, so the figure's own buttons go with the figure; and
 * `shown` is React state, which changes only when the figure crosses into or out
 * of being gone entirely, and is what unmounts it so that a figure nobody can see
 * is not also being drawn.
 */
export function useBandVeil(active: boolean) {
  const veil = useRef({ value: 1 });
  const overlay = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    const write = (value: number) => {
      veil.current.value = value;
      setShown(value > 0);

      const wrapper = overlay.current;
      if (!wrapper) return;

      wrapper.style.opacity = `${value}`;
      // Hidden rather than merely transparent, because the buttons inside take
      // the pointer and one faded to nothing is still one that can be pressed.
      wrapper.style.visibility = value > 0 ? "visible" : "hidden";
    };

    // The wide layout is the window exactly and cannot scroll, so there is
    // nothing to measure and the figure is simply there.
    if (!active) {
      write(1);
      return;
    }

    // Coalesced onto a frame rather than run on the event. Scroll fires far more
    // often than the page is drawn, and every one of these reads the layout.
    let queued = 0;

    const measure = () => {
      queued = 0;

      const over = window.innerHeight * BAND * FADE_OVER;
      write(over > 0 ? Math.min(Math.max(1 - window.scrollY / over, 0), 1) : 0);
    };

    const schedule = () => {
      if (queued) return;
      queued = requestAnimationFrame(measure);
    };

    // The page can already be scrolled when this runs: a reload holds its
    // position, and so does a rotation from the wide layout into this one.
    measure();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (queued) cancelAnimationFrame(queued);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [active]);

  return { veil, overlay, shown };
}
