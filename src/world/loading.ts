/**
 * Real loading progress for the Ignition loader (PRD F1: never a fake timer).
 * Bytes come from streamed fetches of the world's assets; later stages are marked by the code that does them.
 */
export const STAGES = ["DOWNLOADING", "COMPILING SHADERS", "BUILDING BOARD", "READY"] as const;
export type Stage = (typeof STAGES)[number];

export type Snapshot = { bytes: number; fraction: number; stage: Stage };
export type Tracker = {
  add(bytes: number): void;
  markStage(s: Stage): void;
  snapshot(): Snapshot;
  subscribe(fn: (s: Snapshot) => void): () => void;
};

/** Downloads count for 80% of the bar; each later stage adds 10%; READY is 100%. */
export function createTracker(totalHint: number): Tracker {
  let bytes = 0;
  let stageIndex = 0;
  const subs = new Set<(s: Snapshot) => void>();
  const snapshot = (): Snapshot => {
    const stage = STAGES[stageIndex];
    if (stage === "READY") return { bytes, fraction: 1, stage };
    const dl = totalHint > 0 ? Math.min(bytes / totalHint, 1) : 0;
    const fraction = Math.min(
      0.8 * dl + 0.1 * Math.max(0, stageIndex - 1) + (stageIndex >= 1 ? 0.05 : 0),
      0.99,
    );
    return { bytes, fraction, stage };
  };
  const emit = () => {
    const s = snapshot();
    subs.forEach((fn) => fn(s));
  };
  return {
    add(n) {
      bytes += n;
      emit();
    },
    markStage(s) {
      const i = STAGES.indexOf(s);
      if (i > stageIndex) {
        stageIndex = i;
        emit();
      }
    },
    snapshot,
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

type Fetcher = (url: string) => Promise<Response>;

/** Fetches a URL, streaming the body so every chunk is counted, with or without Content-Length. */
export async function trackFetch(
  url: string,
  t: Tracker,
  fetcher: Fetcher = (u) => fetch(u),
): Promise<ArrayBuffer> {
  const res = await fetcher(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  if (!res.body) {
    const buf = await res.arrayBuffer();
    t.add(buf.byteLength);
    return buf;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
    t.add(value.byteLength);
  }
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.byteLength;
  }
  return out.buffer;
}

export function formatBytes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(n / 1024)} KB`;
}
