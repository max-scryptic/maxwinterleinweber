import { ArrowUpRight } from "lucide-react";

import { GitHubMark } from "@/components/marks";
import {
  GITHUB_PROFILE,
  GITHUB_USER,
  getContributions,
  type Day,
  type Level,
} from "@/lib/github";

/*
 * The year of GitHub contributions as the familiar grid: a column per week,
 * Sunday at the top, a square per day shaded by how much went in that day.
 *
 * The columns share the card's width between them rather than being a fixed
 * size, so the squares grow with the window and the whole year fits from a
 * tablet up. On a phone it scrolls, opening on the latest weeks.
 */

const LEVEL_CLASSES: Record<Level, string> = {
  0: "bg-contrib-0",
  1: "bg-contrib-1",
  2: "bg-contrib-2",
  3: "bg-contrib-3",
  4: "bg-contrib-4",
};

// Dates arrive as YYYY-MM-DD with no time of day; read and written in UTC so
// no timezone can move one onto the day before.
const monthName = new Intl.DateTimeFormat("en", {
  month: "short",
  timeZone: "UTC",
});
const longDate = new Intl.DateTimeFormat("en", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const number = new Intl.NumberFormat("en");

function utc(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function describe(day: Day) {
  const when = longDate.format(utc(day.date));
  if (day.count === 0) return `No contributions on ${when}`;
  return `${number.format(day.count)} contribution${day.count === 1 ? "" : "s"} on ${when}`;
}

/*
 * The days in columns of seven. The first week is padded at the top with
 * empty slots up to the weekday the year starts on, so every row is one day
 * of the week all the way across.
 */
function toWeeks(days: Day[]) {
  const weeks: (Day | null)[][] = [];
  let week: (Day | null)[] = Array(utc(days[0].date).getUTCDay()).fill(null);

  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) weeks.push(week);
  return weeks;
}

/*
 * A month's name over the first week that starts in it. The first name is
 * dropped when the next comes too soon after it, as happens when the year
 * starts at the end of a month, so the two do not run into one another.
 */
function monthLabels(weeks: (Day | null)[][]) {
  const labels: { week: number; name: string }[] = [];
  let last = -1;

  weeks.forEach((week, index) => {
    const first = week.find((day) => day !== null);
    if (!first) return;
    const month = utc(first.date).getUTCMonth();
    if (month !== last) {
      labels.push({ week: index, name: monthName.format(utc(first.date)) });
      last = month;
    }
  });

  if (labels.length > 1 && labels[1].week - labels[0].week < 3) labels.shift();
  return labels;
}

export async function GitHubActivity() {
  const contributions = await getContributions();

  return (
    <article className="overflow-hidden rounded-[0.25rem] border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 pt-6 sm:px-10 sm:pt-8">
        <p className="text-base text-subtle-foreground sm:text-lg">
          {contributions ? (
            <>
              <strong className="font-semibold text-foreground">
                {number.format(contributions.total)}
              </strong>{" "}
              contributions in the last year
            </>
          ) : (
            "What I've been building lately"
          )}
        </p>

        <a
          href={GITHUB_PROFILE}
          target="_blank"
          rel="noopener noreferrer me"
          className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none"
        >
          <GitHubMark className="size-4" />@{GITHUB_USER}
          <ArrowUpRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </a>
      </div>

      <div className="px-6 pt-6 pb-6 sm:px-10 sm:pb-8">
        {contributions ? (
          <Calendar days={contributions.days} />
        ) : (
          <p className="text-sm text-muted-foreground">
            The activity grid could not be loaded just now. It is all on{" "}
            <a
              href={GITHUB_PROFILE}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </p>
        )}
      </div>
    </article>
  );
}

function Calendar({ days }: { days: Day[] }) {
  const weeks = toWeeks(days);
  const columns = {
    gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
  };
  const busiest = days.reduce((top, day) =>
    day.count > top.count ? day : top,
  );

  return (
    <figure>
      {/* Below the width a year needs to stay legible the grid scrolls
          sideways rather than shrinking further. Laid out in reverse, so it
          opens scrolled to its right-hand end: the latest weeks, which are
          the ones worth seeing. */}
      <div className="flex flex-row-reverse overflow-x-auto">
        <div className="min-w-[36rem] flex-1">
          <div
            aria-hidden="true"
            className="mb-2 grid text-[10px] leading-none text-faint-foreground sm:text-xs"
            style={columns}
          >
            {monthLabels(weeks).map(({ week, name }) => (
              <span
                key={week}
                className="whitespace-nowrap"
                style={{ gridColumn: `${week + 1} / span 3` }}
              >
                {name}
              </span>
            ))}
          </div>

          <div
            role="img"
            aria-label={`Contribution grid for the last year. Busiest day: ${describe(busiest)}.`}
            className="grid grid-flow-col grid-rows-7 gap-[2px] sm:gap-[3px]"
            style={columns}
          >
            {weeks.flatMap((week, w) =>
              week.map((day, d) =>
                day ? (
                  <span
                    key={day.date}
                    title={describe(day)}
                    className={`aspect-square rounded-[1px] ${LEVEL_CLASSES[day.level]}`}
                  />
                ) : (
                  <span key={`pad-${w}-${d}`} />
                ),
              ),
            )}
          </div>
        </div>
      </div>

      <figcaption className="mt-4 flex items-center justify-end gap-1.5 text-xs text-faint-foreground">
        Less
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span
            key={level}
            aria-hidden="true"
            className={`size-2.5 rounded-[1px] ${LEVEL_CLASSES[level]}`}
          />
        ))}
        More
      </figcaption>
    </figure>
  );
}
