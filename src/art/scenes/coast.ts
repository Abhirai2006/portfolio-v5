import {
  BLUE,
  BLUE_GLOW,
  INK,
  PAPER,
  brush,
  f,
  hatch,
  pick,
  rng,
  roughFilter,
  smoothPath,
  stars,
  stipple,
  svg,
  waveLines,
  type Mode,
  type Pt,
} from "../ink";

export const W = 1600;
export const H = 1000;

/** A coconut palm: curved trunk with ring marks and a crown of feathered fronds. */
export function palm(
  x: number,
  y: number,
  height: number,
  lean: number,
  seed: number,
  colour: string,
  light: string,
  rim?: string,
) {
  const r = rng(seed);
  const top: Pt = [x + lean, y - height];
  const trunk: Pt[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    trunk.push([x + lean * (t * t) + Math.sin(t * 3 + seed) * 6, y - height * t]);
  }
  const tw = Math.max(14, height * 0.05);
  let out = `<path d="${brush(trunk, tw, seed, { taper: 0.06, jitter: 0.05 })}" fill="${colour}"/>`;
  for (let i = 1; i < 12; i++) {
    const [px, py] = trunk[i];
    out += `<path d="M${f(px - tw * 0.35)},${f(py)}Q${f(px)},${f(py + 4)} ${f(px + tw * 0.35)},${f(py - 1)}" stroke="${light}" stroke-width="1.4" fill="none" opacity="0.6"/>`;
  }
  const fronds = 9;
  for (let k = 0; k < fronds; k++) {
    const a = -Math.PI / 2 + (k / (fronds - 1) - 0.5) * Math.PI * 1.55 + (r() - 0.5) * 0.25;
    const len = height * (0.32 + r() * 0.16);
    const line: Pt[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const droop = t * t * len * 0.55;
      line.push([top[0] + Math.cos(a) * len * t, top[1] + Math.sin(a) * len * t + droop]);
    }
    out += `<path d="${brush(line, tw * 0.3, seed + k * 13, { taper: 0.2 })}" fill="${colour}"/>`;
    for (let i = 2; i < 10; i++) {
      const [px, py] = line[i];
      const t = i / 10;
      for (const side of [-1, 1]) {
        const la = a + side * (1.1 + r() * 0.25) + t * 0.5;
        const ll = len * 0.22 * (1 - t * 0.5);
        out += `<path d="${brush(
          [
            [px, py],
            [px + Math.cos(la) * ll * 0.5, py + Math.sin(la) * ll * 0.5 + ll * 0.25],
            [px + Math.cos(la) * ll, py + Math.sin(la) * ll + ll * 0.55],
          ],
          tw * 0.2,
          seed * 7 + i * 3 + (side > 0 ? 1 : 0) + k * 101,
        )}" fill="${colour}"/>`;
      }
    }
  }
  const cr = tw * 0.35;
  out += `<g fill="${colour}"><circle cx="${f(top[0] - cr)}" cy="${f(top[1] + cr)}" r="${f(cr)}"/><circle cx="${f(top[0] + cr)}" cy="${f(top[1] + cr * 1.3)}" r="${f(cr * 0.9)}"/><circle cx="${f(top[0])}" cy="${f(top[1] + cr * 2)}" r="${f(cr * 0.9)}"/></g>`;
  return rim
    ? `<g stroke="${rim}" stroke-width="${f(Math.max(2, tw * 0.12))}" paint-order="stroke" stroke-linejoin="round">${out}</g>`
    : out;
}

/** Mangalore-tile house: low walls, steep tiled roof with tile rows, a window. */
export function house(
  x: number,
  y: number,
  w: number,
  h: number,
  mode: Mode,
  seed: number,
  lit = true,
) {
  const r = rng(seed);
  const wall = pick(mode, "#F2EFE8", "#2A2440");
  const roof = pick(mode, INK, "#6B2A22");
  const line = pick(mode, INK, "#120E1C");
  const roofH = h * 0.55;
  const over = w * 0.08;
  const wallTop = y - h + roofH;
  let out = `<rect x="${f(x)}" y="${f(wallTop)}" width="${f(w)}" height="${f(h - roofH)}" fill="${wall}" stroke="${line}" stroke-width="3"/>`;
  if (mode === "ink")
    out += `<clipPath id="hw${seed}"><rect x="${f(x)}" y="${f(wallTop)}" width="${f(w)}" height="${f(h - roofH)}"/></clipPath><g clip-path="url(#hw${seed})">${hatch([x, wallTop, w, h - roofH], { angle: 80, gap: 6, width: 1, seed, opacity: 0.55 })}</g>`;
  const roofPts: Pt[] = [
    [x - over, wallTop],
    [x + w * 0.22, y - h],
    [x + w * 0.78, y - h],
    [x + w + over, wallTop],
  ];
  out += `<path d="M${roofPts.map(([a, b]) => `${f(a)},${f(b)}`).join("L")}Z" fill="${roof}" stroke="${line}" stroke-width="3"/>`;
  const rows = 6;
  for (let i = 1; i < rows; i++) {
    const t = i / rows;
    const yy = y - h + roofH * t;
    const xl = x + w * 0.22 - (w * 0.22 + over) * t;
    const xr = x + w * 0.78 + (w * 0.22 + over) * t;
    let d = "";
    for (let xx = xl; xx < xr - 6; xx += 14) d += `M${f(xx)},${f(yy)}q7,6 14,0`;
    out += `<path d="${d}" stroke="${pick(mode, "#F2EFE8", "#A2483A")}" stroke-width="1.6" fill="none" opacity="0.8"/>`;
  }
  if (lit) {
    const wx = x + w * (0.3 + r() * 0.3);
    const wy = wallTop + (h - roofH) * 0.25;
    const ww = w * 0.18;
    const wh = (h - roofH) * 0.42;
    if (mode === "colour")
      out += `<rect x="${f(wx - 30)}" y="${f(wy - 30)}" width="${f(ww + 60)}" height="${f(wh + 60)}" fill="#FFB050" opacity="0.35" filter="url(#soft)"/>`;
    out += `<rect x="${f(wx)}" y="${f(wy)}" width="${f(ww)}" height="${f(wh)}" fill="${pick(mode, "#F2EFE8", "#FFC870")}" stroke="${line}" stroke-width="2.5"/>`;
    out += `<path d="M${f(wx + ww / 2)},${f(wy)}V${f(wy + wh)}M${f(wx)},${f(wy + wh / 2)}H${f(wx + ww)}" stroke="${line}" stroke-width="2"/>`;
  }
  return out;
}

/** Child figure walking, three-quarter back view. */
export function boy(cx: number, base: number, scale: number, mode: Mode) {
  const s = (n: number) => n * scale;
  const skin = pick(mode, "#F2EFE8", "#B97A55");
  const shirt = pick(mode, INK, "#E9EEF8");
  const shorts = pick(mode, "#F2EFE8", "#24324F");
  const hair = INK;
  const X = (n: number) => f(cx + s(n));
  const Y = (n: number) => f(base - s(n));
  return `<g stroke="${INK}" stroke-width="${f(s(2.6))}" stroke-linejoin="round" stroke-linecap="round">
  <path d="M${X(-14)},${Y(0)}L${X(-11)},${Y(48)}L${X(1)},${Y(48)}L${X(-1)},${Y(2)}Z" fill="${skin}"/>
  <path d="M${X(10)},${Y(6)}L${X(4)},${Y(48)}L${X(16)},${Y(48)}L${X(24)},${Y(10)}Z" fill="${skin}"/>
  <path d="M${X(-17)},${Y(-1)}h${f(s(19))}v${f(s(-6))}h${f(s(-19))}Z" fill="${INK}"/>
  <path d="M${X(8)},${Y(4)}h${f(s(19))}v${f(s(-6))}h${f(s(-19))}Z" fill="${INK}"/>
  <path d="M${X(-15)},${Y(46)}L${X(21)},${Y(46)}L${X(23)},${Y(72)}L${X(-17)},${Y(72)}Z" fill="${shorts}"/>
  <path d="M${X(-19)},${Y(70)}C${X(-21)},${Y(100)} ${X(-19)},${Y(118)} ${X(-10)},${Y(124)}L${X(17)},${Y(126)}C${X(27)},${Y(118)} ${X(29)},${Y(96)} ${X(25)},${Y(70)}Z" fill="${shirt}"/>
  <path d="M${X(-17)},${Y(116)}C${X(-30)},${Y(100)} ${X(-33)},${Y(86)} ${X(-30)},${Y(74)}" fill="none" stroke-width="${f(s(7))}"/>
  <path d="M${X(23)},${Y(116)}C${X(36)},${Y(106)} ${X(40)},${Y(92)} ${X(38)},${Y(80)}" fill="none" stroke-width="${f(s(7))}"/>
  <ellipse cx="${X(4)}" cy="${Y(140)}" rx="${f(s(15))}" ry="${f(s(17))}" fill="${skin}"/>
  <path d="M${X(-13)},${Y(132)}C${X(-17)},${Y(160)} ${X(6)},${Y(170)} ${X(20)},${Y(154)}C${X(24)},${Y(146)} ${X(21)},${Y(132)} ${X(17)},${Y(126)}C${X(16)},${Y(136)} ${X(13)},${Y(132)} ${X(9)},${Y(128)}C${X(4)},${Y(134)} ${X(-6)},${Y(128)} ${X(-13)},${Y(132)}Z" fill="${hair}"/>
  </g>`;
}

export function cloud(
  cx: number,
  cy: number,
  w: number,
  seed: number,
  fill: string,
  stroke: string,
  puff = 1,
) {
  const r = rng(seed);
  const balls: [number, number, number][] = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const bx = cx + (t - 0.5) * w * 0.85;
    const hump = Math.sin(t * Math.PI);
    const rad = w * (0.08 + hump * 0.11 + r() * 0.05) * puff;
    balls.push([bx, cy - rad * 0.55 - hump * w * 0.05 * puff, rad]);
  }
  for (let i = 0; i < 4; i++)
    balls.push([
      cx + (r() - 0.5) * w * 0.4,
      cy - w * (0.14 + r() * 0.08) * puff,
      w * (0.1 + r() * 0.06) * puff,
    ]);
  const c = (sw: number, fl: string, st: string) =>
    balls
      .map(
        ([x, y, rr]) =>
          `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="${fl}" stroke="${st}" stroke-width="${sw}"/>`,
      )
      .join("");
  const base = `<rect x="${f(cx - w * 0.47)}" y="${f(cy - w * 0.05)}" width="${f(w * 0.94)}" height="${f(w * 0.06)}" rx="${f(w * 0.03)}" fill="${fill}" stroke="${stroke}" stroke-width="6"/>`;
  return `${c(6, stroke, stroke)}${base}${c(0, fill, "none")}<rect x="${f(cx - w * 0.46)}" y="${f(cy - w * 0.05 + 3)}" width="${f(w * 0.92)}" height="${f(w * 0.06 - 6)}" fill="${fill}"/>`;
}

export function coast(mode: Mode): Record<string, string> {
  const ink = mode === "ink";
  const defs = `${roughFilter("rough", 3, 0.035)}<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
  <linearGradient id="nsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070A22"/><stop offset="0.6" stop-color="#1A2366"/><stop offset="1" stop-color="#3B3F8E"/></linearGradient>
  <linearGradient id="nsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1C2C6E"/><stop offset="1" stop-color="#081436"/></linearGradient>`;

  const moonX = 1180;
  const moonY = 200;
  let sky = `<rect width="${W}" height="${H}" fill="${ink ? INK : "url(#nsky)"}"/>`;
  sky += stars([0, 0, W, 560], 260, 21, ink ? "#F2EFE8" : "#DCE6FF", 0.06);
  if (ink)
    sky += waveLines([0, 40, W, 480], 22, 5, {
      amp: 3,
      width: 2.2,
      colour: "#24242A",
      persp: false,
      len: [0.1, 0.4],
    });
  if (!ink)
    sky += `<circle cx="${moonX}" cy="${moonY}" r="190" fill="#9FB4FF" opacity="0.25" filter="url(#soft)"/>`;
  sky += `<circle cx="${moonX}" cy="${moonY}" r="92" fill="${ink ? "#F2EFE8" : "#F6F1DC"}" stroke="${INK}" stroke-width="3"/>`;
  sky += stipple(
    [moonX - 92, moonY - 92, 184, 184],
    900,
    31,
    [0.7, 1.9],
    ink ? INK : "#B9AE8C",
    (u, v) => {
      const d = Math.hypot(u - 0.5, v - 0.5);
      if (d > 0.48) return 0;
      return Math.min(1, 0.1 + Math.max(0, u - 0.35) * 1.8);
    },
  );
  for (const [x, y, rr] of [
    [moonX - 30, moonY - 20, 14],
    [moonX + 25, moonY + 30, 10],
    [moonX + 10, moonY - 45, 7],
  ])
    sky += `<circle cx="${x}" cy="${y}" r="${rr}" fill="none" stroke="${ink ? INK : "#A99E7E"}" stroke-width="2"/>`;
  const cf = ink ? "#F2EFE8" : "#8E97D6";
  sky += `<g filter="url(#rough)">${cloud(330, 380, 560, 3, cf, INK)}${cloud(930, 450, 420, 5, cf, INK, 0.8)}${cloud(1480, 360, 360, 8, cf, INK)}</g>`;
  if (ink) sky += stipple([60, 330, 1560, 130], 1400, 52, [0.7, 1.6], INK, (_u, v) => v * v);

  const seaTop = 560;
  let sea = `<rect y="${seaTop}" width="${W}" height="${H - seaTop}" fill="${ink ? "#F2EFE8" : "url(#nsea)"}"/>`;
  sea += waveLines([0, seaTop + 6, W, 300], 26, 17, {
    amp: 4,
    width: 2.6,
    colour: ink ? INK : "#5C78D8",
  });
  const mp = rng(99);
  for (let i = 0; i < 26; i++) {
    const y = seaTop + 10 + i * 10;
    const w = 30 + i * 5 + mp() * 30;
    sea += `<rect x="${f(moonX - w / 2 + (mp() - 0.5) * 30)}" y="${f(y)}" width="${f(w)}" height="${f(2.2 + i * 0.08)}" rx="1.5" fill="${ink ? BLUE : "#F7E7A6"}" opacity="${f(0.85 - i * 0.02)}"/>`;
  }
  sea += `<path d="M0,${seaTop}H${W}" stroke="${INK}" stroke-width="3"/>`;

  const shore: Pt[] = [
    [0, 780],
    [260, 770],
    [520, 790],
    [800, 805],
    [1080, 790],
    [1300, 760],
    [1600, 740],
  ];
  const shoreD = `${smoothPath(shore)} L1600,1000 L0,1000Z`;
  let land = `<path d="${shoreD}" fill="${ink ? "#F2EFE8" : "#3A3150"}" stroke="${INK}" stroke-width="3"/>`;
  land += `<clipPath id="sand"><path d="${shoreD}"/></clipPath>`;
  land += `<g clip-path="url(#sand)">${stipple([0, 740, W, 260], 2400, 41, [0.6, 1.6], ink ? INK : "#6C5E86", (_u, v) => 0.2 + v * 0.8)}${hatch([0, 860, W, 140], { angle: -8, gap: 9, width: 1.2, seed: 3, opacity: ink ? 0.7 : 0.35 })}</g>`;
  land += `<path d="${brush(
    shore.map(([x, y]) => [x, y - 4] as Pt),
    5,
    12,
    { taper: 0.05 },
  )}" fill="${ink ? INK : "#DCE4FF"}"/>`;
  land += house(1210, 760, 150, 130, mode, 2);
  land += house(1370, 748, 120, 110, mode, 3);
  land += house(1500, 742, 130, 120, mode, 4, false);
  land += palm(
    1300,
    765,
    290,
    -40,
    6,
    ink ? INK : "#0B1A16",
    ink ? "#F2EFE8" : "#1F3B33",
    ink ? "#F2EFE8" : undefined,
  );
  land += palm(
    1470,
    750,
    240,
    30,
    9,
    ink ? INK : "#0B1A16",
    ink ? "#F2EFE8" : "#1F3B33",
    ink ? "#F2EFE8" : undefined,
  );

  const pc = ink ? INK : "#050C0B";
  let palms = palm(
    90,
    1040,
    760,
    120,
    13,
    pc,
    ink ? "#3A3A40" : "#10201C",
    ink ? "#F2EFE8" : undefined,
  );
  palms += palm(
    1560,
    1060,
    640,
    -160,
    15,
    pc,
    ink ? "#3A3A40" : "#10201C",
    ink ? "#F2EFE8" : undefined,
  );
  palms += `<path d="M0,960 C200,930 360,950 520,990 L520,1000 L0,1000Z" fill="${pc}"/>`;

  let kid = "";
  for (let i = 0; i < 7; i++)
    kid += `<ellipse cx="${f(700 - i * 46)}" cy="${f(822 + i * 6 + (i % 2) * 8)}" rx="7" ry="3" fill="${ink ? INK : "#1C1630"}" opacity="0.6"/>`;
  if (!ink) kid += `<ellipse cx="770" cy="815" rx="60" ry="10" fill="#000" opacity="0.25"/>`;
  kid += boy(760, 810, 1.05, mode);

  const r = rng(77);
  let fx = "";
  for (let i = 0; i < 40; i++) {
    const x = r() * W;
    const y = 520 + r() * 300;
    fx += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1 + r() * 2.5)}" fill="${ink ? BLUE_GLOW : "#9CC8FF"}" opacity="${f(0.4 + r() * 0.5)}"/>`;
  }

  return {
    sky: svg(W, H, defs, sky),
    sea: svg(W, H, defs, sea),
    land: svg(W, H, defs, land),
    boy: svg(W, H, defs, kid),
    palms: svg(W, H, defs, palms),
    fx: svg(W, H, defs, fx),
  };
}
