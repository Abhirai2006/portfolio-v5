/**
 * "Abhishek's World" — the whole comic as data (DESIGN.md §5). Every caption's facts come from
 * src/lib/facts.ts, src/lib/projects.ts or src/lib/assistant-context.ts (CONTENT.md §1).
 * The SSR webtoon, the WebGL stage, captions, sound and tests all read this file.
 */
import type { BeatDef, LayerDef, PanelDef, PathId } from "./types";

/** Screen hole of the awakening monitor plate (src/art/scenes/more.ts MONITOR_SCREEN), 0..1. */
const MONITOR_HOLE: [number, number, number, number] = [
  250 / 1600,
  100 / 1000,
  1100 / 1600,
  620 / 1000,
];
/** Screen hole of the monitor frame plate (FRAME_SCREEN), 0..1. */
export const FRAME_HOLE: [number, number, number, number] = [
  70 / 1200,
  60 / 820,
  1060 / 1200,
  600 / 820,
];
const FRAME_ASPECT = 1200 / 820;

const L = (art: string, layer: string, z: number, extra: Partial<LayerDef> = {}): LayerDef => ({
  art,
  layer,
  z,
  ...extra,
});

/** A monitor frame showing a project screenshot (or a runtime texture). */
function screen(
  id: string,
  x: number,
  y: number,
  w: number,
  shot: string,
  alt: string,
  rot = 0,
): PanelDef {
  return {
    id,
    x,
    y,
    w,
    aspect: FRAME_ASPECT,
    rot,
    border: false,
    layers: [{ art: shot, z: -0.02, rect: FRAME_HOLE }, L("frame", "bezel", 0)],
    still: shot.startsWith("$shot:") ? shot.slice(6) : undefined,
    alt,
  };
}

export const TITLE = "ABHISHEK'S WORLD";

export const BEATS: BeatDef[] = [
  /* ------------------------------------------------------------------ title */
  {
    id: "title",
    chapter: "title",
    length: 1.7,
    span: 13,
    bg: "#F2EFE8",
    sound: "ink",
    fx: "title",
    panels: [
      {
        id: "title-panel",
        x: 0,
        y: -6.4,
        w: 18.4,
        aspect: 1.6,
        border: true,
        layers: [
          { art: "$waves", z: 0 },
          { art: "$splash", z: 0.25 },
        ],
        alt: "Title page: living ink-brush waves on charcoal, a white ink splash boiling up from the bottom.",
      },
    ],
    captions: [
      { id: "title-vol", text: "VOL. 01", at: [0, -2.9], t: [0, 0.8], kind: "label", side: "c" },
      { id: "title-main", text: TITLE, at: [0, -4.6], t: [0, 0.82], kind: "title", side: "c" },
      {
        id: "title-sub",
        text: "Abhishek Rai A · aspiring machine learning engineer · Mysuru · **looking for ML internships**",
        at: [0, -6.7],
        t: [0, 0.8],
        kind: "label",
        side: "c",
        width: 560,
      },
    ],
    cam: [
      { t: 0, x: 0, y: -6.4, h: 10.6 },
      { t: 0.3, x: 0, y: -6.4, h: 11 },
      { t: 1, x: 0, y: -7.4, h: 16 },
    ],
  },

  /* ------------------------------------------------------------------ Ch.1 Origin */
  {
    id: "coast",
    chapter: "origin",
    heading: "Chapter 1 · Origin",
    length: 1.7,
    span: 14,
    bg: "#F2EFE8",
    sound: "ink",
    summary:
      "The Mangaluru coast at night. A boy walks along the shore under a stippled moon; palms frame the sea.",
    panels: [
      {
        id: "coast",
        x: 0,
        y: -7,
        w: 16,
        aspect: 1.6,
        border: true,
        rot: -0.6,
        layers: [
          L("coast", "sky", 0),
          L("coast", "sea", 0.15),
          L("coast", "land", 0.35),
          L("coast", "boy", 0.55, { idle: "bob" }),
          L("coast", "palms", 0.95, { idle: "sway" }),
          L("coast", "fx", 1.25, { idle: "drift" }),
        ],
        still: "coast",
        alt: "Ink panel: a young boy walking on the Mangaluru shore at night, palms and tiled-roof houses, the moon's path on the sea in electric blue.",
      },
      {
        id: "hands",
        x: -6.6,
        y: -3.6,
        z: 1.5,
        w: 4.4,
        aspect: 1,
        rot: -3,
        border: true,
        layers: [L("hands", "back", 0), L("hands", "hands", 0.12, { idle: "flicker" })],
        still: "hands",
        alt: "Inset: his father's hands typing fast on a keyboard, lit blue by the screen.",
      },
      {
        id: "boy-eyes",
        x: 5.4,
        y: -11.2,
        z: 1.2,
        w: 6.4,
        aspect: 1400 / 480,
        rot: 2,
        border: true,
        layers: [L("boy-eyes", "eyes", 0)],
        still: "boy-eyes",
        alt: "Inset: the boy's wide, curious eyes.",
      },
    ],
    captions: [
      {
        id: "c-coast-1",
        text: "On the coast of **Mangaluru**, a boy grew up around keyboards.",
        at: [-7.4, -9.9],
        t: [0.05, 0.92],
        side: "l",
      },
      {
        id: "c-coast-2",
        text: "His father is a **typist**, so keys were normal from a young age.",
        at: [-1.2, -3.1],
        t: [0.25, 0.95],
        side: "l",
      },
    ],
    cam: [
      { t: 0.08, x: 0, y: -7, h: 12.8 },
      { t: 0.55, x: 0.2, y: -7.2, h: 12.2 },
      { t: 0.94, x: 0.4, y: -7.8, h: 12.8 },
    ],
  },
  {
    id: "maths",
    chapter: "origin",
    length: 1.3,
    span: 13,
    bg: "#F2EFE8",
    sound: "ink",
    summary:
      "A night sky where the stars connect into maths: a sigma, pi, an integral, a sine wave, a tiny neural network.",
    panels: [
      {
        id: "maths",
        x: -2.6,
        y: -6.4,
        w: 8.2,
        aspect: 1200 / 1400,
        rot: 1.4,
        border: true,
        layers: [L("maths", "sky", 0, { idle: "drift" }), L("maths", "ground", 0.4)],
        still: "maths",
        alt: "Ink panel: stars joined into maths symbols over a small house and two palms.",
      },
    ],
    captions: [
      {
        id: "c-maths-1",
        text: "He loved **maths**. So he followed it.",
        at: [2.2, -3.8],
        t: [0.08, 0.95],
        side: "l",
      },
      {
        id: "c-maths-2",
        text: "Maths first, then **physics**. AI and ML came out of that.",
        at: [2.2, -8.4],
        t: [0.3, 0.98],
        side: "l",
      },
    ],
    cam: [
      { t: 0.1, x: -0.6, y: -6.4, h: 11.4 },
      { t: 0.9, x: -0.9, y: -6.9, h: 11 },
    ],
  },
  {
    id: "mysuru",
    chapter: "origin",
    length: 1.3,
    span: 13,
    bg: "#F2EFE8",
    sound: "ink",
    summary:
      "Mysuru at night from a rooftop: the palace lit with rows of bulbs, a young man sitting with his backpack.",
    panels: [
      {
        id: "mysuru",
        x: 0,
        y: -6.5,
        w: 16,
        aspect: 1.6,
        rot: 0.5,
        border: true,
        layers: [
          L("mysuru", "sky", 0, { idle: "drift" }),
          L("mysuru", "city", 0.3),
          L("mysuru", "roof", 0.7),
        ],
        still: "mysuru",
        alt: "Ink panel: the illuminated palace of Mysuru seen from a rooftop at night.",
      },
    ],
    captions: [
      {
        id: "c-mys-1",
        text: "The road led to **Mysuru**.",
        at: [-7.2, -2.4],
        t: [0.06, 0.95],
        side: "l",
      },
      {
        id: "c-mys-2",
        text: "Tulu at home. **Kannada**, Hindi and English everywhere else.",
        at: [2.4, -10.4],
        t: [0.3, 0.98],
        side: "l",
      },
    ],
    cam: [
      { t: 0.1, x: 0, y: -6.5, h: 11.4 },
      { t: 0.9, x: 0, y: -6.9, h: 11.6 },
    ],
  },

  /* ------------------------------------------------------------------ Ch.2 The night shift */
  {
    id: "room",
    chapter: "night",
    heading: "Chapter 2 · The night shift",
    length: 2.1,
    span: 15,
    bg: "#0E0E10",
    sound: "night",
    enter: { kind: "inkBleed", width: 0.9 },
    summary:
      "A dark student room at 10 pm. A PC he built with blue fans; the monitor is the only light.",
    panels: [
      {
        id: "room",
        x: 0,
        y: -7.5,
        w: 16,
        aspect: 1.6,
        border: true,
        layers: [
          L("room", "back", 0),
          L("room", "desk", 0.25, { idle: "flicker" }),
          L("room", "figure", 0.6),
          L("room", "fx", 1.0, { idle: "drift" }),
        ],
        still: "room",
        alt: "Ink panel: Abhishek from behind at his desk at night, lit only by a blue monitor, a self-built PC glowing beside him.",
      },
      {
        id: "keys",
        x: -6.5,
        y: -3.9,
        z: 1.4,
        w: 4,
        aspect: 1,
        rot: 2.5,
        border: true,
        layers: [L("keys", "keys", 0)],
        still: "keys",
        alt: "Inset: his hands on the keys, lit from the screen.",
      },
      {
        id: "gpu",
        x: 6.9,
        y: -11.6,
        z: 1.2,
        w: 3.8,
        aspect: 1,
        rot: -3,
        border: true,
        layers: [L("gpu", "gpu", 0, { idle: "flicker" })],
        still: "gpu",
        alt: "Inset: the graphics card's fans ringed in blue light.",
      },
      {
        id: "eyes",
        x: 3.4,
        y: -3.2,
        z: 1.7,
        w: 7.4,
        aspect: 1400 / 480,
        rot: -1.4,
        border: true,
        layers: [L("eyes", "eyes", 0)],
        still: "eyes",
        alt: "Inset: his focused eyes reflecting blue code light.",
      },
    ],
    captions: [
      {
        id: "c-room-1",
        text: "**10 PM.** The city sleeps. He doesn't.",
        at: [-7.4, -10.6],
        t: [0.04, 0.6],
        side: "l",
      },
      {
        id: "c-room-2",
        text: "Night owl: **10 PM to 6 AM** is when the work happens.",
        at: [-7.4, -12.2],
        t: [0.2, 0.75],
        side: "l",
      },
      {
        id: "c-room-3",
        text: "A PC he **built** himself. He still strips it down to swap parts.",
        at: [3.4, -8.2],
        t: [0.38, 0.9],
        side: "l",
      },
      {
        id: "c-room-4",
        text: "B.E. in **AI & ML**, Mysore University School of Engineering. GPA **9.44**.",
        at: [-2.6, -5.2],
        t: [0.55, 0.98],
        side: "l",
      },
    ],
    cam: [
      { t: 0.08, x: 0, y: -7.5, h: 12.9 },
      { t: 0.5, x: -0.3, y: -7.3, h: 12.3 },
      { t: 0.95, x: 0.3, y: -7.8, h: 12.8 },
    ],
  },

  /* ------------------------------------------------------------------ Turning point */
  {
    id: "awaken",
    chapter: "awakening",
    heading: "Code Awakening",
    length: 1.7,
    span: 12,
    bg: "#0E0E10",
    sound: "swell",
    fx: "awaken",
    gate: { kind: "awaken", at: 0.48 },
    summary:
      "Close-up of his monitor: a blinking cursor. Held, a real line of Python types out, the screen's light pours over his hands and floods the world with colour.",
    panels: [
      {
        id: "monitor",
        x: 0,
        y: -6,
        w: 16,
        aspect: 1.6,
        border: true,
        layers: [
          { art: "$code", z: -0.03, rect: MONITOR_HOLE },
          L("monitor", "bezel", 0),
          { art: "$rays", z: 0.3, add: true },
          L("monitor", "hands", 0.55),
        ],
        still: "monitor",
        alt: "Ink panel: a monitor close-up, his hands on the keyboard, code on the screen.",
      },
    ],
    captions: [
      {
        id: "c-aw-1",
        text: "One more run. **Hold** to execute.",
        at: [-6.2, -2.2],
        t: [0.05, 0.6],
        side: "l",
      },
      {
        id: "c-aw-2",
        text: "The screen's light pours out and becomes his **aura**.",
        at: [1.6, -11.2],
        t: [0.6, 1],
        side: "l",
      },
    ],
    cam: [
      { t: 0.02, x: 0, y: -6, h: 11.4 },
      { t: 0.48, x: 0, y: -5.4, h: 8.6 },
      { t: 1, x: 0, y: -5.1, h: 4.2 },
    ],
  },
  {
    id: "rise",
    chapter: "awakening",
    length: 1.7,
    span: 20,
    bg: "#050507",
    sound: "swell",
    fx: "rise",
    gate: { kind: "rise", at: 0.42 },
    enter: { kind: "glow", width: 0.7 },
    summary:
      "A black page with a white ink vortex. Abhishek rises through it, trailing blue code-light.",
    panels: [
      {
        id: "vortex",
        x: 0,
        y: -10,
        w: 15,
        aspect: 0.82,
        border: false,
        layers: [{ art: "$vortex", z: 0 }],
        alt: "A white ink vortex on black.",
      },
      {
        id: "hero",
        x: 0,
        y: -14,
        z: 1.2,
        w: 5.4,
        aspect: 900 / 1300,
        border: false,
        layers: [L("rise", "hero", 0)],
        still: "rise",
        alt: "Full colour: Abhishek rising, a blue code-light aura around him, hoodie lifting.",
      },
    ],
    captions: [
      { id: "c-rise-1", text: "**Hold** to rise.", at: [-6.4, -8.4], t: [0.1, 0.55], side: "l" },
      {
        id: "c-rise-2",
        text: "The ink world can't hold the **light**.",
        at: [1.8, -15],
        t: [0.55, 1],
        side: "l",
      },
    ],
    cam: [
      { t: 0.02, x: 0, y: -12, h: 12 },
      { t: 0.42, x: 0, y: -11, h: 11.4 },
      { t: 1, x: 0, y: -5, h: 12.6 },
    ],
  },
  {
    id: "breakout",
    chapter: "awakening",
    length: 1,
    span: 13,
    bg: "#0B1022",
    sound: "colour",
    enter: { kind: "burn", width: 0.7 },
    summary: "Back in his room, now in full colour. The walls crack.",
    panels: [
      {
        id: "room-colour",
        x: 0,
        y: -6.5,
        w: 16,
        aspect: 1.6,
        border: true,
        rot: 1,
        layers: [
          L("room", "back", 0),
          L("room", "desk", 0.25),
          L("room", "figure", 0.6),
          L("room", "fx", 1.0, { idle: "drift" }),
        ],
        alt: "The same room, now in colour; cracks run across the walls.",
      },
    ],
    captions: [
      { id: "c-break-1", text: "The old room **breaks**.", at: [-7.4, -2], t: [0.1, 1], side: "l" },
    ],
    cam: [
      { t: 0.1, x: 0, y: -6.5, h: 11.4 },
      { t: 0.95, x: 0, y: -6.5, h: 10.6 },
    ],
  },
  {
    id: "dawn",
    chapter: "awakening",
    length: 1.6,
    span: 13,
    bg: "#2F5BE0",
    sound: "colour",
    fx: "shatter",
    enter: { kind: "shatter", width: 1 },
    summary:
      "The room shatters into glass shards carrying his real numbers; the title returns in colour against a dawn sky.",
    panels: [
      {
        id: "dawn",
        x: 0,
        y: -6.5,
        w: 22,
        aspect: 1.6,
        border: false,
        layers: [L("dawn", "sky", 0, { idle: "drift" })],
        still: "dawn",
        alt: "A dawn sky in full colour, big white clouds.",
      },
    ],
    captions: [
      { id: "dawn-title", text: TITLE, at: [0, -3.4], t: [0.05, 1], kind: "title", side: "c" },
      {
        id: "c-dawn-1",
        text: "Same boy. Same keyboard. Now the world has **colour**.",
        at: [-3.4, -5.2],
        t: [0.2, 1],
        side: "l",
      },
    ],
    cam: [
      { t: 0.04, x: 0, y: -5.4, h: 11.4 },
      { t: 0.96, x: 0, y: -5.8, h: 12.4 },
    ],
  },

  /* ------------------------------------------------------------------ Choose your path */
  {
    id: "choose",
    chapter: "paths",
    heading: "Choose your path",
    length: 1.5,
    span: 13,
    bg: "#0D1238",
    sound: "colour",
    fx: "choose",
    gate: { kind: "choose", at: 0.5 },
    summary:
      "Three glowing artefacts over a stone slab: a neural core, a blueprint cube and sorting bars.",
    panels: [
      {
        id: "altar",
        x: 0,
        y: -6.5,
        w: 16,
        aspect: 1.6,
        border: true,
        layers: [L("altar", "sky", 0, { idle: "drift" }), L("altar", "slab", 0.3)],
        still: "altar",
        alt: "A stone slab under a starry night sky, three soft circles of light on it.",
      },
    ],
    captions: [
      {
        id: "c-choose",
        text: "CHOOSE YOUR PATH",
        at: [0, -3.1],
        t: [0.05, 0.98],
        kind: "big",
        side: "c",
      },
    ],
    cam: [
      { t: 0.05, x: 0, y: -6.5, h: 11.4 },
      { t: 0.5, x: 0, y: -7, h: 10.4 },
      { t: 0.98, x: 0, y: -7.2, h: 10.8 },
    ],
  },
  {
    id: "path-ml",
    chapter: "path-ml",
    heading: "Path · ML Engineer",
    path: "ml",
    length: 1.6,
    span: 13,
    bg: "#030620",
    sound: "colour",
    enter: { kind: "tear", width: 0.7 },
    summary: "The Bluemind internship: a sky of glowing curves, the hero watching from a ledge.",
    panels: [
      {
        id: "ml-sky",
        x: 0,
        y: -6.5,
        w: 16,
        aspect: 1.6,
        border: true,
        layers: [L("ml-sky", "sky", 0, { idle: "drift" }), L("ml-sky", "ledge", 0.5)],
        still: "ml-sky",
        alt: "Colour panel: Abhishek on a ledge facing a night sky where a ROC curve and a loss curve glow like energy.",
      },
    ],
    captions: [
      {
        id: "c-ml-1",
        text: "**Bluemind Solutions.** Core AI & ML intern. Four weeks, one capstone.",
        at: [-7.4, -1.8],
        t: [0.05, 0.8],
        side: "l",
      },
      {
        id: "c-ml-2",
        text: "Customer Churn Intelligence System: **0.847** ROC-AUC on held-out data, **82%** of churners caught.",
        at: [0.6, -10.2],
        t: [0.25, 0.98],
        side: "l",
      },
      {
        id: "l-ml",
        text: "→ Read the churn case study",
        at: [0.6, -12.1],
        t: [0.35, 0.98],
        kind: "label",
        side: "l",
      },
    ],
    cam: [
      { t: 0.08, x: 0, y: -6.5, h: 11.6 },
      { t: 0.92, x: 0, y: -7, h: 11 },
    ],
  },
  {
    id: "path-product",
    chapter: "path-product",
    heading: "Path · Product Builder",
    path: "product",
    length: 2.6,
    span: 27,
    bg: "#1A1030",
    sound: "colour",
    enter: { kind: "tear", width: 0.7 },
    summary:
      "Four products in monitor frames: MUSE Students Voice, Arthra, Ro-Bio and Earth & Ethos.",
    panels: [
      screen(
        "scr-muse",
        -3.6,
        -4.6,
        8.2,
        "$shot:/media/live/muse-1-dark.jpg",
        "MUSE Students Voice on a monitor",
        -1.5,
      ),
      screen(
        "scr-arthra",
        3.6,
        -11.2,
        8.2,
        "$shot:/media/live/arthra-1-dark.jpg",
        "Arthra on a monitor",
        1.5,
      ),
      screen(
        "scr-robio",
        -3.6,
        -17.8,
        8.2,
        "$shot:/media/live/ro-bio-1.jpg",
        "Ro-Bio on a monitor",
        -1,
      ),
      screen(
        "scr-earth",
        3.6,
        -24.4,
        8.2,
        "$shot:/media/live/earth-and-ethos-1.jpg",
        "Earth & Ethos on a monitor",
        1.2,
      ),
    ],
    captions: [
      {
        id: "c-pr-0",
        text: "He builds full **products**, not just models.",
        at: [1.8, -1.6],
        t: [0.02, 0.3],
        side: "l",
      },
      {
        id: "p-muse",
        text: "project:muse-students-voice",
        at: [1.2, -4.6],
        t: [0.04, 0.34],
        kind: "label",
        side: "l",
      },
      {
        id: "p-arthra",
        text: "project:arthra",
        at: [-8.6, -11.2],
        t: [0.28, 0.6],
        kind: "label",
        side: "l",
      },
      {
        id: "p-robio",
        text: "project:ro-bio",
        at: [1.2, -17.8],
        t: [0.52, 0.84],
        kind: "label",
        side: "l",
      },
      {
        id: "p-earth",
        text: "project:earth-and-ethos",
        at: [-8.6, -24.4],
        t: [0.76, 1],
        kind: "label",
        side: "l",
      },
    ],
    cam: [
      { t: 0.06, x: 0, y: -5.4, h: 11.2 },
      { t: 0.32, x: 0, y: -11.4, h: 11.2 },
      { t: 0.58, x: 0, y: -18, h: 11.2 },
      { t: 0.86, x: 0, y: -24.4, h: 11.2 },
    ],
  },
  {
    id: "path-problem",
    chapter: "path-problem",
    heading: "Path · Problem Solver",
    path: "problem",
    length: 2.2,
    span: 21,
    bg: "#04140E",
    sound: "colour",
    fx: "sorting",
    enter: { kind: "tear", width: 0.7 },
    summary:
      "Algorithms made visible: O(patience), the Binary Search Visualizer and the C++ Console Mini-Suite; sorting bars rise and settle.",
    panels: [
      screen(
        "scr-opat",
        -3.6,
        -4.6,
        8.2,
        "$shot:/media/live/o-patience-2.jpg",
        "O(patience) on a monitor",
        -1.2,
      ),
      screen(
        "scr-bs",
        3.6,
        -11.2,
        8.2,
        "$shot:/media/live/binary-search-1.jpg",
        "Binary Search Visualizer on a monitor",
        1.4,
      ),
      screen(
        "scr-cpp",
        -3.6,
        -17.8,
        8.2,
        "$terminal",
        "The C++ Console Mini-Suite running in a terminal",
        -1,
      ),
    ],
    captions: [
      {
        id: "c-pb-0",
        text: "He turns algorithms into things you can **watch**.",
        at: [1.8, -1.6],
        t: [0.02, 0.32],
        side: "l",
      },
      {
        id: "p-opat",
        text: "project:o-patience",
        at: [1.2, -4.6],
        t: [0.04, 0.42],
        kind: "label",
        side: "l",
      },
      {
        id: "p-bs",
        text: "project:binary-search-visualizer",
        at: [-8.6, -11.2],
        t: [0.34, 0.72],
        kind: "label",
        side: "l",
      },
      {
        id: "p-cpp",
        text: "project:cpp-console-suite",
        at: [1.2, -17.8],
        t: [0.64, 1],
        kind: "label",
        side: "l",
      },
    ],
    cam: [
      { t: 0.06, x: 0, y: -5.4, h: 11.2 },
      { t: 0.45, x: 0, y: -11.4, h: 11.2 },
      { t: 0.86, x: 0, y: -18, h: 11.2 },
    ],
  },

  /* ------------------------------------------------------------------ Enter the system */
  {
    id: "enter",
    chapter: "system",
    heading: "Enter the system",
    length: 1.3,
    span: 12,
    bg: "#05060F",
    sound: "system",
    fx: "enter",
    gate: { kind: "enter", at: 0.4 },
    enter: { kind: "inkBleed", width: 0.7 },
    summary: "A monitor waits in the dark with one button: Enter the system.",
    panels: [
      {
        id: "enter-monitor",
        x: 0,
        y: -6,
        w: 12,
        aspect: FRAME_ASPECT,
        border: false,
        layers: [{ art: "$system", z: -0.02, rect: FRAME_HOLE }, L("frame", "bezel", 0)],
        alt: "A monitor in the dark showing a glowing grid.",
      },
    ],
    captions: [
      {
        id: "c-enter",
        text: "Every project lives **inside**.",
        at: [-6, -1.7],
        t: [0.05, 0.6],
        side: "l",
      },
    ],
    cam: [
      { t: 0.05, x: 0, y: -6, h: 11 },
      { t: 0.4, x: 0, y: -5.7, h: 9.6 },
      { t: 1, x: 0, y: -5.4, h: 2.6 },
    ],
  },
  {
    id: "void",
    chapter: "system",
    length: 3.2,
    span: 14,
    bg: "#030616",
    sound: "system",
    fx: "void",
    enter: { kind: "glow", width: 0.6 },
    summary:
      "Inside the monitor: a slow drift through a blue void where every project floats as a screen in the corners.",
    panels: [],
    captions: [],
    cam: [
      { t: 0, x: 0, y: -7, h: 10, z: 8 },
      { t: 1, x: 0, y: -7, h: 10, z: -66 },
    ],
  },

  /* ------------------------------------------------------------------ Act IV */
  {
    id: "power",
    chapter: "power",
    heading: "Power levels",
    length: 1.5,
    span: 13,
    bg: "#0A1440",
    sound: "colour",
    fx: "power",
    enter: { kind: "tear", width: 0.7 },
    summary:
      "A status window over Abhishek in colour: skills by tier and his live GitHub training log.",
    panels: [
      {
        id: "portrait",
        x: -4.4,
        y: -6.5,
        w: 7.2,
        aspect: 0.8,
        rot: -2,
        border: true,
        layers: [L("portrait", "face", 0, { inkOnly: true })],
        still: "portrait",
        alt: "Abhishek in ink and screentone, smiling at the reader.",
      },
    ],
    captions: [],
    cam: [
      { t: 0.06, x: 0, y: -6.5, h: 11.6 },
      { t: 0.94, x: 0.2, y: -6.8, h: 11.2 },
    ],
  },
  {
    id: "ask",
    chapter: "ask",
    heading: "Ask Abhishek",
    length: 1.8,
    span: 13,
    bg: "#0E0E10",
    sound: "calm",
    fx: "ask",
    enter: { kind: "inkBleed", width: 0.7 },
    summary: "He turns to the reader: ask him anything.",
    panels: [
      {
        id: "ask-eyes",
        x: 0,
        y: -2.6,
        w: 13,
        aspect: 1400 / 480,
        border: true,
        layers: [L("eyes", "eyes", 0, { inkOnly: true })],
        alt: "His eyes, looking straight at the reader.",
      },
    ],
    captions: [],
    cam: [
      { t: 0.06, x: 0, y: -6.2, h: 12.4 },
      { t: 0.94, x: 0, y: -6.2, h: 12.4 },
    ],
  },
];

export const PATHS: {
  id: PathId;
  label: string;
  colour: string;
  artefact: string;
  blurb: string;
}[] = [
  {
    id: "ml",
    label: "ML Engineer",
    colour: "#1F6BFF",
    artefact: "a neural core",
    blurb: "The Bluemind internship and the churn model.",
  },
  {
    id: "product",
    label: "Product Builder",
    colour: "#FFB020",
    artefact: "a blueprint cube",
    blurb: "MUSE, Arthra, Ro-Bio and Earth & Ethos.",
  },
  {
    id: "problem",
    label: "Problem Solver",
    colour: "#2BD67B",
    artefact: "sorting bars",
    blurb: "O(patience), Binary Search and the C++ suite.",
  },
];

/** Python that types out on the monitor during Code Awakening (from his churn capstone). */
export const AWAKEN_CODE = [
  "from lightgbm import LGBMClassifier",
  "from sklearn.metrics import roc_auc_score",
  "",
  "model = LGBMClassifier()",
  "model.fit(X_train, y_train)",
  "",
  "proba = model.predict_proba(X_test)[:, 1]",
  "print(roc_auc_score(y_test, proba))",
  ">>> 0.847",
];

/** Text on the glass shards when the old room breaks (each names its source). */
export const STAT_SHARDS: { value: string; label: string }[] = [
  { value: "9.44", label: "average GPA" },
  { value: "0.847", label: "ROC-AUC · churn model" },
  { value: "82%", label: "churners caught" },
  { value: "1,159+", label: "verified student IDs · MUSE" },
  { value: "60", label: "automated tests · Arthra" },
  { value: "192", label: "passing tests · Ro-Bio" },
];

export const SKILLS: { tier: "S" | "A" | "B"; label: string; items: string[] }[] = [
  {
    tier: "S",
    label: "Proficient",
    items: ["Python", "NumPy", "Pandas", "Scikit-learn", "Git", "Linear Algebra", "Calculus"],
  },
  {
    tier: "A",
    label: "Intermediate",
    items: [
      "XGBoost",
      "LightGBM",
      "Matplotlib / Seaborn",
      "Streamlit",
      "SQL",
      "DSA",
      "Probability & Statistics",
    ],
  },
  { tier: "B", label: "Learning", items: ["PyTorch", "FastAPI", "Discrete Mathematics"] },
];
