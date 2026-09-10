"use client";

import * as React from "react";

/*
 * The row's track, and the one thing about it that cannot be said in CSS.
 *
 * Holding the row still under a pointer is the easy half, and `:hover` with
 * `animation-play-state: paused` says it in a line. The trouble is which frame
 * it stops on. A transform-only animation is handed to the compositor and
 * ticked there at the display's rate, while the main thread reaches it once per
 * main-thread frame and its decisions only reach the screen at the end of the
 * frame that made them. Stopping is a main-thread decision, so the row is
 * pinned to the time the main thread read on the way in, and by the time that
 * pinning is drawn the compositor has already carried the row further left. The
 * row is put back to where it was when the pointer arrived, which is a jump to
 * the RIGHT of every card at once.
 *
 * How far back is the length of a main-thread frame, and this page is drawing a
 * sky behind the card, so its frames are not 16ms and not the same length
 * twice. That is the whole of the reported fault: the cards slide left, and
 * then all of them snap right together, sometimes and not others. Measured off
 * the painted frames rather than off the DOM, an idle page threw the row back
 * 11px and a page held to 700ms frames threw it back 28px, a third of a card.
 *
 * No pause API avoids it. `animation-play-state`, `Animation.pause()` and
 * `updatePlaybackRate(0)` were each measured and each snapped back by the same
 * amount, because the snap is not about how the stop is asked for. It is about
 * the stop being drawn later than it was decided, while the row kept moving in
 * between.
 *
 * So nothing here ever asks the compositor to stop anything. The row is handed
 * a replacement animation that AGREES WITH THE MARQUEE to begin with: for its
 * first stretch it travels the same path at the same speed, and only after that
 * does it ease down to a stop. It does not matter which frame the swap lands
 * on, because on every frame it could land on, the two say the same thing.
 * Letting go is the same trick backwards: the replacement stays still for a
 * stretch before easing back up to speed, and hands the row back to the marquee
 * at a moment picked in advance rather than whenever the browser gets round to
 * it.
 *
 * Everything else about the row is still CSS and still rendered on the server.
 * The cards arrive here as children, so they stay out of the client bundle, and
 * with no JavaScript at all the row simply runs on without ever pausing, which
 * is what it degrades to rather than anything broken.
 */

/*
 * How long the row takes to come to rest once it starts slowing, and the bounds
 * on the stretch before that. The stretch is the margin the fault needs: any
 * frame shorter than it is hidden completely. It is measured (see below), then
 * kept within a range that filters brief pointer passes at the low end and
 * still covers a page in real trouble at the high end.
 */
const SETTLE = 350;
/*
 * A short pass across the row should not leave a stop-and-start ripple behind
 * it. 300ms is long enough to distinguish a pointer crossing the row from one
 * that has settled over a link, while still bringing an intentional hover to
 * rest in under a second.
 */
const MIN_COAST = 300;
const MAX_COAST = 2000;

// Off full speed to nothing, and back, each starting the way the other one
// finished so the two read as one movement rather than two.
const TO_REST = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const OFF_REST = "cubic-bezier(0.64, 0, 0.78, 0.39)";

const frac = (x: number) => x - Math.floor(x);

type Track = {
  el: HTMLUListElement;
  marquee: Animation;
  /** One turn, in ms. */
  period: number;
  /** How far one turn travels, as a percentage of the track's width. Negative. */
  shift: number;
  /** Percent per ms. Negative. */
  speed: number;
};

/*
 * A ramp that has been laid down: what it is doing, and the numbers it was
 * worked out from. They are all absolute times and percentages fixed when it
 * was made, so nothing here ever has to ask where the row is right now, which
 * is the one question this thread cannot answer.
 */
type Ramp = {
  stopping: boolean;
  animation: Animation;
  /** The clock reading the ramp's own path is measured from. */
  anchor: number;
  from: number;
  coastEnds: number;
  ends: number;
  endsAt: number;
  /** Set once the coast has been cut to a measured frame, so it is cut once. */
  fitted: boolean;
};

export function MarqueeTrack({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const el = React.useRef<HTMLUListElement>(null);

  /*
   * The row's own animation, kept rather than looked up each time: a stop takes
   * it off the element entirely (see below), and a cancelled animation is no
   * longer among the element's, so this is the only way back to it.
   */
  const marquee = React.useRef<Animation | null>(null);
  const ramp = React.useRef<Ramp | null>(null);
  /*
   * The finished stop that is holding the row still, and where it is holding
   * it. Null while the row moves. It is kept because a finished ramp goes on
   * applying its last frame, and letting go means taking it off again.
   */
  const resting = React.useRef<{ at: number; animation: Animation } | null>(
    null,
  );

  /*
   * Two independent reasons to hold the row: a pointer on it, and the keyboard
   * inside it. They are kept apart because they overlap, and a pointer leaving
   * a card that has just been tabbed to must not start the row moving out from
   * under the keyboard.
   */
  const holding = React.useRef({ pointer: false, focus: false });

  const read = React.useCallback((): Track | null => {
    const node = el.current;
    if (!node) return null;

    if (!marquee.current) {
      for (const animation of node.getAnimations()) {
        if ((animation as CSSAnimation).animationName === "marquee") {
          marquee.current = animation;
          break;
        }
      }
    }
    // Under `prefers-reduced-motion` there is no marquee at all, and this is
    // what turns everything here into a no-op.
    const found = marquee.current;
    if (!found) return null;

    const period = Number(found.effect?.getComputedTiming().duration ?? 0);
    const shift = parseFloat(
      getComputedStyle(node).getPropertyValue("--marquee-shift"),
    );
    if (!period || !Number.isFinite(shift)) return null;

    return { el: node, marquee: found, period, shift, speed: shift / period };
  }, []);

  /*
   * A ramp asks to be looked at again when it finishes, and what it asks is
   * this same function, so it is reached through a box rather than by name.
   */
  const latest = React.useRef<() => void>(undefined);
  const again = React.useCallback(() => latest.current?.(), []);

  const apply = React.useCallback(() => {
    const track = read();
    if (!track) return;

    const wanted = holding.current.pointer || holding.current.focus;
    const live = ramp.current;
    const now = performance.now();

    if (live) {
      /*
       * A ramp owns the row until it finishes, and asks this again when it
       * does, so a pointer that comes and goes mid ramp is answered late rather
       * than by cutting a curve in half and having to work out where the cut
       * landed.
       *
       * The one case worth taking at once is a pointer that leaves again while
       * the row is still coasting, because a coasting stop is travelling the
       * marquee's own path: dropping it there gives the row back to an
       * animation that was already agreeing with it, and there is nothing to
       * see. That is a pointer brushing past a card, which is most of them.
       */
      if (live.stopping && !wanted && now < live.coastEnds) {
        live.animation.cancel();
        ramp.current = null;
        restore(track, live.from + track.speed * (now - live.anchor), now);
      } else if (!live.stopping && wanted && now < live.coastEnds) {
        /*
         * The reverse case is just as important. A pointer can leave a held
         * row and return before its stationary coast ends. Keep the row at the
         * same resting frame instead of allowing the queued start to run and
         * then scheduling another stop behind it.
         */
        const animation = restAt(track, live.from);
        live.animation.cancel();
        track.marquee.cancel();
        ramp.current = null;
        resting.current = { at: live.from, animation };
      }
      return;
    }

    if (wanted !== (resting.current !== null)) {
      lay(track, ramp, resting, wanted, again);
    }
  }, [read, again]);

  React.useEffect(() => {
    latest.current = apply;
  }, [apply]);

  const hold = React.useCallback(
    (which: "pointer" | "focus", value: boolean) => {
      if (holding.current[which] === value) return;
      holding.current[which] = value;
      apply();
    },
    [apply],
  );

  /*
   * A pointer lifted off the screen rather than moved away, or one the browser
   * takes back mid gesture, gets no `pointerleave`, and the row would be left
   * held for good. Both are treated as the pointer having gone.
   */
  return (
    <ul
      ref={el}
      className={className}
      onPointerEnter={() => hold("pointer", true)}
      onPointerLeave={() => hold("pointer", false)}
      onPointerCancel={() => hold("pointer", false)}
      onFocus={(event) => {
        // React focus events bubble. Moving between two links in this list is
        // not a new visit to the list and must not restart its animation.
        if (!contains(event.currentTarget, event.relatedTarget)) {
          hold("focus", true);
        }
      }}
      onBlur={(event) => {
        if (!contains(event.currentTarget, event.relatedTarget)) {
          hold("focus", false);
        }
      }}
    >
      {children}
    </ul>
  );
}

function contains(container: HTMLElement, target: EventTarget | null) {
  return target instanceof Node && container.contains(target);
}

/** Hold one exact frame above the marquee until movement is wanted again. */
function restAt(track: Track, at: number) {
  return track.el.animate(
    [{ transform: `translateX(${at}%)` }],
    { duration: 0, fill: "both", composite: "replace" },
  );
}

/** Where the marquee has the track at a given moment, in percent. */
function positionAt(track: Track, at: number) {
  const origin = Number(track.marquee.startTime ?? 0);
  return track.shift * frac((at - origin) / track.period);
}

/*
 * Put the marquee back in charge, standing where the row has been left. Its
 * turn is one whole copy of the cards, so any two readings a turn apart are the
 * same picture and the phase is all that has to match.
 */
function restore(track: Track, at: number, from: number) {
  if (track.marquee.playState === "idle") track.marquee.play();
  track.marquee.startTime = from - frac(at / track.shift) * track.period;
}

function lay(
  track: Track,
  ramp: React.RefObject<Ramp | null>,
  resting: React.RefObject<{ at: number; animation: Animation } | null>,
  stopping: boolean,
  again: () => void,
  /* A re-laying of a ramp already in flight, which knows where its path began. */
  over?: { anchor: number; from: number; coast: number },
) {
  const previous = over ? ramp.current : null;
  const anchor = performance.now();
  const coast = over ? over.coast : MAX_COAST;

  /*
   * Coming off the marquee a stop picks the row up where the marquee has it and
   * keeps its speed; coming off a rest a start begins where the rest is and
   * does not move at all yet. Re-laying a ramp reads its path instead, so the
   * new one lies exactly along the old.
   */
  const from = over
    ? over.from + (stopping ? track.speed : 0) * (anchor - over.anchor)
    : stopping
      ? positionAt(track, anchor)
      : (resting.current?.at ?? 0);

  const coastSpeed = stopping ? track.speed : 0;
  const endSpeed = stopping ? 0 : track.speed;

  const total = coast + SETTLE;
  const coasted = from + coastSpeed * coast;
  // The eased stretch covers the ground an even change of speed would, which is
  // what leaves the ramp's own speed at each end matching what it is joining.
  const to = coasted + ((coastSpeed + endSpeed) / 2) * SETTLE;

  const animation = track.el.animate(
    [
      { offset: 0, transform: `translateX(${from}%)`, easing: "linear" },
      {
        offset: coast / total,
        transform: `translateX(${coasted}%)`,
        easing: stopping ? TO_REST : OFF_REST,
      },
      { offset: 1, transform: `translateX(${to}%)` },
    ],
    {
      duration: total,
      /*
       * Both reach back before they begin, because a ramp is anchored to a
       * clock reading a little later than the frame it was laid in and would
       * otherwise leave the row with no transform at all for that sliver, which
       * is the row snapping to the head of the track and back. Only a stop
       * reaches forward: it has to go on holding the row after it ends, whereas
       * a start hands the row to the marquee, so it lets go at exactly the
       * moment the marquee has been set up to take over.
       */
      fill: stopping ? "both" : "backwards",
      composite: "replace",
    },
  );

  /*
   * Anchored to the clock read on the way in rather than to whenever the
   * browser gets round to starting it. Until then the row is still the
   * marquee's, or the previous ramp's, and this one's first stretch is that
   * same path, so the two agree across the whole of the gap however long it
   * turns out to be.
   */
  animation.startTime = anchor;

  const ends = anchor + total;

  if (stopping) {
    /*
     * The marquee comes off the element for the duration. Two animations on one
     * element's transform is the one thing that stops the browser handing
     * either of them to the compositor, and a ramp left on the main thread is
     * drawn from the same stale clock that caused the fault in the first place:
     * leaving the marquee in place halved the fix and no more.
     */
    track.marquee.cancel();
  } else {
    // Set now, while the ramp still covers it, so the handover happens at a
    // time chosen in advance and is not something the browser has to be quick
    // about.
    restore(track, to, ends);
    // And the stop that was holding the row can go, now that this ramp is over
    // the top of it. Left in place it would go on applying its last frame, and
    // a finished ramp outranks the marquee, so the row would never move again.
    resting.current?.animation.cancel();
    resting.current = null;
  }

  previous?.animation.cancel();

  const laid: Ramp = {
    stopping,
    animation,
    anchor,
    from,
    coastEnds: anchor + coast,
    ends,
    endsAt: to,
    fitted: Boolean(over),
  };
  ramp.current = laid;

  /*
   * The coast has to outlast one main-thread frame, and nothing on the way in
   * knows how long that frame is going to be. So the ramp goes down with the
   * longest coast it is allowed, which is safe whatever happens, and two frames
   * later, when the length of one is known, it goes down again with the coast
   * cut to fit. Re-laying it is invisible: both versions travel the same path
   * for as long as either of them is coasting.
   */
  if (!laid.fitted) {
    requestAnimationFrame((first) =>
      requestAnimationFrame((second) => {
        if (ramp.current !== laid) return;
        const fitted = Math.min(
          MAX_COAST,
          Math.max(MIN_COAST, (second - first) * 3),
        );
        if (fitted >= coast) {
          laid.fitted = true;
          return;
        }
        lay(track, ramp, resting, stopping, again, {
          anchor,
          from,
          coast: fitted,
        });
      }),
    );
  }

  animation.finished
    .then(() => {
      if (ramp.current !== laid) return;
      ramp.current = null;
      resting.current = stopping ? { at: to, animation } : null;
      again();
    })
    .catch(() => {
      /* re-laid, or dropped by a pointer that changed its mind. */
    });
}
