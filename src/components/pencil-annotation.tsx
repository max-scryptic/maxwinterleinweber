import * as React from "react";

/*
 * Hand drawn annotation kit: a roughening filter, an arrow that curves from a
 * label towards whatever it is pointing at, and nothing else. The arrows are
 * inline SVG rather than images so they inherit the text colour and stay crisp
 * at any zoom.
 */

export const PENCIL_FILTER_ID = "pencil-stroke";

/**
 * Renders once per page. feTurbulence pushes each stroke off its perfect
 * mathematical line, which is the difference between a curve that looks
 * generated and one that looks drawn by hand.
 */
export function PencilDefs() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute size-0">
      <defs>
        <filter
          id={PENCIL_FILTER_ID}
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.019"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.9"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

type Point = [x: number, y: number];

/**
 * Two barbs splayed back from the tip along the angle the stroke arrives at,
 * the way you would flick them in after drawing the shaft.
 */
function arrowHead([x, y]: Point, angle: number, length = 11, spread = 26) {
  const barb = (degrees: number) => {
    const radians = (degrees * Math.PI) / 180;
    const bx = x + Math.cos(radians) * length;
    const by = y + Math.sin(radians) * length;
    return `M${x} ${y}L${bx.toFixed(1)} ${by.toFixed(1)}`;
  };

  return `${barb(angle + 180 - spread)}${barb(angle + 180 + spread)}`;
}

type PencilArrowProps = {
  /** Shaft, drawn in the SVG's own coordinate space. */
  path: string;
  /** Where the shaft ends, so the head can be flicked in at the right spot. */
  tip: Point;
  /** Direction of travel at the tip, in degrees, y pointing down. */
  angle: number;
  width: number;
  height: number;
  className?: string;
};

export function PencilArrow({
  path,
  tip,
  angle,
  width,
  height,
  className,
}: PencilArrowProps) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ filter: `url(#${PENCIL_FILTER_ID})` }}
    >
      <path d={path} />
      <path d={arrowHead(tip, angle)} />
    </svg>
  );
}
