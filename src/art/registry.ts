/**
 * Every illustrated panel, its size and its layers (back to front). scripts/build-art.ts draws each
 * layer in each mode and writes public/art/<panel>/<layer>-<mode>.webp (+ a -lite copy) and a
 * flattened public/art/static/<panel>.webp for the no-JavaScript webtoon.
 *
 * To drop in a ChatGPT panel: save it over the matching .webp (same size and name); see
 * docs/ART-PIPELINE.md §6.
 */
import type { Mode } from "./ink";
import { coast } from "./scenes/coast";
import {
  altar,
  boyEyes,
  dawn,
  frame,
  gpuInset,
  handsInset,
  keysInset,
  maths,
  mlSky,
  monitor,
  mysuru,
  rise,
  room,
} from "./scenes/more";

export type ArtDef = {
  w: number;
  h: number;
  /** Modes drawn. Ink panels get a colour twin for the colour flood. */
  modes: Mode[];
  /** Layer names, back to front. */
  layers: string[];
  /** Code-drawn plate. Absent for photo plates (made from public/media/abhishek-portrait.jpg). */
  draw?: (mode: Mode) => Record<string, string>;
  /** Photo plate: crop of the portrait (source px) processed into ink / colour comic tones. */
  photo?: { crop: [number, number, number, number]; mask?: [number, number, number, number] };
  /** Mode used for the flattened static (no-JS) image. */
  staticMode?: Mode;
};

const BOTH: Mode[] = ["ink", "colour"];
const COLOUR: Mode[] = ["colour"];

export const ART: Record<string, ArtDef> = {
  coast: {
    w: 1600,
    h: 1000,
    modes: BOTH,
    layers: ["sky", "sea", "land", "boy", "palms", "fx"],
    draw: coast,
  },
  hands: { w: 800, h: 800, modes: BOTH, layers: ["back", "hands"], draw: handsInset },
  "boy-eyes": { w: 1400, h: 480, modes: BOTH, layers: ["eyes"], draw: boyEyes },
  maths: { w: 1200, h: 1400, modes: BOTH, layers: ["sky", "ground"], draw: maths },
  mysuru: { w: 1600, h: 1000, modes: BOTH, layers: ["sky", "city", "roof"], draw: mysuru },
  room: { w: 1600, h: 1000, modes: BOTH, layers: ["back", "desk", "figure", "fx"], draw: room },
  keys: { w: 800, h: 800, modes: BOTH, layers: ["keys"], draw: keysInset },
  gpu: { w: 800, h: 800, modes: BOTH, layers: ["gpu"], draw: gpuInset },
  eyes: { w: 1400, h: 480, modes: BOTH, layers: ["eyes"], photo: { crop: [262, 268, 276, 95] } },
  monitor: { w: 1600, h: 1000, modes: BOTH, layers: ["bezel", "hands"], draw: monitor },
  rise: { w: 900, h: 1300, modes: COLOUR, layers: ["hero"], draw: rise },
  dawn: { w: 1600, h: 1000, modes: COLOUR, layers: ["sky"], draw: dawn },
  altar: { w: 1600, h: 1000, modes: COLOUR, layers: ["sky", "slab"], draw: altar },
  "ml-sky": { w: 1600, h: 1000, modes: COLOUR, layers: ["sky", "ledge"], draw: mlSky },
  frame: { w: 1200, h: 820, modes: BOTH, layers: ["bezel"], draw: frame, staticMode: "colour" },
  portrait: {
    w: 800,
    h: 1000,
    modes: BOTH,
    layers: ["face"],
    photo: { crop: [100, 130, 640, 800], mask: [0.5, 0.46, 0.36, 0.56] },
  },
};
