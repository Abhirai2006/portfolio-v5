import { describe, expect, test } from "bun:test";
import { SFX_NAMES, readSoundPref } from "../src/hud/sound";

describe("readSoundPref", () => {
  test("nothing stored means off (sound is off by default)", () =>
    expect(readSoundPref(null)).toBe(false));
  test('"off" is off', () => expect(readSoundPref("off")).toBe(false));
  test('"on" is on', () => expect(readSoundPref("on")).toBe(true));
  test("anything else is off", () => expect(readSoundPref("ON ")).toBe(false));
});

test("every creature sound in docs/ASSETS.md §3 has a recipe", () => {
  for (const name of [
    "hoof",
    "flame",
    "neigh",
    "footfall",
    "crack",
    "trumpet",
    "thunder",
    "wing",
    "screech",
    "drum",
    "choir",
    "roar",
    "boom",
    "whoosh",
    "chime",
  ])
    expect(SFX_NAMES).toContain(name);
});
