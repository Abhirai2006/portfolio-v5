import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import {
  beatAt,
  cameraAt,
  cameraKeys,
  frameDistance,
  gateEvent,
  holdStep,
  layoutStory,
  neuronHits,
  parseCaption,
  pathOrder,
  pickTier,
  scrollLimit,
  totalLength,
  transitionAt,
  transitionWindows,
  windowOpacity,
} from "@/engine/core";
import { AWAKEN_CODE, BEATS, SKILLS, STAT_SHARDS } from "@/story/story";
import { ART } from "@/art/registry";
import { getProject } from "@/lib/projects";
import { PERSONAL_CONTEXT, RESUME_CONTEXT } from "@/lib/assistant-context";
import { PERSON, QUICK_FACTS } from "@/lib/facts";

describe("path order", () => {
  test("chosen path first, others keep their order", () => {
    expect(pathOrder(null)).toEqual(["ml", "product", "problem"]);
    expect(pathOrder("product")).toEqual(["product", "ml", "problem"]);
    expect(pathOrder("problem")).toEqual(["problem", "ml", "product"]);
  });

  test("layout puts the chosen path's chapter right after the choice", () => {
    const laid = layoutStory(BEATS, pathOrder("problem"));
    const ids = laid.map((b) => b.id);
    const choose = ids.indexOf("choose");
    expect(ids.slice(choose + 1, choose + 4)).toEqual(["path-problem", "path-ml", "path-product"]);
    expect(ids.length).toBe(BEATS.length);
  });
});

describe("scroll → beat", () => {
  const laid = layoutStory(BEATS);
  test("beats are contiguous in scroll and stack down in world space", () => {
    for (let i = 1; i < laid.length; i++) {
      expect(laid[i].start).toBeCloseTo(laid[i - 1].start + laid[i - 1].len);
      expect(laid[i].originY).toBeLessThan(laid[i - 1].originY);
    }
  });
  test("beatAt finds beat and local t, and clamps", () => {
    expect(beatAt(laid, -5)).toEqual({ index: 0, t: 0 });
    const b = laid[3];
    const r = beatAt(laid, b.start + b.len / 2);
    expect(r.index).toBe(3);
    expect(r.t).toBeCloseTo(0.5);
    expect(beatAt(laid, 1e9).index).toBe(laid.length - 1);
  });
});

describe("camera", () => {
  const laid = layoutStory(BEATS);
  const keys = cameraKeys(laid);
  test("keys are in increasing scroll order", () => {
    for (let i = 1; i < keys.length; i++) expect(keys[i].s).toBeGreaterThan(keys[i - 1].s);
  });
  test("camera is continuous except at hidden cuts", () => {
    const windows = transitionWindows(laid);
    const total = totalLength(laid);
    let prev = cameraAt(keys, 0);
    for (let s = 0.002; s < total; s += 0.002) {
      const c = cameraAt(keys, s);
      const nearCut = windows.some((w) => s >= w.s0 - 0.004 && s <= w.s0 + 0.004);
      if (!nearCut) {
        expect(Math.abs(c.y - prev.y)).toBeLessThan(0.8);
        expect(Math.abs(c.h - prev.h)).toBeLessThan(0.8);
      }
      prev = c;
    }
  });
  test("inside a transition the camera holds on the next beat", () => {
    const w = transitionWindows(laid)[0];
    const a = cameraAt(keys, w.s0 + (w.s1 - w.s0) * 0.3);
    const b = cameraAt(keys, w.s0 + (w.s1 - w.s0) * 0.9);
    expect(a.y).toBeCloseTo(b.y);
    expect(transitionAt(transitionWindows(laid), (w.s0 + w.s1) / 2)?.p).toBeCloseTo(0.5);
  });
  test("narrow screens frame more height", () => {
    expect(frameDistance(10, 0.46, 35)).toBeGreaterThan(frameDistance(10, 1.6, 35));
    expect(frameDistance(10, 1.6, 35)).toBeCloseTo(5 / Math.tan((35 * Math.PI) / 360));
  });
});

describe("gates and hold", () => {
  const laid = layoutStory(BEATS);
  test("scroll stops at the first unfinished gate", () => {
    const aw = laid.find((b) => b.gate?.kind === "awaken")!;
    expect(scrollLimit(laid, new Set())).toBeCloseTo(aw.start + aw.gate!.at * aw.len);
    const rise = laid.find((b) => b.gate?.kind === "rise")!;
    expect(scrollLimit(laid, new Set(["awaken"]))).toBeCloseTo(
      rise.start + rise.gate!.at * rise.len,
    );
    expect(scrollLimit(laid, new Set(["awaken", "rise", "choose", "enter"]))).toBeCloseTo(
      totalLength(laid),
    );
  });
  test("gate state machine", () => {
    expect(gateEvent("locked", "complete")).toBe("locked");
    expect(gateEvent("locked", "reach")).toBe("active");
    expect(gateEvent("active", "complete")).toBe("complete");
    expect(gateEvent("complete", "leave")).toBe("complete");
    expect(gateEvent("active", "leave")).toBe("locked");
    expect(gateEvent("locked", "skip")).toBe("skipped");
  });
  test("hold fills, drains faster, completes and stays complete", () => {
    let h = { p: 0, done: false };
    h = holdStep(h, 0.5, true, 1.2);
    expect(h.p).toBeCloseTo(0.5 / 1.2);
    h = holdStep(h, 0.1, false, 1.2);
    expect(h.p).toBeCloseTo(0.5 / 1.2 - 0.2 / 1.2);
    h = holdStep(h, 5, false, 1.2);
    expect(h.p).toBe(0);
    h = holdStep(h, 2, true, 1.2);
    expect(h).toEqual({ p: 1, done: true });
    expect(holdStep(h, 1, false, 1.2)).toEqual({ p: 1, done: true });
  });
});

describe("neurons", () => {
  const neurons = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 200, y: 0 },
    { x: 100, y: 100 },
  ];
  test("a stroke through neurons hits them in order, once each", () => {
    expect(
      neuronHits(
        [
          { x: -5, y: 0 },
          { x: 205, y: 0 },
          { x: 100, y: 105 },
          { x: 0, y: 0 },
        ],
        neurons,
        12,
      ),
    ).toEqual([0, 1, 2, 3]);
  });
  test("a fast flick still counts the neurons it crosses", () => {
    expect(
      neuronHits(
        [
          { x: 0, y: 0 },
          { x: 200, y: 0 },
        ],
        neurons,
        10,
      ),
    ).toEqual([0, 1, 2]);
  });
  test("missing by more than the radius doesn't count", () => {
    expect(
      neuronHits(
        [
          { x: 0, y: 40 },
          { x: 200, y: 40 },
        ],
        neurons,
        10,
      ),
    ).toEqual([]);
  });
});

describe("quality tier", () => {
  test("static without WebGL2 or with reduced motion; lite on phones; forced wins", () => {
    expect(pickTier({ webgl2: false, reducedMotion: false, mobile: false })).toBe("static");
    expect(pickTier({ webgl2: true, reducedMotion: true, mobile: false })).toBe("static");
    expect(pickTier({ webgl2: true, reducedMotion: false, mobile: true })).toBe("lite");
    expect(
      pickTier({ webgl2: true, reducedMotion: false, mobile: false, cores: 16, memory: 16 }),
    ).toBe("ultra");
    expect(pickTier({ webgl2: true, reducedMotion: false, mobile: false, cores: 4 })).toBe("high");
    expect(pickTier({ webgl2: true, reducedMotion: false, mobile: false, forced: "lite" })).toBe(
      "lite",
    );
  });
});

describe("captions", () => {
  test("keywords parse", () => {
    expect(parseCaption("**10 PM.** The city")).toEqual([
      { text: "10 PM.", key: true },
      { text: " The city", key: false },
    ]);
  });
  test("window opacity fades at the edges", () => {
    expect(windowOpacity(0.5, [0.2, 0.8])).toBe(1);
    expect(windowOpacity(0.0, [0.2, 0.8])).toBe(0);
    expect(windowOpacity(0.175, [0.2, 0.8])).toBeCloseTo(0.5);
  });
});

describe("the story is honest (CONTENT.md §1)", () => {
  const sources = [
    RESUME_CONTEXT,
    PERSONAL_CONTEXT,
    QUICK_FACTS.join(" "),
    JSON.stringify(PERSON),
    readFileSync("src/lib/projects.ts", "utf8"),
  ].join(" ");
  const allText = [
    ...BEATS.flatMap((b) => [
      ...b.captions.map((c) => c.text),
      b.summary ?? "",
      ...b.panels.map((p) => p.alt),
    ]),
    ...STAT_SHARDS.map((s) => `${s.value} ${s.label}`),
    ...AWAKEN_CODE,
  ].join(" ");

  test("every number in the comic appears in a source of truth", () => {
    const numbers = allText.match(/\d[\d,.]*%?\+?/g) ?? [];
    for (const n of numbers) {
      const bare = n.replace(/[.,]$/, "").replace("+", "");
      // "Vol. 01", "[:, 1]" in the Python line, "10 PM to 6 AM" (night owl, ~10pm to 6am)
      if (["01", "1", "6", "10"].includes(bare)) continue;
      expect(sources).toContain(bare);
    }
  });

  test("no salary or package figure anywhere", () => {
    for (const banned of ["lpa", "ctc", "lakh", "salary", "per annum", "package"])
      expect(allText.toLowerCase()).not.toContain(banned);
  });

  test("project labels point at real projects", () => {
    for (const c of BEATS.flatMap((b) => b.captions)) {
      if (c.text.startsWith("project:")) expect(getProject(c.text.slice(8))).toBeTruthy();
    }
  });

  test("skills match CONTENT.md §4 tiers", () => {
    expect(SKILLS.map((s) => s.tier)).toEqual(["S", "A", "B"]);
    expect(SKILLS[0].items).toContain("Python");
    expect(SKILLS[2].items).toContain("PyTorch");
  });

  test("no chess anywhere in the story", () => {
    expect(allText.toLowerCase()).not.toContain("chess");
  });
});

describe("art", () => {
  test("every layer the story uses exists as a built WebP", () => {
    for (const b of BEATS)
      for (const p of b.panels)
        for (const l of p.layers) {
          if (l.art.startsWith("$")) {
            if (l.art.startsWith("$shot:"))
              expect(existsSync(`public${l.art.slice(6)}`)).toBe(true);
            continue;
          }
          const def = ART[l.art];
          expect(def).toBeTruthy();
          expect(def.layers).toContain(l.layer!);
          for (const m of def.modes)
            expect(existsSync(`public/art/${l.art}/${l.layer}-${m}.webp`)).toBe(true);
        }
  });
  test("every still exists for the no-JS webtoon", () => {
    for (const b of BEATS)
      for (const p of b.panels)
        if (p.still && !p.still.startsWith("/"))
          expect(existsSync(`public/art/static/${p.still}.webp`)).toBe(true);
  });
});
