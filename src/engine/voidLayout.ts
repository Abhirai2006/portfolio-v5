import { PROJECTS } from "@/lib/projects";

/** Where each project floats in the void (beat-local coords). Shared with the label anchors. */
export function voidLayout() {
  return PROJECTS.map((p, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const up = i % 4 < 2 ? 1 : -1;
    return { slug: p.slug, title: p.title, x: side * 3.9, y: -7 + up * 1.25, z: -2 - i * 5.4 };
  });
}
