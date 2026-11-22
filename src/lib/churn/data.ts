import type { Customer, TestRow, TestSetJson } from "./types";

/** Expand the compact test-set rows into customers. */
export function testRows(json: TestSetJson): TestRow[] {
  return json.rows.map(([values, y, p]) => {
    const x = {} as Record<string, string | number>;
    json.columns.forEach((c, i) => (x[c] = values[i]));
    return { x: x as Customer, y: y as 0 | 1, p };
  });
}
