/*
 * The page's sections, top to bottom. The nav is drawn from this list and the
 * page gives each section the id it names, so a section added here and on the
 * page turns up in the nav without a second list to keep in step.
 */
export const SECTIONS = [
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "projects", label: "Projects" },
  { id: "creative", label: "Creative" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];
