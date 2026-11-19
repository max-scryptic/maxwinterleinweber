/*
 * Max's GitHub contributions over the last year, for the grid on the page.
 *
 * Read on the server and cached for an hour, so the page stays static and is
 * rebuilt in the background at most once an hour as visitors come in, rather
 * than asking GitHub on every visit.
 *
 * Two sources, best first:
 *
 * - With GITHUB_TOKEN set (any personal access token of Max's, no scopes
 *   needed), GitHub's GraphQL API. This is the documented way in, and it counts
 *   private contributions too when "Include private contributions" is switched
 *   on in the profile settings.
 * - Without one, the public calendar GitHub draws on the profile page, read out
 *   of its HTML. No setup, but it leans on markup GitHub is free to change, in
 *   which case this gives up and the page shows a link to the profile instead.
 */

export const GITHUB_USER = "max-scryptic";
export const GITHUB_PROFILE = `https://github.com/${GITHUB_USER}`;

const REVALIDATE_SECONDS = 60 * 60;

/** How busy a day was, 0 for nothing up to 4 for the busiest, as GitHub buckets it. */
export type Level = 0 | 1 | 2 | 3 | 4;

export type Day = {
  /** The day as YYYY-MM-DD. */
  date: string;
  count: number;
  level: Level;
};

export type Contributions = {
  total: number;
  /** Every day of the last year, oldest first, with none missing. */
  days: Day[];
};

export async function getContributions(): Promise<Contributions | null> {
  try {
    const token = process.env.GITHUB_TOKEN;
    const days = token ? await fromApi(token) : await fromProfile();
    if (days.length === 0) return null;

    days.sort((a, b) => a.date.localeCompare(b.date));
    const total = days.reduce((sum, day) => sum + day.count, 0);
    return { total, days };
  } catch (error) {
    // A grid that fails to load should cost the page a grid, not the page.
    console.error("Could not load GitHub contributions:", error);
    return null;
  }
}

const QUERY = `
  query ($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

const LEVELS: Record<string, Level> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

type ApiResponse = {
  data?: {
    user?: {
      contributionsCollection: {
        contributionCalendar: {
          weeks: {
            contributionDays: {
              date: string;
              contributionCount: number;
              contributionLevel: string;
            }[];
          }[];
        };
      };
    } | null;
  };
  errors?: { message: string }[];
};

async function fromApi(token: string): Promise<Day[]> {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: QUERY, variables: { login: GITHUB_USER } }),
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!response.ok) throw new Error(`GitHub API answered ${response.status}`);

  const body = (await response.json()) as ApiResponse;
  if (body.errors?.length) throw new Error(body.errors[0].message);

  const weeks =
    body.data?.user?.contributionsCollection.contributionCalendar.weeks ?? [];
  return weeks.flatMap((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
      level: LEVELS[day.contributionLevel] ?? 0,
    })),
  );
}

async function fromProfile(): Promise<Day[]> {
  const response = await fetch(
    `https://github.com/users/${GITHUB_USER}/contributions`,
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`);

  return parseCalendar(await response.text());
}

/*
 * The calendar is a table with a cell per day, each carrying its date and
 * level, and a tooltip per cell, tied to it by id, that says the count in
 * words ("3 contributions on November 4th.", "No contributions on ...").
 * Attributes are read by name rather than by position, so a reshuffle of the
 * markup that keeps them does not break this.
 */
export function parseCalendar(html: string): Day[] {
  const counts = new Map<string, number>();
  for (const [, attrs, text] of html.matchAll(
    /<tool-tip\b([^>]*)>([^<]*)<\/tool-tip>/g,
  )) {
    const id = attributes(attrs).for;
    if (!id) continue;
    const count = text.trim().match(/^([\d,]+) contributions?\b/);
    counts.set(id, count ? Number(count[1].replace(/,/g, "")) : 0);
  }

  const days: Day[] = [];
  for (const [, attrs] of html.matchAll(/<td\b([^>]*)>/g)) {
    const cell = attributes(attrs);
    const date = cell["data-date"];
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    const level = Math.min(4, Math.max(0, Number(cell["data-level"]) || 0));
    days.push({
      date,
      count: (cell.id && counts.get(cell.id)) || 0,
      level: level as Level,
    });
  }
  return days;
}

function attributes(source: string): Record<string, string> {
  const found: Record<string, string> = {};
  for (const [, name, value] of source.matchAll(/([\w:-]+)="([^"]*)"/g)) {
    found[name] = value;
  }
  return found;
}
