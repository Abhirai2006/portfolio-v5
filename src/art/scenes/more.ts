/**
 * The rest of the illustrated plates (code-drawn placeholders for the ChatGPT panels).
 * Ink plates: black ink + paper, electric blue only on the named light. Colour plates: full colour.
 */
import {
  BLUE,
  BLUE_GLOW,
  INK,
  blurFilter,
  brush,
  f,
  glowFilter,
  hatch,
  linePattern,
  pick,
  rng,
  roughFilter,
  smoothPath,
  speedLines,
  stars,
  svg,
  tonePattern,
  waveLines,
  type Mode,
  type Pt,
} from "../ink";
import { cloud, house, palm } from "./coast";

const P = "#F2EFE8";
const commonDefs = `${roughFilter("rough", 3, 0.035)}${glowFilter("glow", 10)}${glowFilter("glow2", 26)}${blurFilter("soft", 22)}${blurFilter("soft2", 60)}${tonePattern("tone", 7, 1.5)}${tonePattern("toneW", 7, 1.4, P)}${linePattern("lines", 6, 1.3)}`;

/* ---------------------------------------------------------------- figures */

/** An adult hand seen from above, fingers pointing down onto keys. */
function hand(
  cx: number,
  cy: number,
  s: number,
  rot: number,
  fill: string,
  line: string,
  seed: number,
) {
  const r = rng(seed);
  const fingers = [
    [-30, 10, 58, -8],
    [-10, 22, 70, -2],
    [12, 24, 66, 4],
    [32, 16, 52, 10],
  ];
  let g = "";
  for (const [fx, fy, len, a] of fingers) {
    const L = len * (0.92 + r() * 0.16);
    g += `<rect x="${f(fx - 9)}" y="${f(fy)}" width="18" height="${f(L)}" rx="9" transform="rotate(${a} ${fx} ${fy})" fill="${fill}" stroke="${line}" stroke-width="3"/>`;
    g += `<path d="M${f(fx - 6)},${f(fy + L * 0.55)}q6,3 12,0" stroke="${line}" stroke-width="2" fill="none" transform="rotate(${a} ${fx} ${fy})"/>`;
  }
  g += `<path d="M-46,-40 C-52,0 -44,26 -30,30 L40,28 C54,10 52,-24 44,-44 C20,-56 -20,-56 -46,-40Z" fill="${fill}" stroke="${line}" stroke-width="3"/>`;
  g += `<path d="M-44,0 C-66,10 -74,26 -70,40 C-64,46 -54,40 -48,28" fill="${fill}" stroke="${line}" stroke-width="3"/>`;
  g += `<path d="M-30,-20 C-10,-12 16,-12 34,-22" stroke="${line}" stroke-width="2" fill="none" opacity="0.7"/>`;
  return `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${rot + 180}) scale(${s})">${g}</g>`;
}

/** Keyboard in perspective: rows of keycaps. */
function keyboard(
  x: number,
  y: number,
  w: number,
  h: number,
  rows: number,
  cols: number,
  fill: string,
  line: string,
  top: string,
) {
  let out = `<path d="M${f(x + w * 0.06)},${f(y)} L${f(x + w * 0.94)},${f(y)} L${f(x + w)},${f(y + h)} L${f(x)},${f(y + h)}Z" fill="${line}"/>`;
  for (let rI = 0; rI < rows; rI++) {
    const t0 = (rI + 0.12) / rows;
    const t1 = (rI + 0.88) / rows;
    const y0 = y + h * t0;
    const y1 = y + h * t1;
    const inset0 = w * 0.06 * (1 - t0);
    const inset1 = w * 0.06 * (1 - t1);
    for (let c = 0; c < cols; c++) {
      const u0 = (c + 0.1) / cols;
      const u1 = (c + 0.9) / cols;
      const ax = x + inset0 + (w - 2 * inset0) * u0;
      const bx = x + inset0 + (w - 2 * inset0) * u1;
      const cx2 = x + inset1 + (w - 2 * inset1) * u1;
      const dx = x + inset1 + (w - 2 * inset1) * u0;
      out += `<path d="M${f(ax)},${f(y0)}L${f(bx)},${f(y0)}L${f(cx2)},${f(y1)}L${f(dx)},${f(y1)}Z" fill="${fill}" stroke="${line}" stroke-width="1.5"/>`;
      out += `<path d="M${f(ax + 2)},${f(y0 + 2)}L${f(bx - 2)},${f(y0 + 2)}" stroke="${top}" stroke-width="2"/>`;
    }
  }
  return out;
}

/** Young man from behind in a hoodie (head, hood, shoulders, back), lit from the front. */
export function hoodieBack(cx: number, base: number, s: number, mode: Mode, rim = BLUE_GLOW) {
  const ink = mode === "ink";
  const body = pick(mode, INK, "#1A2236");
  const hair = pick(mode, INK, "#0C0B12");
  const skin = pick(mode, P, "#A86F4E");
  const X = (n: number) => f(cx + n * s);
  const Y = (n: number) => f(base - n * s);
  const edge = ink ? P : INK;
  let out = `<path d="M${X(-120)},${Y(0)} C${X(-128)},${Y(90)} ${X(-110)},${Y(170)} ${X(-70)},${Y(200)} C${X(-40)},${Y(214)} ${X(40)},${Y(214)} ${X(70)},${Y(200)} C${X(110)},${Y(170)} ${X(128)},${Y(90)} ${X(120)},${Y(0)}Z" fill="${body}" stroke="${edge}" stroke-width="${f(3 * s)}"/>`;
  out += `<path d="M${X(-52)},${Y(196)} C${X(-60)},${Y(240)} ${X(-30)},${Y(262)} ${X(0)},${Y(262)} C${X(30)},${Y(262)} ${X(60)},${Y(240)} ${X(52)},${Y(196)}" fill="${body}" stroke="${edge}" stroke-width="${f(3 * s)}"/>`;
  out += `<path d="M${X(-10)},${Y(208)} C${X(-14)},${Y(140)} ${X(-18)},${Y(80)} ${X(-22)},${Y(40)}" stroke="${ink ? "#3A3A44" : "#0E1424"}" stroke-width="${f(3 * s)}" fill="none"/>`;
  out += `<rect x="${X(-16)}" y="${Y(262)}" width="${f(32 * s)}" height="${f(30 * s)}" fill="${skin}" stroke="${INK}" stroke-width="${f(2.5 * s)}"/>`;
  out += `<ellipse cx="${X(0)}" cy="${Y(316)}" rx="${f(44 * s)}" ry="${f(52 * s)}" fill="${hair}" stroke="${edge}" stroke-width="${f(3 * s)}"/>`;
  out += `<path d="M${X(-44)},${Y(330)} C${X(-40)},${Y(372)} ${X(-10)},${Y(380)} ${X(10)},${Y(376)} C${X(36)},${Y(372)} ${X(50)},${Y(350)} ${X(44)},${Y(318)}" fill="${hair}"/>`;
  out += `<ellipse cx="${X(-45)}" cy="${Y(306)}" rx="${f(8 * s)}" ry="${f(13 * s)}" fill="${skin}" stroke="${INK}" stroke-width="${f(2 * s)}"/>`;
  const rimStroke = (p: Pt[], w: number, sd: number) =>
    `<path d="${brush(p, w * s, sd)}" fill="${rim}" opacity="0.92"/>`;
  out += rimStroke(
    [
      [cx - 42 * s, base - 352 * s],
      [cx - 2 * s, base - 370 * s],
      [cx + 38 * s, base - 350 * s],
    ],
    7,
    3,
  );
  out += rimStroke(
    [
      [cx - 116 * s, base - 30 * s],
      [cx - 118 * s, base - 110 * s],
      [cx - 90 * s, base - 180 * s],
      [cx - 52 * s, base - 202 * s],
    ],
    6,
    5,
  );
  out += rimStroke(
    [
      [cx + 116 * s, base - 30 * s],
      [cx + 118 * s, base - 110 * s],
      [cx + 90 * s, base - 180 * s],
      [cx + 52 * s, base - 202 * s],
    ],
    6,
    6,
  );
  if (ink)
    out += `<g opacity="0.6">${hatch([cx - 110 * s, base - 200 * s, 220 * s, 200 * s], { angle: 70, gap: 7 * s, width: 1.2, seed: 9, colour: "#34343C" })}</g>`;
  return out;
}

/* ---------------------------------------------------------------- insets */

export function handsInset(mode: Mode) {
  const W = 800,
    H = 800;
  const ink = mode === "ink";
  const rr = rng(8);
  let back = `<rect width="${W}" height="${H}" fill="${ink ? P : "#1B2340"}"/>`;
  back += `<rect width="${W}" height="${H * 0.36}" fill="${ink ? INK : "#0C1230"}"/>`;
  back += `<rect x="40" y="40" width="${W - 80}" height="${H * 0.36 - 60}" rx="18" fill="${BLUE}" opacity="${ink ? 0.95 : 0.85}"/>`;
  back += `<rect x="40" y="40" width="${W - 80}" height="${H * 0.36 - 60}" rx="18" fill="${BLUE_GLOW}" opacity="0.5" filter="url(#soft)"/>`;
  for (let i = 0; i < 7; i++)
    back += `<rect x="${70 + (i % 2) * 30}" y="${66 + i * 26}" width="${f(140 + rr() * 380)}" height="9" rx="4" fill="${P}" opacity="0.55"/>`;
  back += keyboard(
    -40,
    H * 0.4,
    W + 80,
    H * 0.62,
    5,
    12,
    ink ? P : "#C9CEDB",
    INK,
    ink ? "#FFFFFF" : "#E8ECF4",
  );
  back += `<rect width="${W}" height="${H}" fill="url(#glowfall)" opacity="0.6"/>`;
  let hands =
    hand(250, 470, 1.9, 18, ink ? P : "#9C6A4C", INK, 3) +
    hand(560, 455, 1.9, -14, ink ? P : "#9C6A4C", INK, 4);
  if (ink)
    hands += `<g opacity="0.55">${hatch([100, 380, 600, 220], { angle: 60, gap: 8, width: 1.2, seed: 2 })}</g>`;
  hands += speedLines(400, 520, 300, 520, 26, 12, INK, 4);
  const defs = `${commonDefs}<linearGradient id="glowfall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BLUE_GLOW}" stop-opacity="0.8"/><stop offset="0.6" stop-color="${BLUE_GLOW}" stop-opacity="0"/></linearGradient>`;
  return { back: svg(W, H, defs, back), hands: svg(W, H, defs, hands) };
}

export function boyEyes(mode: Mode) {
  const W = 1400,
    H = 480;
  const ink = mode === "ink";
  let s = `<rect width="${W}" height="${H}" fill="${ink ? P : "#C8906A"}"/>`;
  if (ink) s += `<rect width="${W}" height="${H}" fill="url(#tone)" opacity="0.18"/>`;
  for (const [cx, flip] of [
    [440, 1],
    [960, -1],
  ] as const) {
    const eye = `M${cx - 160 * flip},250 C${cx - 90 * flip},180 ${cx + 60 * flip},170 ${cx + 160 * flip},206 C${cx + 120 * flip},280 ${cx - 60 * flip},310 ${cx - 160 * flip},250Z`;
    s += `<path d="${brush(
      [
        [cx - 170 * flip, 120],
        [cx - 40 * flip, 78],
        [cx + 140 * flip, 96],
      ],
      26,
      cx,
    )}" fill="${INK}"/>`;
    s += `<path d="${eye}" fill="${P}"/>`;
    s += `<clipPath id="eye${cx}"><path d="${eye}"/></clipPath>`;
    s += `<g clip-path="url(#eye${cx})"><circle cx="${cx}" cy="236" r="78" fill="${ink ? INK : "#2B1A12"}"/>`;
    s += `<circle cx="${cx}" cy="236" r="60" fill="${ink ? "#2E2E34" : "#5A3A22"}"/>${hatch([cx - 80, 160, 160, 160], { angle: 20, gap: 5, width: 1.4, seed: cx, colour: INK })}<circle cx="${cx}" cy="236" r="28" fill="${INK}"/>`;
    s += `<circle cx="${cx - 26}" cy="210" r="16" fill="${P}"/><circle cx="${cx + 24}" cy="262" r="7" fill="${P}"/>`;
    s += `<path d="M${cx - 50},286 Q${cx},300 ${cx + 50},284" stroke="${BLUE}" stroke-width="6" fill="none" opacity="0.9"/></g>`;
    s += `<path d="${brush(
      [
        [cx - 175 * flip, 248],
        [cx - 90 * flip, 176],
        [cx + 40 * flip, 160],
        [cx + 165 * flip, 200],
      ],
      22,
      cx + 2,
      { taper: 0.2 },
    )}" fill="${INK}"/>`;
    s += `<path d="${brush(
      [
        [cx - 120 * flip, 292],
        [cx, 312],
        [cx + 120 * flip, 270],
      ],
      6,
      cx + 9,
    )}" fill="${INK}"/>`;
  }
  s += speedLines(700, 240, 560, 900, 40, 5, INK, 3);
  return { eyes: svg(W, H, commonDefs, s) };
}

/* ---------------------------------------------------------------- maths sky */

export function maths(mode: Mode) {
  const W = 1200,
    H = 1400;
  const ink = mode === "ink";
  const defs = `${commonDefs}<linearGradient id="msky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05071C"/><stop offset="1" stop-color="#22296E"/></linearGradient>`;
  let sky = `<rect width="${W}" height="${H}" fill="${ink ? INK : "url(#msky)"}"/>`;
  sky += stars([0, 0, W, H * 0.8], 380, 61, ink ? P : "#DDE5FF", 0.07);
  const star = (x: number, y: number, r = 5) =>
    `<circle cx="${f(x)}" cy="${f(y)}" r="${r * 3}" fill="${ink ? BLUE_GLOW : "#9DB7FF"}" opacity="0.3"/><circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${ink ? P : "#FFFFFF"}"/>`;
  const link = (a: Pt, b: Pt) =>
    `<path d="M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}" stroke="${ink ? P : "#C9D5FF"}" stroke-width="1.8" stroke-dasharray="2 6" opacity="0.8"/>`;
  const shape = (p: Pt[]) => {
    let o = "";
    for (let i = 0; i < p.length - 1; i++) o += link(p[i], p[i + 1]);
    return o + p.map(([x, y]) => star(x, y)).join("");
  };
  sky += shape([
    [230, 170],
    [110, 170],
    [190, 270],
    [110, 370],
    [230, 370],
  ]);
  sky += shape([
    [800, 150],
    [1000, 150],
  ]);
  sky += shape([
    [855, 150],
    [835, 310],
  ]);
  sky += shape([
    [945, 150],
    [965, 310],
  ]);
  const integ: Pt[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    integ.push([520 + Math.sin(t * Math.PI) * 30 - (t - 0.5) * 50, 380 + t * 260]);
  }
  sky += shape(integ);
  const sine: Pt[] = [];
  for (let i = 0; i <= 14; i++) sine.push([90 + i * 72, 760 + Math.sin(i * 0.9) * 60]);
  sky += `<path d="${smoothPath(sine)}" stroke="${BLUE}" stroke-width="4" fill="none" filter="url(#glow)"/>`;
  sky += sine.map(([x, y]) => star(x, y, 3.5)).join("");
  const layers: Pt[][] = [
    [
      [760, 420],
      [760, 500],
      [760, 580],
    ],
    [
      [880, 400],
      [880, 470],
      [880, 540],
      [880, 610],
    ],
    [
      [1000, 470],
      [1000, 550],
    ],
  ];
  for (let l = 0; l < layers.length - 1; l++)
    for (const a of layers[l]) for (const b of layers[l + 1]) sky += link(a, b);
  sky += layers
    .flat()
    .map(([x, y]) => star(x, y, 4))
    .join("");
  let ground = `<path d="M0,1180 C300,1150 700,1170 1200,1140 L1200,1400 L0,1400Z" fill="${ink ? INK : "#0A0C1E"}" stroke="${ink ? P : "#2A2F5C"}" stroke-width="3"/>`;
  ground += house(420, 1200, 300, 240, mode, 7);
  ground += palm(
    880,
    1260,
    520,
    -60,
    21,
    ink ? INK : "#060B10",
    ink ? "#3A3A40" : "#141C24",
    ink ? P : undefined,
  );
  ground += palm(
    150,
    1280,
    430,
    50,
    23,
    ink ? INK : "#060B10",
    ink ? "#3A3A40" : "#141C24",
    ink ? P : undefined,
  );
  return { sky: svg(W, H, defs, sky), ground: svg(W, H, defs, ground) };
}

/* ---------------------------------------------------------------- Mysuru */

function palace(cx: number, base: number, s: number, mode: Mode) {
  const ink = mode === "ink";
  const body = pick(mode, INK, "#120F24");
  const edge = pick(mode, P, "#2B2550");
  const bulb = pick(mode, P, "#FFD27A");
  const X = (n: number) => cx + n * s;
  const Y = (n: number) => base - n * s;
  let out = "";
  const bulbs: Pt[] = [];
  const line = (a: Pt, b: Pt, n: number) => {
    for (let i = 0; i <= n; i++)
      bulbs.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
  };
  if (!ink)
    out += `<rect x="${f(X(-460))}" y="${f(Y(560))}" width="${f(920 * s)}" height="${f(560 * s)}" fill="#FFB347" opacity="0.22" filter="url(#soft2)"/>`;
  out += `<rect x="${f(X(-420))}" y="${f(Y(170))}" width="${f(840 * s)}" height="${f(170 * s)}" fill="${body}" stroke="${edge}" stroke-width="2"/>`;
  line([X(-420), Y(170)], [X(420), Y(170)], 60);
  line([X(-420), Y(96)], [X(420), Y(96)], 60);
  for (let i = -6; i <= 6; i++) {
    const ax = X(i * 60);
    out += `<path d="M${f(ax - 20 * s)},${f(Y(10))} V${f(Y(60))} Q${f(ax)},${f(Y(86))} ${f(ax + 20 * s)},${f(Y(60))} V${f(Y(10))}Z" fill="${ink ? P : "#3A2C1E"}" opacity="${ink ? 0.85 : 1}"/>`;
    for (let k = 0; k <= 6; k++) {
      const a = Math.PI - (k / 6) * Math.PI;
      bulbs.push([ax + Math.cos(a) * 20 * s, Y(62) - Math.sin(a) * 22 * s]);
    }
  }
  out += `<rect x="${f(X(-90))}" y="${f(Y(330))}" width="${f(180 * s)}" height="${f(170 * s)}" fill="${body}" stroke="${edge}" stroke-width="2"/>`;
  line([X(-90), Y(330)], [X(-90), Y(170)], 14);
  line([X(90), Y(330)], [X(90), Y(170)], 14);
  out += `<path d="M${f(X(-80))},${f(Y(330))} C${f(X(-100))},${f(Y(430))} ${f(X(-20))},${f(Y(470))} ${f(X(0))},${f(Y(520))} C${f(X(20))},${f(Y(470))} ${f(X(100))},${f(Y(430))} ${f(X(80))},${f(Y(330))}Z" fill="${body}" stroke="${edge}" stroke-width="2"/>`;
  for (let k = 0; k <= 16; k++) {
    const t = k / 16;
    bulbs.push([X(-80 + 160 * t), Y(330 + Math.sin(t * Math.PI) * 110)]);
  }
  out += `<path d="M${f(X(0))},${f(Y(520))} V${f(Y(560))}" stroke="${edge}" stroke-width="3"/>`;
  for (const sx of [-330, 330]) {
    out += `<rect x="${f(X(sx - 40))}" y="${f(Y(280))}" width="${f(80 * s)}" height="${f(110 * s)}" fill="${body}" stroke="${edge}" stroke-width="2"/>`;
    out += `<path d="M${f(X(sx - 40))},${f(Y(280))} C${f(X(sx - 46))},${f(Y(330))} ${f(X(sx - 6))},${f(Y(350))} ${f(X(sx))},${f(Y(380))} C${f(X(sx + 6))},${f(Y(350))} ${f(X(sx + 46))},${f(Y(330))} ${f(X(sx + 40))},${f(Y(280))}Z" fill="${body}" stroke="${edge}" stroke-width="2"/>`;
    line([X(sx - 40), Y(280)], [X(sx - 40), Y(170)], 8);
    line([X(sx + 40), Y(280)], [X(sx + 40), Y(170)], 8);
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      bulbs.push([X(sx - 40 + 80 * t), Y(280 + Math.sin(t * Math.PI) * 60)]);
    }
  }
  out += `<g fill="${bulb}">${bulbs.map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(2.8 * s)}"/>`).join("")}</g>`;
  if (!ink)
    out += `<g fill="#FFE6A8" opacity="0.7" filter="url(#glow)">${bulbs
      .filter((_, i) => i % 3 === 0)
      .map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(3 * s)}"/>`)
      .join("")}</g>`;
  return out;
}

export function mysuru(mode: Mode) {
  const W = 1600,
    H = 1000;
  const ink = mode === "ink";
  const defs = `${commonDefs}<linearGradient id="ysky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070821"/><stop offset="1" stop-color="#3A2A5E"/></linearGradient>`;
  let sky = `<rect width="${W}" height="${H}" fill="${ink ? INK : "url(#ysky)"}"/>`;
  sky += stars([0, 0, W, 500], 220, 81, ink ? P : "#E6E2FF", 0.05);
  if (ink)
    sky += waveLines([0, 60, W, 420], 16, 8, {
      amp: 2,
      width: 2,
      colour: "#25252B",
      persp: false,
      len: [0.1, 0.4],
    });
  sky += `<g filter="url(#rough)">${cloud(260, 300, 420, 31, ink ? P : "#5B4F8E", INK, 0.7)}${cloud(1380, 240, 360, 33, ink ? P : "#5B4F8E", INK, 0.7)}</g>`;
  let city = palace(900, 760, 1.05, mode);
  const rr = rng(5);
  let x = -20;
  while (x < W) {
    const w = 60 + rr() * 120;
    const h = 40 + rr() * 90;
    city += `<rect x="${f(x)}" y="${f(820 - h)}" width="${f(w)}" height="${f(h + 200)}" fill="${ink ? INK : "#0E0B1E"}" stroke="${ink ? P : "#251E44"}" stroke-width="2"/>`;
    for (let k = 0; k < 3; k++)
      if (rr() > 0.5)
        city += `<rect x="${f(x + 10 + rr() * (w - 30))}" y="${f(820 - h + 14 + rr() * (h - 30))}" width="9" height="12" fill="${ink ? P : "#FFC870"}" opacity="0.85"/>`;
    x += w + 4;
  }
  let roof = `<path d="M0,880 L1600,850 L1600,1000 L0,1000Z" fill="${ink ? INK : "#07060F"}" stroke="${ink ? P : "#1C1832"}" stroke-width="3"/>`;
  roof += `<rect x="1180" y="760" width="120" height="96" fill="${ink ? INK : "#0C0A18"}" stroke="${ink ? P : "#26203F"}" stroke-width="3"/>`;
  roof += `<path d="M1240,760 V700 M1210,700 H1270 M1220,712 H1260" stroke="${ink ? P : "#3A3360"}" stroke-width="3"/>`;
  roof += `<g transform="translate(330 880) scale(0.55)">${hoodieBack(0, 0, 1, mode, ink ? BLUE_GLOW : "#7FB2FF")}</g>`;
  roof += `<rect x="420" y="836" width="56" height="46" rx="12" fill="${ink ? INK : "#22304E"}" stroke="${ink ? P : INK}" stroke-width="3"/>`;
  return { sky: svg(W, H, defs, sky), city: svg(W, H, defs, city), roof: svg(W, H, defs, roof) };
}

/* ---------------------------------------------------------------- the room, 10 pm */

function fan(cx: number, cy: number, r: number, mode: Mode, seed: number) {
  const ink = mode === "ink";
  let out = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${ink ? INK : "#0A0F1E"}" stroke="${ink ? P : "#2A3350"}" stroke-width="3"/>`;
  out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.94)}" fill="none" stroke="${BLUE_GLOW}" stroke-width="${f(r * 0.08)}" filter="url(#glow)"/>`;
  out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.94)}" fill="none" stroke="${BLUE}" stroke-width="${f(r * 0.04)}"/>`;
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + seed;
    const a2 = a + 0.55;
    const r0 = r * 0.24;
    const r1 = r * 0.84;
    out += `<path d="M${f(cx + Math.cos(a) * r0)},${f(cy + Math.sin(a) * r0)} Q${f(cx + Math.cos(a + 0.5) * r1 * 0.7)},${f(cy + Math.sin(a + 0.5) * r1 * 0.7)} ${f(cx + Math.cos(a2) * r1)},${f(cy + Math.sin(a2) * r1)} Q${f(cx + Math.cos(a2 - 0.2) * r1 * 0.6)},${f(cy + Math.sin(a2 - 0.2) * r1 * 0.6)} ${f(cx + Math.cos(a + 0.25) * r0)},${f(cy + Math.sin(a + 0.25) * r0)}Z" fill="${ink ? "#1A1A20" : "#131A30"}" stroke="${ink ? P : "#3B4A78"}" stroke-width="1.6"/>`;
  }
  out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.24)}" fill="${ink ? INK : "#0A0F1E"}" stroke="${BLUE_GLOW}" stroke-width="2"/>`;
  return out;
}

export function room(mode: Mode) {
  const W = 1600,
    H = 1000;
  const ink = mode === "ink";
  const rr = rng(3);
  const defs = `${commonDefs}<radialGradient id="spill" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${BLUE_GLOW}" stop-opacity="0.75"/><stop offset="1" stop-color="${BLUE}" stop-opacity="0"/></radialGradient>
  <linearGradient id="scr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BLUE_GLOW}"/><stop offset="1" stop-color="${BLUE}"/></linearGradient>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1022"/><stop offset="1" stop-color="#161E3C"/></linearGradient>`;
  let back = `<rect width="${W}" height="${H}" fill="${ink ? INK : "url(#wall)"}"/>`;
  if (ink)
    back += `<g opacity="0.5">${hatch([0, 0, W, 700], { angle: 85, gap: 9, width: 1.2, seed: 4, colour: "#2C2C34" })}</g>`;
  back += `<rect x="1150" y="90" width="340" height="300" fill="${ink ? "#15151A" : "#0A0E2C"}" stroke="${ink ? P : "#2B3360"}" stroke-width="6"/>`;
  back += stars([1155, 95, 330, 160], 40, 9, ink ? P : "#C9D4FF", 0.1);
  back += `<circle cx="1420" cy="150" r="32" fill="${ink ? P : "#F3EDD2"}"/>`;
  for (let i = 0; i < 9; i++) {
    const bx = 1160 + i * 38;
    const bh = 40 + rr() * 90;
    back += `<rect x="${bx}" y="${f(390 - bh)}" width="34" height="${f(bh)}" fill="${ink ? INK : "#060818"}" stroke="${ink ? P : "#1C2244"}" stroke-width="1.5"/>`;
    if (rr() > 0.4)
      back += `<rect x="${bx + 10}" y="${f(390 - bh + 12)}" width="7" height="9" fill="${ink ? P : "#FFC870"}"/>`;
  }
  back += `<path d="M1320,90V390M1150,240H1490" stroke="${ink ? P : "#2B3360"}" stroke-width="6"/>`;
  back += `<rect x="130" y="110" width="200" height="270" fill="${ink ? "#1E1E24" : "#1E2A55"}" stroke="${ink ? P : "#2E3A6A"}" stroke-width="3" transform="rotate(-3 230 245)"/>`;
  back += `<rect x="380" y="140" width="160" height="210" fill="${ink ? "#1E1E24" : "#3A2450"}" stroke="${ink ? P : "#4A3466"}" stroke-width="3" transform="rotate(2 460 245)"/>`;
  back += `<rect x="0" y="690" width="${W}" height="${H - 690}" fill="${ink ? "#121216" : "#0C1124"}"/>`;
  let desk = `<ellipse cx="700" cy="420" rx="620" ry="380" fill="url(#spill)" opacity="${ink ? 0.55 : 0.8}"/>`;
  desk += `<path d="M0,690 L1600,690 L1600,730 L0,730Z" fill="${ink ? INK : "#141A2E"}" stroke="${ink ? P : "#2C355A"}" stroke-width="3"/>`;
  desk += `<path d="M0,730 L1600,730 L1600,1000 L0,1000Z" fill="${ink ? "#0E0E12" : "#0A0E1C"}"/>`;
  desk += `<rect x="360" y="230" width="620" height="380" rx="14" fill="${INK}" stroke="${ink ? P : "#3A4570"}" stroke-width="4"/>`;
  desk += `<rect x="382" y="252" width="576" height="336" rx="6" fill="url(#scr)"/>`;
  for (let i = 0; i < 11; i++)
    desk += `<rect x="${410 + (i % 3) * 24}" y="${276 + i * 27}" width="${f(120 + rr() * 300)}" height="9" rx="4" fill="${P}" opacity="${f(0.5 + rr() * 0.4)}"/>`;
  desk += `<rect x="382" y="252" width="576" height="336" rx="6" fill="${BLUE_GLOW}" opacity="0.4" filter="url(#soft)"/>`;
  desk += `<path d="M630,610 L610,690 L730,690 L710,610Z" fill="${INK}" stroke="${ink ? P : "#3A4570"}" stroke-width="3"/>`;
  desk += keyboard(470, 640, 420, 50, 3, 14, ink ? "#26262C" : "#1C2238", INK, BLUE_GLOW);
  desk += `<rect x="1110" y="360" width="290" height="330" rx="8" fill="${INK}" stroke="${ink ? P : "#3A4570"}" stroke-width="4"/>`;
  desk += `<rect x="1130" y="380" width="250" height="290" rx="4" fill="${ink ? "#121218" : "#0A0F22"}" stroke="${BLUE}" stroke-width="2"/>`;
  desk +=
    fan(1200, 450, 52, mode, 0.2) + fan(1310, 450, 52, mode, 1.1) + fan(1255, 590, 58, mode, 2.2);
  desk += `<rect x="1140" y="520" width="230" height="14" fill="${BLUE}" filter="url(#glow)"/>`;
  desk += `<rect x="1000" y="640" width="52" height="50" rx="6" fill="${ink ? P : "#C9D3E8"}" stroke="${INK}" stroke-width="3"/><path d="M1052,652 q22,10 0,26" stroke="${INK}" stroke-width="4" fill="none"/>`;
  let fig = `<path d="M560,1000 L590,820 L800,820 L830,1000Z" fill="${ink ? "#0B0B0E" : "#090C16"}" stroke="${ink ? P : "#222B4A"}" stroke-width="3"/>`;
  fig += hoodieBack(690, 1000, 1.45, mode);
  let fx = "";
  const r2 = rng(41);
  for (let i = 0; i < 60; i++)
    fx += `<circle cx="${f(300 + r2() * 900)}" cy="${f(150 + r2() * 600)}" r="${f(1 + r2() * 2.2)}" fill="${BLUE_GLOW}" opacity="${f(0.3 + r2() * 0.6)}"/>`;
  fx += `<path d="M1400,700 C1480,820 1360,900 1520,1000" stroke="${INK}" stroke-width="10" fill="none"/>`;
  return {
    back: svg(W, H, defs, back),
    desk: svg(W, H, defs, desk),
    figure: svg(W, H, defs, fig),
    fx: svg(W, H, defs, fx),
  };
}

export function keysInset(mode: Mode) {
  const W = 800,
    H = 800;
  const ink = mode === "ink";
  let s = `<rect width="${W}" height="${H}" fill="${INK}"/>`;
  s += keyboard(-80, 300, W + 160, 560, 4, 9, ink ? "#202026" : "#1A2036", INK, BLUE_GLOW);
  s += `<rect width="${W}" height="${H}" fill="url(#topglow)"/>`;
  s += hand(300, 470, 2.4, 10, ink ? "#26262C" : "#7E563F", BLUE_GLOW, 6);
  s += hand(600, 520, 2.4, -20, ink ? "#26262C" : "#7E563F", BLUE_GLOW, 7);
  s += speedLines(420, 420, 380, 620, 30, 3, P, 3);
  const defs = `${commonDefs}<linearGradient id="topglow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BLUE}" stop-opacity="0.7"/><stop offset="0.7" stop-color="${BLUE}" stop-opacity="0"/></linearGradient>`;
  return { keys: svg(W, H, defs, s) };
}

export function gpuInset(mode: Mode) {
  const W = 800,
    H = 800;
  let s = `<rect width="${W}" height="${H}" fill="${INK}"/>`;
  s += `<g opacity="0.5">${hatch([0, 0, W, H], { angle: 30, gap: 10, width: 1.2, seed: 3, colour: "#2E2E36" })}</g>`;
  s += `<rect x="60" y="120" width="680" height="560" rx="24" fill="#16161C" stroke="${P}" stroke-width="4"/>`;
  s += fan(270, 400, 170, mode, 0.4) + fan(560, 400, 150, mode, 1.4);
  s += `<rect x="80" y="650" width="640" height="16" fill="${BLUE}" filter="url(#glow)"/>`;
  s += speedLines(400, 400, 340, 620, 24, 8, P, 3);
  return { gpu: svg(W, H, commonDefs, s) };
}

/* ---------------------------------------------------------------- Code Awakening monitor */

/** Screen hole (plate px) where the live code texture shows through. Mirrored in src/story/story.ts. */
export const MONITOR_SCREEN = { x: 250, y: 100, w: 1100, h: 620 };

export function monitor(mode: Mode) {
  const W = 1600,
    H = 1000;
  const ink = mode === "ink";
  const { x, y, w, h } = MONITOR_SCREEN;
  const defs = `${commonDefs}<mask id="hole"><rect width="${W}" height="${H}" fill="#fff"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#000"/></mask>`;
  let bezel = `<g mask="url(#hole)"><rect width="${W}" height="${H}" fill="${ink ? INK : "#0A0E20"}"/>`;
  if (ink)
    bezel += `<g opacity="0.45">${hatch([0, 0, W, H], { angle: 80, gap: 8, width: 1.2, seed: 5, colour: "#2A2A32" })}</g>`;
  bezel += `<rect x="${x - 40}" y="${y - 40}" width="${w + 80}" height="${h + 80}" rx="26" fill="#101014" stroke="${ink ? P : "#3A4570"}" stroke-width="5"/>`;
  bezel += `<rect x="${x - 40}" y="${y + h + 2}" width="${w + 80}" height="36" fill="#0C0C10"/>`;
  bezel += `<circle cx="${x + w / 2}" cy="${y + h + 22}" r="5" fill="${BLUE_GLOW}"/></g>`;
  bezel += `<path d="M720,800 L700,880 L900,880 L880,800Z" fill="#0C0C10" stroke="${ink ? P : "#3A4570"}" stroke-width="4"/>`;
  bezel += `<rect x="0" y="880" width="${W}" height="120" fill="${ink ? "#121216" : "#0D1226"}" stroke="${ink ? P : "#2C355A"}" stroke-width="4"/>`;
  let fg = keyboard(380, 900, 840, 140, 3, 16, ink ? "#202026" : "#1A2036", INK, BLUE_GLOW);
  fg +=
    hand(560, 940, 2.1, 12, ink ? "#202026" : "#8A5E45", BLUE_GLOW, 11) +
    hand(1040, 950, 2.1, -16, ink ? "#202026" : "#8A5E45", BLUE_GLOW, 12);
  return { bezel: svg(W, H, defs, bezel), hands: svg(W, H, defs, fg) };
}

/* ---------------------------------------------------------------- colour world */

/** The hero rising, full colour, a blue code-light aura around him. */
export function rise() {
  const W = 900,
    H = 1300;
  const defs = `${commonDefs}<linearGradient id="hood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A3C78"/><stop offset="1" stop-color="#121A36"/></linearGradient>`;
  let s = `<ellipse cx="450" cy="640" rx="300" ry="520" fill="${BLUE}" opacity="0.35" filter="url(#soft2)"/>`;
  const r = rng(17);
  for (let i = 0; i < 26; i++) {
    const x0 = 250 + r() * 400;
    const line: Pt[] = [];
    for (let k = 0; k <= 8; k++)
      line.push([x0 + Math.sin(k * 0.8 + i) * 30, 1250 - k * (120 + r() * 30)]);
    s += `<path d="${brush(line, 6 + r() * 10, i * 7)}" fill="${r() > 0.5 ? BLUE_GLOW : "#BFE0FF"}" opacity="${f(0.5 + r() * 0.5)}" filter="url(#glow)"/>`;
  }
  s += `<path d="M400,820 C380,960 360,1080 330,1200 L380,1210 C420,1100 440,980 450,860Z" fill="#1A2236" stroke="${INK}" stroke-width="5"/>`;
  s += `<path d="M500,820 C520,940 560,1050 600,1160 L550,1180 C510,1080 470,980 450,860Z" fill="#1A2236" stroke="${INK}" stroke-width="5"/>`;
  s += `<path d="M330,1200 L300,1236 L380,1236 L382,1208Z M600,1160 L620,1200 L560,1206 L550,1180Z" fill="#E9EEF8" stroke="${INK}" stroke-width="4"/>`;
  s += `<path d="M330,480 C300,600 310,760 360,860 C420,880 500,880 560,860 C610,760 610,600 580,480 C520,440 390,440 330,480Z" fill="url(#hood)" stroke="${INK}" stroke-width="6"/>`;
  s += `<path d="M360,860 C320,920 300,960 280,1000 C360,960 420,930 450,900 C490,930 560,960 640,990 C610,950 590,910 560,860Z" fill="#22326A" stroke="${INK}" stroke-width="5"/>`;
  s += `<path d="M340,500 C260,470 200,400 170,320 L210,300 C250,380 300,430 360,450Z" fill="url(#hood)" stroke="${INK}" stroke-width="6"/>`;
  s += `<path d="M570,500 C650,470 710,400 740,320 L700,300 C660,380 610,430 550,450Z" fill="url(#hood)" stroke="${INK}" stroke-width="6"/>`;
  s += `<circle cx="185" cy="300" r="28" fill="#B47A57" stroke="${INK}" stroke-width="5"/><circle cx="725" cy="300" r="28" fill="#B47A57" stroke="${INK}" stroke-width="5"/>`;
  s += `<rect x="420" y="400" width="70" height="60" fill="#A86F4E" stroke="${INK}" stroke-width="5"/>`;
  s += `<ellipse cx="455" cy="350" rx="70" ry="78" fill="#B47A57" stroke="${INK}" stroke-width="6"/>`;
  s += `<path d="M385,340 C380,270 430,250 470,256 C530,262 540,310 528,340 C510,316 470,300 430,300 C410,310 395,330 385,340Z" fill="#0C0B12" stroke="${INK}" stroke-width="5"/>`;
  s += `<path d="M420,330 q14,-8 28,0 M470,328 q14,-8 28,0" stroke="${INK}" stroke-width="5" fill="none"/>`;
  s += `<path d="M430,470 Q455,540 480,470" stroke="${INK}" stroke-width="3" fill="none"/><rect x="442" y="528" width="28" height="26" rx="5" fill="${BLUE}" stroke="${BLUE_GLOW}" stroke-width="3" filter="url(#glow)"/>`;
  s += `<path d="${brush(
    [
      [585, 490],
      [604, 640],
      [570, 850],
    ],
    10,
    3,
  )}" fill="${BLUE_GLOW}" filter="url(#glow)"/>`;
  s += `<path d="${brush(
    [
      [330, 490],
      [312, 640],
      [356, 850],
    ],
    8,
    4,
  )}" fill="${BLUE_GLOW}" filter="url(#glow)"/>`;
  for (let i = 0; i < 80; i++)
    s += `<rect x="${f(150 + r() * 600)}" y="${f(80 + r() * 1200)}" width="${f(3 + r() * 6)}" height="${f(3 + r() * 6)}" fill="${r() > 0.3 ? BLUE_GLOW : "#FFFFFF"}" opacity="${f(0.4 + r() * 0.6)}"/>`;
  return { hero: svg(W, H, defs, s) };
}

/** Dawn sky after the awakening (colour). */
export function dawn() {
  const W = 1600,
    H = 1000;
  const defs = `${commonDefs}<linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1E6B"/><stop offset="0.45" stop-color="#2F5BE0"/><stop offset="0.8" stop-color="#8FA8FF"/><stop offset="1" stop-color="#FFC2A0"/></linearGradient>`;
  let s = `<rect width="${W}" height="${H}" fill="url(#dsky)"/>`;
  s += stars([0, 0, W, 300], 120, 3, "#FFFFFF", 0.05);
  s += `<circle cx="800" cy="1040" r="320" fill="#FFE2B8" opacity="0.8" filter="url(#soft2)"/>`;
  for (const [x, y, w, sd] of [
    [220, 640, 640, 41],
    [1200, 560, 700, 43],
    [760, 860, 900, 45],
    [1500, 900, 600, 47],
    [100, 940, 700, 49],
  ])
    s += cloud(x, y, w, sd, "#FFFFFF", "#0E1A4A", 1.1);
  return { sky: svg(W, H, defs, s) };
}

/** Night landscape with a stone slab for the three paths (colour). */
export function altar() {
  const W = 1600,
    H = 1000;
  const defs = `${commonDefs}<linearGradient id="asky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060A26"/><stop offset="0.7" stop-color="#1C2A7A"/><stop offset="1" stop-color="#4E5DB8"/></linearGradient>
  <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E6488"/><stop offset="1" stop-color="#22264A"/></linearGradient>`;
  let sky =
    `<rect width="${W}" height="${H}" fill="url(#asky)"/>` +
    stars([0, 0, W, 520], 260, 5, "#E6ECFF", 0.06);
  sky += `<path d="M0,620 L180,470 L320,560 L520,380 L700,540 L880,430 L1060,560 L1240,400 L1420,520 L1600,450 L1600,1000 L0,1000Z" fill="#141B4E" stroke="#0A0E2C" stroke-width="3"/>`;
  sky += `<path d="M0,700 L260,600 L460,680 L700,590 L960,690 L1200,610 L1600,700 L1600,1000 L0,1000Z" fill="#0D1238"/>`;
  sky += `<rect y="640" width="${W}" height="160" fill="#8EA2FF" opacity="0.25" filter="url(#soft2)"/>`;
  let slab = `<path d="M260,760 L1340,760 L1500,900 L100,900Z" fill="url(#stone)" stroke="${INK}" stroke-width="5"/>`;
  slab += `<path d="M100,900 L1500,900 L1500,960 L100,960Z" fill="#1A1E3A" stroke="${INK}" stroke-width="5"/>`;
  slab += `<clipPath id="sl"><path d="M260,760 L1340,760 L1500,900 L100,900Z"/></clipPath><g clip-path="url(#sl)" opacity="0.5">${hatch([100, 760, 1400, 140], { angle: 4, gap: 9, width: 1.4, seed: 9, colour: INK })}</g>`;
  for (const cx of [480, 800, 1120])
    slab += `<ellipse cx="${cx}" cy="820" rx="120" ry="26" fill="#9FB6FF" opacity="0.45" filter="url(#soft)"/><ellipse cx="${cx}" cy="820" rx="80" ry="16" fill="none" stroke="#BFD0FF" stroke-width="3" opacity="0.7"/>`;
  return { sky: svg(W, H, defs, sky), slab: svg(W, H, defs, slab) };
}

/** The ML chapter: hero from behind on a ledge, facing a sky of glowing curves (colour). */
export function mlSky() {
  const W = 1600,
    H = 1000;
  const defs = `${commonDefs}<linearGradient id="msk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030620"/><stop offset="1" stop-color="#14247A"/></linearGradient>`;
  let s =
    `<rect width="${W}" height="${H}" fill="url(#msk)"/>` +
    stars([0, 0, W, 700], 260, 15, "#DDE6FF", 0.05);
  for (let i = 0; i <= 10; i++)
    s += `<path d="M${200 + i * 120},120 V720 M200,${120 + i * 60} H1400" stroke="#3E66FF" stroke-width="1" opacity="0.25"/>`;
  const roc: Pt[] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    roc.push([200 + t * 1200, 720 - (1 - Math.pow(1 - t, 3.2)) * 600]);
  }
  s += `<path d="M200,720 L1400,120" stroke="#9DB7FF" stroke-width="3" stroke-dasharray="10 12" opacity="0.6"/>`;
  s += `<path d="${smoothPath(roc)}" stroke="${BLUE_GLOW}" stroke-width="12" fill="none" filter="url(#glow2)" opacity="0.9"/>`;
  s += `<path d="${smoothPath(roc)}" stroke="#FFFFFF" stroke-width="4" fill="none"/>`;
  const loss: Pt[] = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    loss.push([
      200 + t * 1200,
      200 + (1 - Math.exp(-t * 4)) * 380 + Math.sin(t * 40) * 14 * (1 - t),
    ]);
  }
  s += `<path d="${smoothPath(loss)}" stroke="#FFB020" stroke-width="6" fill="none" filter="url(#glow)" opacity="0.85"/>`;
  const r = rng(4);
  for (let i = 0; i < 140; i++)
    s += `<rect x="${f(r() * W)}" y="${f(r() * 760)}" width="${f(2 + r() * 4)}" height="${f(12 + r() * 40)}" fill="${r() > 0.2 ? BLUE_GLOW : "#FFB020"}" opacity="${f(0.2 + r() * 0.6)}"/>`;
  let fg = `<path d="M0,820 C300,790 600,800 900,830 L1600,860 L1600,1000 L0,1000Z" fill="#05081C" stroke="#2A3A8E" stroke-width="3"/>`;
  fg += `<g transform="translate(560 880) scale(0.7)">${hoodieBack(0, 0, 1, "colour", BLUE_GLOW)}</g>`;
  return { sky: svg(W, H, defs, s), ledge: svg(W, H, defs, fg) };
}

/** A monitor bezel with a transparent screen (project screenshots show through it). */
export const FRAME_SCREEN = { x: 70, y: 60, w: 1060, h: 600 };
export function frame(mode: Mode) {
  const W = 1200,
    H = 820;
  const { x, y, w, h } = FRAME_SCREEN;
  const ink = mode === "ink";
  const defs = `${commonDefs}<mask id="fh"><rect width="${W}" height="${H}" fill="#fff"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#000"/></mask>`;
  let s = `<g mask="url(#fh)"><rect x="20" y="14" width="${W - 40}" height="${h + 96}" rx="28" fill="${ink ? INK : "#0C1024"}" stroke="${ink ? P : "#46538A"}" stroke-width="6"/>`;
  s += `<rect x="30" y="24" width="${W - 60}" height="10" rx="5" fill="#FFFFFF" opacity="0.08"/></g>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="none" stroke="${BLUE}" stroke-width="3"/>`;
  s += `<circle cx="${W / 2}" cy="${y + h + 22}" r="6" fill="${BLUE_GLOW}"/>`;
  s += `<path d="M520,${y + h + 50} L500,${H - 20} L700,${H - 20} L680,${y + h + 50}Z" fill="${ink ? INK : "#0C1024"}" stroke="${ink ? P : "#46538A"}" stroke-width="5"/>`;
  return { bezel: svg(W, H, defs, s) };
}
