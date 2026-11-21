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

// Where the count started: £80,000 of debt to clear before saving begins.
const START = -80_000;

// Where things stand now. Move this as the debt is paid and the savings grow.
const CURRENT = -80_000;

// What one block of the bar is worth.
const BLOCK = 10_000;

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

// Short form for the markers under the bar: -£80k, £0, £250k.
const short = (value: number) =>
  `${value < 0 ? "-" : ""}£${Math.abs(value) / 1000}${value === 0 ? "" : "k"}`;

export function Goals() {
  return (
    <div className="max-w-xl">
      <Image
        src={grandPiano}
        alt="A black grand piano with its lid open, and a piano bench"
        sizes="(min-width: 768px) 36rem, 100vw"
        className="w-full rounded-[0.25rem] border border-border"
      />
      <Progress start={START} current={CURRENT} target={TARGET} />
    </div>
  );
}

/**
 * The saving as an XP bar: a row of blocks, each worth BLOCK, running from the
 * starting debt up to the price of the piano. Ground made since the start is
 * gold, debt still owed is red and what is left to save is empty. A marker
 * under the bar shows £0, where the debt is cleared and the saving starts.
 */
function Progress({
  start,
  current,
  target,
}: {
  start: number;
  current: number;
  target: number;
}) {
  const count = Math.ceil((target - start) / BLOCK);
  const blocks = Array.from({ length: count }, (_, i) => {
    const from = start + i * BLOCK;
    const to = from + BLOCK;
    if (to <= current) return "bg-amber-500";
    if (from < 0) return "bg-destructive";
    return "bg-foreground/10";
  });

  /*
   * Where £0 falls, measured to the middle of the gap between two blocks.
   * Blocks share the row's width less the gaps, so every block plus its gap is
   * (width + gap) / count wide, and the k-th gap is centred one half-gap
   * before k of those.
   */
  const zero = `calc(${-start / BLOCK / count} * (100% + 4px) - 2px)`;

  return (
    <div className="mt-8 font-mono text-xs tracking-wider uppercase">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h3 className="font-sans font-semibold tracking-[0.14em] text-faint-foreground">
          Current progress
        </h3>
        <p className="text-muted-foreground tabular-nums">
          <span
            className={current < 0 ? "text-destructive" : "text-foreground"}
          >
            {gbp.format(current)}
          </span>{" "}
          / {gbp.format(target)}
        </p>
      </div>

      <div
        role="img"
        aria-label={`Current progress: ${gbp.format(current)} of ${gbp.format(target)}`}
      >
        <div className="flex h-5 gap-1">
          {blocks.map((fill, i) => (
            <div key={i} className={`flex-1 rounded-[2px] ${fill}`} />
          ))}
        </div>

        <div className="relative mt-2 h-4 text-muted-foreground normal-case tabular-nums">
          <span className="absolute left-0">{short(start)}</span>
          {start < 0 && (
            <span className="absolute -translate-x-1/2" style={{ left: zero }}>
              £0
            </span>
          )}
          <span className="absolute right-0">{short(target)}</span>
        </div>
      </div>
    </div>
  );
}
