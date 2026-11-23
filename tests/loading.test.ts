import { describe, expect, test } from "bun:test";
import { createTracker, formatBytes, trackFetch } from "../src/world/loading";

describe("tracker", () => {
  test("fraction never exceeds 1 even when bytes overshoot the hint", () => {
    const t = createTracker(1000);
    t.add(5000);
    expect(t.snapshot().fraction).toBeLessThanOrEqual(1);
  });
  test("stays below 1 until READY, then reaches exactly 1", () => {
    const t = createTracker(1000);
    t.add(1000);
    t.markStage("COMPILING SHADERS");
    t.markStage("BUILDING BOARD");
    expect(t.snapshot().fraction).toBeLessThan(1);
    t.markStage("READY");
    expect(t.snapshot().fraction).toBe(1);
  });
  test("half the bytes is 40% before later stages", () => {
    const t = createTracker(1000);
    t.add(500);
    expect(t.snapshot().fraction).toBeCloseTo(0.4, 5);
    expect(t.snapshot().stage).toBe("DOWNLOADING");
  });
  test("stages only move forward", () => {
    const t = createTracker(1000);
    t.markStage("BUILDING BOARD");
    t.markStage("COMPILING SHADERS");
    expect(t.snapshot().stage).toBe("BUILDING BOARD");
  });
  test("subscribers hear every change", () => {
    const t = createTracker(100);
    const seen: number[] = [];
    t.subscribe((s) => seen.push(s.bytes));
    t.add(10);
    t.add(20);
    expect(seen).toEqual([10, 30]);
  });
});

describe("formatBytes", () => {
  test("megabytes with one decimal", () => expect(formatBytes(2_400_000)).toBe("2.4 MB"));
  test("kilobytes as whole numbers", () => expect(formatBytes(524_288)).toBe("512 KB"));
  test("zero", () => expect(formatBytes(0)).toBe("0 KB"));
});

describe("trackFetch", () => {
  test("counts streamed bytes when the server sends no Content-Length", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new Uint8Array(300));
        c.enqueue(new Uint8Array(200));
        c.close();
      },
    });
    const fetcher = async () => new Response(body);
    const t = createTracker(1000);
    const buf = await trackFetch("/x.glb", t, fetcher);
    expect(buf.byteLength).toBe(500);
    expect(t.snapshot().bytes).toBe(500);
  });
  test("a failed request rejects and does not count bytes", async () => {
    const t = createTracker(1000);
    await expect(
      trackFetch("/missing", t, async () => new Response("no", { status: 404 })),
    ).rejects.toThrow();
    expect(t.snapshot().bytes).toBe(0);
  });
});
