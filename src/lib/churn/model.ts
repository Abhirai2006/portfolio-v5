import type { Column, Customer, ModelJson, Node, Split } from "./types";

const INTERNET_ADDONS: Column[] = [
  "OnlineSecurity",
  "OnlineBackup",
  "DeviceProtection",
  "TechSupport",
  "StreamingTV",
  "StreamingMovies",
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));

/** Keep a customer self-consistent: no add-ons without internet, no extra lines without phone, sane numbers. */
export function normalizeCustomer(c: Customer): Customer {
  const out: Customer = { ...c };
  if (out.PhoneService === "No") out.MultipleLines = "No phone service";
  else if (out.MultipleLines === "No phone service") out.MultipleLines = "No";
  if (out.InternetService === "No") {
    for (const k of INTERNET_ADDONS) (out as Record<Column, unknown>)[k] = "No internet service";
  } else {
    for (const k of INTERNET_ADDONS)
      if (out[k] === "No internet service") (out as Record<Column, unknown>)[k] = "No";
  }
  out.tenure = Math.round(clamp(out.tenure, 0, 72));
  out.MonthlyCharges = clamp(out.MonthlyCharges, 18, 120);
  out.TotalCharges = clamp(out.TotalCharges, 0, Number.MAX_SAFE_INTEGER);
  return out;
}

/** Same transform as the saved ColumnTransformer: StandardScaler numerics, then one-hot categoricals. */
export function encode(m: ModelJson, c: Customer): number[] {
  const x: number[] = [];
  for (const n of m.numeric) x.push((Number(c[n.name]) - n.mean) / n.scale);
  for (const cat of m.categorical) {
    const v = String(c[cat.name]);
    for (const k of cat.categories) x.push(v === k ? 1 : 0); // unknown value -> all zeros (handle_unknown="ignore")
  }
  return x;
}

const isLeaf = (n: Node): n is { v: number; c: number } => "v" in n;

function leafValue(n: Node, x: number[]): number {
  while (!isLeaf(n)) n = x[n.f] <= n.t ? n.l : n.r;
  return n.v;
}

export function predictRaw(m: ModelJson, c: Customer): number {
  const x = encode(m, c);
  let s = 0;
  for (const t of m.trees) s += leafValue(t, x);
  return s;
}

export function predictProba(m: ModelJson, c: Customer): number {
  return 1 / (1 + Math.exp(-predictRaw(m, c)));
}

/* ---------------- TreeSHAP (path-dependent), ported from shap's tree_shap.h ---------------- */

type PathEl = { d: number; z: number; o: number; w: number };

function extendPath(p: PathEl[], depth: number, z: number, o: number, d: number) {
  p[depth] = { d, z, o, w: depth === 0 ? 1 : 0 };
  for (let i = depth - 1; i >= 0; i--) {
    p[i + 1].w += (o * p[i].w * (i + 1)) / (depth + 1);
    p[i].w = (z * p[i].w * (depth - i)) / (depth + 1);
  }
}

function unwindPath(p: PathEl[], depth: number, idx: number) {
  const o = p[idx].o;
  const z = p[idx].z;
  let next = p[depth].w;
  for (let i = depth - 1; i >= 0; i--) {
    if (o !== 0) {
      const tmp = p[i].w;
      p[i].w = (next * (depth + 1)) / ((i + 1) * o);
      next = tmp - (p[i].w * z * (depth - i)) / (depth + 1);
    } else {
      p[i].w = (p[i].w * (depth + 1)) / (z * (depth - i));
    }
  }
  for (let i = idx; i < depth; i++) {
    p[i].d = p[i + 1].d;
    p[i].z = p[i + 1].z;
    p[i].o = p[i + 1].o;
  }
}

function unwoundPathSum(p: PathEl[], depth: number, idx: number): number {
  const o = p[idx].o;
  const z = p[idx].z;
  let next = p[depth].w;
  let total = 0;
  for (let i = depth - 1; i >= 0; i--) {
    if (o !== 0) {
      const tmp = (next * (depth + 1)) / ((i + 1) * o);
      total += tmp;
      next = p[i].w - (tmp * z * (depth - i)) / (depth + 1);
    } else {
      total += p[i].w / z / ((depth - i) / (depth + 1));
    }
  }
  return total;
}

function shapRecurse(
  node: Node,
  x: number[],
  phi: number[],
  parent: PathEl[],
  depth: number,
  z: number,
  o: number,
  d: number,
) {
  const p = parent.slice(0, depth).map((e) => ({ ...e }));
  extendPath(p, depth, z, o, d);
  if (isLeaf(node)) {
    for (let i = 1; i <= depth; i++) {
      const w = unwoundPathSum(p, depth, i);
      phi[p[i].d] += w * (p[i].o - p[i].z) * node.v;
    }
    return;
  }
  const s = node as Split;
  const goLeft = x[s.f] <= s.t;
  const hot = goLeft ? s.l : s.r;
  const cold = goLeft ? s.r : s.l;
  let iz = 1;
  let io = 1;
  let k = 0;
  for (; k <= depth; k++) if (p[k].d === s.f) break;
  if (k !== depth + 1) {
    iz = p[k].z;
    io = p[k].o;
    unwindPath(p, depth, k);
    depth -= 1;
  }
  shapRecurse(hot, x, phi, p, depth + 1, (hot.c / s.c) * iz, io, s.f);
  shapRecurse(cold, x, phi, p, depth + 1, (cold.c / s.c) * iz, 0, s.f);
}

function expectedValue(n: Node): number {
  if (isLeaf(n)) return n.v;
  return (n.l.c * expectedValue(n.l) + n.r.c * expectedValue(n.r)) / (n.l.c + n.r.c);
}

/** Which original column each encoded feature belongs to. */
function featureColumns(m: ModelJson): Column[] {
  const cols: Column[] = m.numeric.map((n) => n.name);
  for (const c of m.categorical) for (let i = 0; i < c.categories.length; i++) cols.push(c.name);
  return cols;
}

/**
 * SHAP explanation in log-odds: `base` (average model output) plus one contribution per original column.
 * base + sum(parts) equals predictRaw(m, c).
 */
export function explain(m: ModelJson, c: Customer): { base: number; parts: { column: Column; value: number }[] } {
  const x = encode(m, c);
  const phi = new Array<number>(x.length).fill(0);
  let base = 0;
  for (const t of m.trees) {
    shapRecurse(t, x, phi, [], 0, 1, 1, -1);
    base += expectedValue(t);
  }
  const byCol = new Map<Column, number>();
  featureColumns(m).forEach((col, i) => byCol.set(col, (byCol.get(col) ?? 0) + phi[i]));
  const parts = [...byCol.entries()]
    .map(([column, value]) => ({ column, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return { base, parts };
}
