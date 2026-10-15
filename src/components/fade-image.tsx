"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

/*
 * A picture that fades up, slightly out of focus and sharpening as it comes,
 * once it has loaded, over whatever stands behind it. It replaces Next's blur
 * placeholder, which swapped for the picture in one cut and is drawn through
 * an SVG filter that floods black wherever its tiny preview is see-through: on
 * the cut-out portrait that was a dark smudge around the head for a frame on
 * every load.
 *
 * The picture waits for Next's load callback, which comes once it is decoded
 * and ready to paint, and which Next also calls on hydration for one that
 * finished loading before the page's script arrived. Without script at all the
 * layout's noscript rule shows it as it is.
 */
export function FadeImage({ alt, className, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      {...props}
      alt={alt}
      data-fade=""
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      className={cn(
        "transition-[opacity,filter] duration-500 ease-out motion-reduce:transition-none",
        loaded ? "opacity-100 blur-none" : "opacity-0 blur-sm",
        className,
      )}
    />
  );
}
