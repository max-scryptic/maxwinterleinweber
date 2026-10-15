/*
 * Light or dark. The page follows the visitor's system setting until they pick
 * one with the toggle, and from then on keeps their pick, here and on every
 * later visit.
 *
 * The theme is a data-theme attribute on <html>, which globals.css keys both
 * its colours and Tailwind's dark variant off.
 */
export type Theme = "light" | "dark";

const KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/*
 * The same choice as resolveTheme below, as a script for the top of the
 * layout. It runs while the HTML is still being read, before anything is
 * painted, which is what stops a visitor who prefers dark from seeing a flash
 * of the light page first. Kept to plain ES5 because nothing compiles it.
 */
export const THEME_SCRIPT = `(function(){var t;try{t=localStorage.getItem(${JSON.stringify(KEY)})}catch(e){}if(t!=="light"&&t!=="dark")t=matchMedia(${JSON.stringify(DARK_QUERY)}).matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)})()`;

/** The theme picked with the toggle, or null if none has been. */
function picked(): Theme | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    // Storage can be switched off entirely, in which case nothing was picked.
    return null;
  }
}

export function resolveTheme(): Theme {
  return picked() ?? (matchMedia(DARK_QUERY).matches ? "dark" : "light");
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function pickTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Still switched for this visit, just not remembered for the next one.
  }

  // Every colour on the page changes at once, and the cards and buttons that
  // ease their colours on hover would otherwise fade into the new theme a beat
  // behind everything else. Transitions are held off for the one frame the
  // switch happens in.
  const still = document.createElement("style");
  still.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(still);

  applyTheme(theme);

  // Reading a computed style makes the browser apply the new colours now,
  // while the transitions are still off, rather than whenever it next lays
  // the page out.
  void window.getComputedStyle(document.body).color;
  requestAnimationFrame(() => still.remove());
}

/**
 * Calls back whenever anything that decides the theme changes: the system
 * setting, for a visitor who has not picked one, or a pick made in another
 * tab, which writes to the same storage.
 */
export function watchThemeSources(onChange: () => void) {
  const query = matchMedia(DARK_QUERY);
  const storage = (event: StorageEvent) => {
    if (event.key === KEY) onChange();
  };

  query.addEventListener("change", onChange);
  window.addEventListener("storage", storage);

  return () => {
    query.removeEventListener("change", onChange);
    window.removeEventListener("storage", storage);
  };
}

/** Calls back whenever the theme on the page changes, however it was changed. */
export function watchTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return () => observer.disconnect();
}
