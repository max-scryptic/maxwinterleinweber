import { cn } from "cn"

/*
 * Placeholder product mark, drawn inline rather than loaded as an image so it
 * takes its colours from the theme tokens and follows the app into dark mode
 * without a second asset. Swap the paths (and APP_NAME below) for the real
 * brand when there is one.
 */

export const APP_NAME = "Acme Inc."

type BrandLogoProps = {
  className?: string
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <div
      className={cn(
        "flex aspect-square shrink-0 items-center justify-center rounded-lg bg-primary",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        // Roughly 60% of the tile, so the clear space around the mark survives
        // at the smallest size this is used at.
        className="size-[60%] text-primary-foreground"
        aria-hidden="true"
      >
        <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
        <path d="M3 16.5 12 21l9-4.5" />
        <path d="M3 12l9 4.5 9-4.5" />
      </svg>
    </div>
  )
}
