"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";

import {
  applyTheme,
  currentTheme,
  pickTheme,
  resolveTheme,
  watchTheme,
  watchThemeSources,
} from "@/lib/theme";

/**
 * A round button that switches the page between light and dark, showing the
 * moon on the light page and the sun on the dark one: the way to the other.
 *
 * Which icon shows is left to the dark variant rather than to state, so the
 * right one is there from the first paint, before any of this has run.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  // Read off the page rather than held in state, so the two toggles (one down
  // the sidebar, one in the header on a phone) can never disagree with the
  // page or with each other. The server cannot know, so it says light.
  const dark = useSyncExternalStore(
    watchTheme,
    () => currentTheme() === "dark",
    () => false,
  );

  // The layout's script has set the theme by the time this runs. It is set
  // again because in development React remounts the page once and clears the
  // attribute off <html> as it does so; in production this changes nothing.
  useLayoutEffect(() => {
    applyTheme(resolveTheme());
  }, []);

  useEffect(() => watchThemeSources(() => applyTheme(resolveTheme())), []);

  return (
    <button
      type="button"
      aria-label="Dark mode"
      aria-pressed={dark}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => pickTheme(currentTheme() === "dark" ? "light" : "dark")}
      className={`flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:border-foreground/20 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none ${className}`}
    >
      <Moon aria-hidden="true" className="size-4 dark:hidden" />
      <Sun aria-hidden="true" className="hidden size-4 dark:block" />
    </button>
  );
}
