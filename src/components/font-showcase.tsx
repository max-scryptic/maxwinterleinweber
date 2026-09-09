"use client";

import * as React from "react";

/*
 * The font tryout: the name set in each candidate face, over the same sky and
 * on the same card as the home page, so the comparison is between the fonts
 * and nothing else.
 */

const NAME = "Max Winter-Leinweber";

/*
 * Every sample is set at the largest size that still fits the card on one
 * line, which is how the name is set on the home page. That matters more than
 * it sounds: a wide face like Michroma has to be set much smaller than a
 * condensed one like Rajdhani before it fits the same column, and picking a
 * font by how it looks at a fixed size hides that entirely. Measuring rather
 * than hand tuning a size per font is also what keeps the page honest when a
 * font is added or the column changes width.
 *
 * The line is measured at a known size and scaled from there, since text
 * width is linear in font size. The cap is the home page's own 5rem ceiling,
 * so nothing here is shown larger than the real header would ever be.
 */
const PROBE_PX = 100;
const MAX_PX = 80;

function FitLine({ className }: { className: string }) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const lineRef = React.useRef<HTMLSpanElement>(null);

  React.useLayoutEffect(() => {
    const box = boxRef.current;
    const line = lineRef.current;
    if (!box || !line) return;

    const fit = () => {
      const available = box.clientWidth;
      if (!available) return;

      line.style.fontSize = `${PROBE_PX}px`;
      const width = line.getBoundingClientRect().width;
      if (!width) return;

      /* A hair under the width that fits exactly, so a face whose last letter
         carries past its advance width is not shaved by the clip. */
      const fitted = (available / width) * PROBE_PX * 0.99;
      line.style.fontSize = `${Math.min(MAX_PX, fitted)}px`;
    };

    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(box);

    /* The first measurement can land while the browser is still drawing the
       fallback face, which is the wrong shape and so the wrong width. Measure
       again once the real font is in. */
    let live = true;
    document.fonts.ready.then(() => {
      if (live) fit();
    });

    return () => {
      live = false;
      observer.disconnect();
    };
  }, []);

  return (
    /* The line runs at 100px for the length of a measurement, so the box has
       to be able to contain that without pushing the page sideways. */
    <div ref={boxRef} className="w-full overflow-hidden">
      {/* Inline block, so the span shrink wraps the line and measuring it
          gives the width of the text rather than the width of the box. */}
      <span
        ref={lineRef}
        className={`${className} inline-block leading-tight whitespace-nowrap`}
      >
        {NAME}
      </span>
    </div>
  );
}

export type FontSample = {
  /** The font's name on Google Fonts, and the weight it is set in here. */
  name: string;
  /** What the face does to the name, in one line. */
  note: string;
  /** The class next/font generated for it. */
  className: string;
};

export type FontGroup = {
  title: string;
  blurb: string;
  samples: FontSample[];
};

type Surface = "card" | "sky";

const SURFACES: { id: Surface; label: string }[] = [
  { id: "card", label: "On the card" },
  { id: "sky", label: "On the sky" },
];

export function FontShowcase({ groups }: { groups: FontGroup[] }) {
  /*
   * Two readings of the same face. The card is what the site does today:
   * near black on off white, where weight and detail hold up. Straight on the
   * sky is white on near black, which is where these faces were designed to
   * live and where thin, wide ones come alive. A font can win one and lose
   * the other, so both are a click apart rather than a rebuild away.
   */
  const [surface, setSurface] = React.useState<Surface>("card");
  const onSky = surface === "sky";

  return (
    <div className="relative z-10 min-h-svh p-[10px]">
      {/* The same half of the window the card takes on the home page, so a
          sample here is set to the width it would really have. */}
      <div className="w-full md:w-1/2">
        <header className="px-2 pt-6 pb-8 text-white sm:px-4">
          <h1 className="text-2xl font-semibold">Futuristic fonts</h1>
          <p className="mt-2 max-w-prose text-sm text-white/70">
            {NAME}, set in each candidate at the largest size that fits the
            card on one line. The home page now uses the first of them,
            Orbitron, in caps.
          </p>

          <div
            role="group"
            aria-label="Preview surface"
            className="mt-5 inline-flex rounded-full bg-white/10 p-1 ring-1 ring-white/15"
          >
            {SURFACES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSurface(id)}
                aria-pressed={surface === id}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-sm transition-colors ${
                  surface === id
                    ? "bg-white text-neutral-900"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="space-y-10 pb-16">
          {groups.map((group) => (
            <section key={group.title}>
              <div className="px-2 sm:px-4">
                <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                  {group.title}
                </h2>
                <p className="mt-1 max-w-prose text-sm text-white/60">
                  {group.blurb}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {group.samples.map((sample) => (
                  <div
                    key={sample.name}
                    className={`rounded-2xl px-4 pt-4 pb-5 sm:px-6 md:px-10 ${
                      onSky
                        ? "bg-white/[0.04] ring-1 ring-white/10"
                        : "bg-[#f4f4f4] shadow-[0_6px_24px_rgba(0,0,0,0.18)]"
                    }`}
                  >
                    <div
                      className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs ${
                        onSky ? "text-white/50" : "text-neutral-500"
                      }`}
                    >
                      <span
                        className={
                          onSky
                            ? "font-medium text-white/80"
                            : "font-medium text-neutral-700"
                        }
                      >
                        {sample.name}
                      </span>
                      <span>{sample.note}</span>
                    </div>

                    <div
                      className={`mt-3 ${onSky ? "text-white" : "text-neutral-900"}`}
                    >
                      <FitLine className={sample.className} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
