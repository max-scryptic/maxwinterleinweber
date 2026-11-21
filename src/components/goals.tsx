import Image from "next/image";

import grandPiano from "@/assets/goals/grand-piano.jpg";

/*
 * The goal, shown rather than said: a grand piano. The photo fills its frame
 * edge to edge, so its own white backdrop is the frame and the floor shadow
 * runs out to the border rather than stopping short of it. It is kept to the
 * photo's own width, so it is never stretched past the pixels it has.
 */

/*
 * A new Steinway Model D, the concert grand and the top of the range, at the
 * top of its 2026 UK price range (£200,000 to £250,000+).
 */
const TARGET = 250_000;

// Where things stand. Below zero means there is debt to clear first.
const CURRENT = -80_000;

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export function Goals() {
  return (
    <div className="max-w-xl">
      <Image
        src={grandPiano}
        alt="A black grand piano with its lid open, and a piano bench"
        sizes="(min-width: 768px) 36rem, 100vw"
        className="w-full rounded-[0.25rem] border border-border"
      />
      <Progress current={CURRENT} target={TARGET} />
    </div>
  );
}

/**
 * How far along the saving is. The bar runs from wherever the count starts,
 * which is below zero while there is debt, up to the target. Any debt is drawn
 * in red up to a mark at zero, and savings fill from that mark towards the
 * end, so a negative balance reads as ground still to make up rather than as
 * an empty bar.
 */
function Progress({ current, target }: { current: number; target: number }) {
  const start = Math.min(current, 0);
  const span = target - start;
  const at = (value: number) => `${((value - start) / span) * 100}%`;

  const percent = Math.round((current / target) * 100);

  return (
    <div className="mt-8">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-lg text-foreground">
          <span
            className={`font-semibold tabular-nums ${current < 0 ? "text-destructive" : ""}`}
          >
            {gbp.format(current)}
          </span>{" "}
          <span className="text-muted-foreground">of {gbp.format(target)}</span>
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">{percent}%</p>
      </div>

      <div
        role="img"
        aria-label={`Progress: ${gbp.format(current)} of ${gbp.format(target)}`}
        className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-foreground/10"
      >
        {current < 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-destructive"
            style={{ width: at(0) }}
          />
        )}
        {current > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-primary"
            style={{ width: at(Math.min(current, target)) }}
          />
        )}
      </div>

      {current < 0 && (
        <div className="relative mt-2 h-5 text-xs text-faint-foreground tabular-nums">
          <span className="absolute left-0">{gbp.format(start)}</span>
          <span className="absolute -translate-x-1/2" style={{ left: at(0) }}>
            {gbp.format(0)}
          </span>
          <span className="absolute right-0">{gbp.format(target)}</span>
        </div>
      )}
    </div>
  );
}
