/** Homepage chapters, in scroll order. Their ids are also the section anchors. */
export const CHAPTERS = [
  "origin",
  "arcs",
  "lab",
  "stats",
  "activity",
  "ask",
  "sidequest",
  "finale",
] as const;
export type ChapterId = (typeof CHAPTERS)[number];

export const CHAPTER_TITLES: Record<ChapterId, string> = {
  origin: "Origin",
  arcs: "The Arcs",
  lab: "Churn Lab",
  stats: "Stat Sheet",
  activity: "Live Activity",
  ask: "Ask Abhishek",
  sidequest: "Side Quest",
  finale: "The Finale",
};
