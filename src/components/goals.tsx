/*
 * What Max is working towards, as a short numbered list. Each goal is a line
 * that says what it is and a sentence on why, so the section reads as a
 * statement of intent rather than a to-do list.
 */
const goals = [
  {
    title: "Grow Scryptic",
    detail: "Help more founders get from idea to a shipped product.",
  },
  {
    title: "Launch more SaaS products",
    detail: "Keep designing, building and running products of my own.",
  },
  {
    title: "Make more videos and music",
    detail: "Keep a creative practice going alongside the work.",
  },
];

export function Goals() {
  return (
    <ol className="divide-y divide-border overflow-hidden rounded-[0.25rem] border border-border bg-card">
      {goals.map((goal, index) => (
        <li key={goal.title} className="flex gap-6 p-6 sm:p-8">
          <span className="w-10 shrink-0 font-serif text-3xl leading-none text-faint-foreground tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              {goal.title}
            </h3>
            <p className="mt-1.5 text-base leading-relaxed text-subtle-foreground">
              {goal.detail}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
