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
 * a replacement animation that AGREES WITH THE TRAVEL to begin with: for its
 * first stretch it goes the same way at the same speed, and only after that
 * does it ease down to a stop. It does not matter which frame the swap lands
 * on, because on every frame it could land on, the two say the same thing.
 * Letting go is the same trick backwards: the replacement stays still for a
 * stretch before easing back up to speed, and hands the row on at a moment
 * picked in advance rather than whenever the browser gets round to it.
 *
 * ONE ANIMATION AT A TIME, AND WHY IT IS THE WHOLE POINT
 *
 * All of that only buys anything while the row is still being ticked by the
 * compositor, and a browser will only hand an element's transform to the
 * compositor while exactly one animation is asking for it. Two at once and both
 * of them come back to the main thread, where they are drawn from the same
 * stale clock the swap was built to get away from. On this page that is not a
 * subtle loss: the sky is redrawn in WebGL behind the card, so the main thread
 * runs at a few frames a second, and a row ticked there does not glide, it
 * lurches. Measured on the built page, with the main thread held for a second:
 * a row the compositor owns travels its full 25px through the hold, and a row
 * on two animations travels nothing at all and then catches up in one jump.
 *
 * So the travel is never simply restarted underneath a ramp. It is laid down
 * ahead of time in the phase it is going to need, with a start time set to the
 * exact moment the ramp ends, and until that moment it is not in effect and the
 * compositor does not count it. Nothing is racing: an animation's start time is
 * an absolute reading, so the handover happens where and when it was written to
 * happen whatever the main thread is doing at the time.
 *
 * That is also why the stylesheet's own animation is taken off the element on
 * the way in rather than being cancelled and replayed around each ramp. It is
 * picked up in the phase it had reached, so nothing moves as it goes, and from
 * then on there is one owner of the transform and no possibility of the
 * stylesheet putting a second one back.
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

/** The name the stylesheet gives the row's endless travel. */
const TRAVEL = "marquee";

type Track = {
  el: HTMLUListElement;
  /** One turn, in ms. */
  period: number;
  /** How far one turn travels, as a percentage of the track's width. Negative. */
  shift: number;
  /** Percent per ms. Negative. */
  speed: number;
};

/*
 * The endless travel, as this file owns it. It is the same loop the stylesheet
 * describes, and the two numbers beside it are all that is needed to say where
 * it has the row at any moment without asking the browser: the percentage it
 * starts from, and the clock reading it starts from. `since` is allowed to be
 * in the future, which is what an armed travel is: laid down, not yet in
 * effect, and so not yet anything the compositor has to count.
 */
type Cruise = {
  animation: Animation;
  base: number;
  since: number;
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

type Resting = { at: number; animation: Animation };

export function MarqueeTrack({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const el = React.useRef<HTMLUListElement>(null);

  /*
   * Everything the row is currently doing. `track` is null until the travel has
   * been taken over, and stays null for anyone who has asked for less motion,
   * which is what turns all of this into a no-op for them.
   */
  const track = React.useRef<Track | null>(null);
  const cruise = React.useRef<Cruise | null>(null);
  const ramp = React.useRef<Ramp | null>(null);
  /*
   * The finished stop that is holding the row still, and where it is holding
   * it. Null while the row moves. It is kept because a finished ramp goes on
   * applying its last frame, and letting go means taking it off again.
   */
  const resting = React.useRef<Resting | null>(null);

  /*
   * Two independent reasons to hold the row: a pointer on it, and the keyboard
   * inside it. They are kept apart because they overlap, and a pointer leaving
   * a card that has just been tabbed to must not start the row moving out from
   * under the keyboard.
   */
  const holding = React.useRef({ pointer: false, focus: false });

  /*
   * Adopt the stylesheet's travel, the first time anything here needs to know
   * where the row is.
   *
   * It is done on demand rather than on mount, and never undone. An effect that
   * tears the travel off the element and puts it back is an effect that has to
   * survive being run twice in a row with a teardown in between, which is
   * exactly what React does in development, and the second pass finds a
   * cancelled animation and nothing to adopt: the row stops dead. There is
   * nothing to tear down anyway, since an element's animations go when the
   * element does.
   *
   * Until the first pointer or tab key arrives the stylesheet's own animation
   * is the travel, running on the compositor and untouched. Adopting it changes
   * nothing about the picture: the phase is read off it, not restarted.
   */
  const read = React.useCallback((): Track | null => {
    const node = el.current;
    if (!node) return null;
    if (track.current) return track.current;

    let css: Animation | undefined;
    for (const animation of node.getAnimations()) {
      if ((animation as CSSAnimation).animationName === TRAVEL) {
        css = animation;
        break;
      }
    }
    // Under `prefers-reduced-motion` there is no travel at all, and this is
    // what turns everything here into a no-op.
    if (!css) return null;

    const period = Number(css.effect?.getComputedTiming().duration ?? 0);
    const shift = parseFloat(
      getComputedStyle(node).getPropertyValue("--marquee-shift"),
    );
    if (!period || !Number.isFinite(shift)) return null;

    const owned: Track = { el: node, period, shift, speed: shift / period };
    // The stylesheet's animation IS the travel for now, described in the terms
    // the rest of this file uses. It keeps running, and keeps the compositor,
    // until the first ramp needs the transform to itself.
    cruise.current = { animation: css, base: 0, since: Number(css.startTime) };
    track.current = owned;
    return owned;
  }, []);

  /*
   * A ramp asks to be looked at again when it finishes, and what it asks is
   * this same function, so it is reached through a box rather than by name.
   */
  const latest = React.useRef<() => void>(undefined);
  const again = React.useCallback(() => latest.current?.(), []);

  const apply = React.useCallback(() => {
    const current = read();
    if (!current) return;

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
       * row's own path: dropping it there gives the row back to a travel that
       * was already agreeing with it, and there is nothing to see. That is a
       * pointer brushing past a card, which is most of them.
       */
      if (live.stopping && !wanted && now < live.coastEnds) {
        /*
         * The ramp goes first and the travel replaces it, rather than the other
         * way about: an animation is weighed for the compositor as it arrives,
         * and one that arrives while something else still holds the transform
         * can be left off it. Nothing is drawn between the two, so the row is
         * not seen without an owner.
         */
        const at = live.from + current.speed * (now - live.anchor);
        live.animation.cancel();
        ramp.current = null;
        cruise.current = travel(current, at, now);
      } else if (!live.stopping && wanted && now < live.coastEnds) {
        /*
         * The reverse case is just as important. A pointer can leave a held
         * row and return before its stationary coast ends. Keep the row at the
         * same resting frame instead of allowing the queued start to run and
         * then scheduling another stop behind it.
         */
        const animation = restAt(current, live.from);
        live.animation.cancel();
        // The travel this start had armed for later is no longer wanted. It
        // has not been in effect for a moment, so dropping it shows nothing.
        retire(current, cruise);
        ramp.current = null;
        resting.current = { at: live.from, animation };
      }
      return;
    }

    if (wanted !== (resting.current !== null)) {
      lay(current, cruise, ramp, resting, wanted, again);
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

/*
 * Take whatever is travelling off the element, and make sure the stylesheet's
 * own copy cannot come back.
 *
 * The first retirement is the one that matters: until then the travel IS the
 * stylesheet's animation, and cancelling a CSS animation while its name is
 * still applied leaves the browser free to put a fresh one back on the next
 * style recalculation. That new one would be a second animation on the
 * transform, which is the whole thing this file is arranged to avoid. Clearing
 * the name first settles it for good, and costs nothing afterwards.
 */
function retire(track: Track, cruise: React.RefObject<Cruise | null>) {
  track.el.style.animationName = "none";
  cruise.current?.animation.cancel();
  cruise.current = null;
}

/*
 * The endless travel, starting from `base` and timed from `since`.
 *
 * `fill: "none"` is what makes a travel armable: given a `since` in the future
 * the animation sits there contributing nothing at all until that reading comes
 * round, so the ramp still covering the row is the only thing on the transform
 * and keeps the compositor. Given a `since` in the past it is simply the travel,
 * already under way in the right phase.
 */
function travel(track: Track, base: number, since: number): Cruise {
  const animation = track.el.animate(
    [
      { transform: `translateX(${base}%)` },
      { transform: `translateX(${base + track.shift}%)` },
    ],
    {
      duration: track.period,
      iterations: Infinity,
      easing: "linear",
      fill: "none",
      composite: "replace",
    },
  );
  animation.startTime = since;
  return { animation, base, since };
}

/** Where a travel has the row at a given moment, in percent. */
function positionAt(track: Track, cruise: Cruise, at: number) {
  return cruise.base + track.shift * frac((at - cruise.since) / track.period);
}

/** Hold one exact frame above everything else until movement is wanted again. */
function restAt(track: Track, at: number) {
  return track.el.animate([{ transform: `translateX(${at}%)` }], {
    duration: 0,
    fill: "both",
    composite: "replace",
  });
}

function lay(
  track: Track,
  cruise: React.RefObject<Cruise | null>,
  ramp: React.RefObject<Ramp | null>,
  resting: React.RefObject<Resting | null>,
  stopping: boolean,
  again: () => void,
  /* A re-laying of a ramp already in flight, which knows where its path began. */
  over?: { anchor: number; from: number; coast: number },
) {
  const previous = over ? ramp.current : null;
  const anchor = performance.now();
  const coast = over ? over.coast : MAX_COAST;

  /*
   * Coming off the travel a stop picks the row up where the travel has it and
   * keeps its speed; coming off a rest a start begins where the rest is and
   * does not move at all yet. Re-laying a ramp reads its path instead, so the
   * new one lies exactly along the old.
   */
  let from: number;
  if (over) {
    from = over.from + (stopping ? track.speed : 0) * (anchor - over.anchor);
  } else if (stopping) {
    const running = cruise.current;
    // Nothing is travelling, so there is nothing to slow down.
    if (!running) return;
    from = positionAt(track, running, anchor);
  } else {
    from = resting.current?.at ?? 0;
  }

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
       * a start hands the row to the travel armed to take over at exactly the
       * moment it lets go.
       */
      fill: stopping ? "both" : "backwards",
      composite: "replace",
    },
  );

  /*
   * Anchored to the clock read on the way in rather than to whenever the
   * browser gets round to starting it. Until then the row is still the
   * travel's, or the previous ramp's, and this one's first stretch is that
   * same path, so the two agree across the whole of the gap however long it
   * turns out to be.
   */
  animation.startTime = anchor;

  const ends = anchor + total;

  /*
   * Whichever way the ramp is going, the travel comes off the element for its
   * duration: one animation on the transform is what keeps the row on the
   * compositor, and a ramp ticked on the main thread is drawn from the same
   * stale clock that caused the fault in the first place.
   *
   * The difference is what is left behind it. A stop leaves nothing, and goes
   * on holding the row itself. A start lays the next travel down right away, in
   * the phase it will need, timed to come into effect at the exact reading the
   * ramp ends on. It is not in effect until then, so it costs the ramp nothing,
   * and it does not have to be started by anyone once it is: a start time is an
   * absolute reading, so the handover keeps to the plan whatever the main
   * thread happens to be busy with when the moment comes.
   */
  retire(track, cruise);
  if (!stopping) cruise.current = travel(track, to, ends);

  if (!stopping) {
    // And the stop that was holding the row can go, now that this ramp is over
    // the top of it. Left in place it would go on applying its last frame, and
    // a finished ramp outranks a travel, so the row would never move again.
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
        lay(track, cruise, ramp, resting, stopping, again, {
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
      if (stopping) {
        resting.current = { at: to, animation };
      } else {
        resting.current = null;
        // The armed travel has had the row since `ends`, and this ramp has been
        // contributing nothing since the same moment, so it can go whenever
        // this runs. Nothing about the picture depends on when that is.
        animation.cancel();
        /*
         * And now that the travel is the only thing left on the transform, it
         * is said once more from scratch. A browser decides whether it can hand
         * an animation to the compositor when the animation arrives, and this
         * one arrived into a busy element, in a phase it had not reached yet;
         * measured on the built page it stayed on the main thread for good
         * afterwards, at the four frames a second the sky leaves over, which is
         * the lurch this whole file exists to avoid. Saying it again on a clear
         * element gets it promoted.
         *
         * It costs nothing to be late with: a travel is fixed by the phase it
         * was armed with, so the replacement is the same loop at the same
         * reading and the swap has nothing to show, whenever it happens.
         */
        const armed = cruise.current;
        if (armed) {
          armed.animation.cancel();
          cruise.current = travel(track, armed.base, armed.since);
        }
      }
      again();
    })
    .catch(() => {
      /* re-laid, or dropped by a pointer that changed its mind. */
    });
}
