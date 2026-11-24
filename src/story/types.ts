/**
 * The shape of the story. One definition (src/story/story.ts) drives the server-rendered webtoon,
 * the WebGL stage, the caption layer, sound and the tests.
 *
 * World units: a desktop 16:10 viewport framing a panel at rest sees 10 units of height.
 * Panel coordinates are relative to their beat's origin (x right, y up; beats stack downward).
 */

export type Mode = "ink" | "colour";
export type PathId = "ml" | "product" | "problem";
export type GateKind = "awaken" | "rise" | "choose" | "enter";
export type TransitionKind = "inkBleed" | "tear" | "burn" | "shatter" | "glow";
export type SoundScene = "ink" | "night" | "swell" | "colour" | "system" | "calm";

export type LayerDef = {
  /** Panel id in src/art/registry.ts ("coast") or a runtime texture ("$code", "$shot:<url>"). */
  art: string;
  /** Layer name inside that panel ("sky"). Ignored for runtime textures. */
  layer?: string;
  /** Depth toward the camera, world units. Layers are scaled so the composition lines up at rest. */
  z: number;
  /** Idle motion that keeps a resting frame alive. */
  idle?: "sway" | "bob" | "drift" | "flicker" | "rise";
  /** Additive blending (light, glow). */
  add?: boolean;
  /** Sub-rectangle of the panel this layer covers, in panel 0..1 coords [x, y, w, h] (default full). */
  rect?: [number, number, number, number];
  opacity?: number;
  /** Always show the ink plate, even after the colour flood. */
  inkOnly?: boolean;
};

export type PanelDef = {
  id: string;
  /** Centre relative to the beat origin. */
  x: number;
  y: number;
  /** Width in world units; height comes from `aspect` (w / h). */
  w: number;
  aspect: number;
  /** Panel plane depth (insets float in front). */
  z?: number;
  rot?: number;
  border?: boolean;
  layers: LayerDef[];
  /** Static (no-JS) image and its alt text. */
  still?: string;
  alt: string;
  /** The camera height this panel is composed for (for depth compensation). Default: panel height. */
  restH?: number;
};

export type CaptionKind = "caption" | "speech" | "sfx" | "title" | "big" | "label";

export type CaptionDef = {
  id: string;
  /** Text. **double asterisks** mark the electric-blue keywords. */
  text: string;
  /** Anchor relative to the beat origin. */
  at: [number, number, number?];
  /** Visible while the beat's local t is in this window. */
  t: [number, number];
  kind?: CaptionKind;
  /** Which side of the anchor the box hangs from. */
  side?: "l" | "r" | "c";
  /** Width in px at reference scale. */
  width?: number;
};

export type CamKey = {
  /** Local t in the beat (0..1). */
  t: number;
  x: number;
  y: number;
  /** World height to frame (sets the distance). */
  h: number;
  /** Optional explicit z (world, relative to beat origin) instead of a distance from h. */
  z?: number;
  /** Roll, degrees. */
  rot?: number;
  /** Jump here without interpolating from the previous key (hidden by a transition). */
  cut?: boolean;
};

export type BeatDef = {
  id: string;
  chapter: string;
  /** Chapter heading for the SSR article (first beat of a chapter). */
  heading?: string;
  /** Scroll length in viewport heights. */
  length: number;
  /** Vertical world space this beat occupies (beats stack downward). */
  span: number;
  /** Page colour behind the panels. */
  bg: string;
  panels: PanelDef[];
  captions: CaptionDef[];
  cam: CamKey[];
  gate?: { kind: GateKind; at: number };
  /** Transition into this beat, centred on its start; width is in viewport heights of scroll. */
  enter?: { kind: TransitionKind; width: number };
  sound: SoundScene;
  /** Which path chapter this beat belongs to (reordered by the choice). */
  path?: PathId;
  /** Special set piece the engine builds for this beat. */
  fx?:
    | "title"
    | "awaken"
    | "rise"
    | "shatter"
    | "choose"
    | "enter"
    | "void"
    | "power"
    | "ask"
    | "sorting";
  /** Plain-text description of the beat for the SSR webtoon (what the art shows). */
  summary?: string;
};
