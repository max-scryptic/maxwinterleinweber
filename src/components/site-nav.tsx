"use client";

import { useEffect, useState } from "react";

import { SECTIONS, type SectionId } from "@/lib/sections";

/*
 * How far down the window a section's top has to have come before it counts as
 * the one being read: a little over a third, which is where the eye sits on a
 * page being scrolled, so a section is lit as its heading arrives rather than
 * once it has taken the whole window.
 */
const READING_LINE = 0.35;

/**
 * Which section is being read: the last one whose top has passed the reading
 * line. At the very bottom of the page it is the last section whatever its top
 * is doing, since a short final section may never reach the line at all and
 * would otherwise never be lit.
 */
function useActiveSection() {
  const [active, setActive] = useState<SectionId>(SECTIONS[0].id);

  useEffect(() => {
    // Coalesced onto a frame rather than run on the event. Scroll fires far
    // more often than the page is drawn, and every one of these reads layout.
    let queued = 0;

    const measure = () => {
      queued = 0;

      const line = window.innerHeight * READING_LINE;
      const bottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;

      let current: SectionId = SECTIONS[0].id;
      for (const section of SECTIONS) {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= line) {
          current = section.id;
        }
      }

      setActive(bottom ? SECTIONS[SECTIONS.length - 1].id : current);
    };

    const schedule = () => {
      if (queued) return;
      queued = requestAnimationFrame(measure);
    };

    // The page can already be scrolled when this runs: a reload holds its
    // position, and so does following a link to one of the sections.
    schedule();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (queued) cancelAnimationFrame(queued);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return active;
}

/**
 * The list of sections down the sidebar, with a dot beside the one being read.
 * The dot's room is held beside every item whether it is lit or not, so the
 * labels stay in one column and only the dot comes and goes.
 */
export function SiteNav() {
  const active = useActiveSection();

  return (
    <nav aria-label="Sections">
      <ul className="space-y-1">
        {SECTIONS.map((section) => {
          const current = section.id === active;

          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={current ? "location" : undefined}
                className="group flex items-center gap-3 rounded-md py-1.5 text-[15px] focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none"
              >
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full bg-foreground transition duration-300 ${current ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                />
                <span
                  className={`transition-colors ${current ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                >
                  {section.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
