/**
 * Contributions as an isometric ink city (DESIGN §4.7, after Xian's data story): one block per day of the
 * last year, height by activity level. Live from the public contributions API; a screen-reader summary
 * carries the same information.
 */
import { useQuery } from "@tanstack/react-query";

type Contribution = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
type ApiResp = { total: Record<string, number>; contributions: Contribution[] };

async function fetchContribs(): Promise<ApiResp> {
  const res = await fetch("https://github-contributions-api.jogruber.de/v4/Abhirai2006?y=last");
  if (!res.ok) throw new Error("contrib fetch failed");
  return res.json();
}

const CELL = 9; // half-width of a block's top diamond
const HEIGHTS = [0, 6, 12, 20, 30];

export function ContributionHeatmap() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["gh-contribs"],
    queryFn: fetchContribs,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  if (isLoading)
    return <div className="panel p-5 font-hud text-[11px] text-grey-4">loading the city…</div>;
  if (error || !data)
    return (
      <div className="panel p-5 font-hud text-[11px] text-grey-4">
        couldn&apos;t load the contribution city.
      </div>
    );

  const c = data.contributions;
  const first = new Date(c[0].date);
  const pad = first.getDay();
  const cells: (Contribution | null)[] = Array(pad).fill(null).concat(c);
  const weeks: (Contribution | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const total = c.reduce((a, x) => a + x.count, 0);
  const busiest = c.reduce((a, x) => (x.count > a.count ? x : a), c[0]);

  // isometric projection: week → x axis, weekday → y axis
  const iso = (w: number, d: number) => [(w - d) * CELL + 7 * CELL, (w + d) * CELL * 0.5];
  const width = (weeks.length + 7) * CELL + 20;
  const height = (weeks.length + 7) * CELL * 0.5 + 40;
  const blocks: { x: number; y: number; h: number; level: number; key: string; title: string }[] =
    [];
  weeks.forEach((wk, w) =>
    wk.forEach((cell, d) => {
      if (!cell) return;
      const [x, y] = iso(w, d);
      blocks.push({
        x,
        y: y + 34,
        h: HEIGHTS[cell.level],
        level: cell.level,
        key: cell.date,
        title: `${cell.date} · ${cell.count} commits`,
      });
    }),
  );

  return (
    <div className="panel p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-hud text-[11px] text-grey-4">Contributions · last year</h3>
        <span className="font-hud text-[11px] text-paper">{total} commits</span>
      </div>
      <p className="sr-only">
        {total} contributions in the last year; the busiest day was {busiest.date} with{" "}
        {busiest.count}.
      </p>
      <div className="mt-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[640px]"
          role="img"
          aria-label={`Isometric ink city of ${total} GitHub contributions over the last year`}
        >
          <defs>
            <pattern id="gh-tone" width="4" height="4" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.8" fill="#f2eee6" />
            </pattern>
          </defs>
          {blocks.map((b) => (
            <g key={b.key}>
              <title>{b.title}</title>
              {b.h > 0 && (
                <>
                  {/* left face: screentone shade; right face: ink */}
                  <path
                    d={`M${b.x - CELL} ${b.y} L${b.x} ${b.y + CELL / 2} L${b.x} ${b.y + CELL / 2 - b.h} L${b.x - CELL} ${b.y - b.h} Z`}
                    fill="url(#gh-tone)"
                    stroke="#f2eee6"
                    strokeWidth="0.5"
                  />
                  <path
                    d={`M${b.x + CELL} ${b.y} L${b.x} ${b.y + CELL / 2} L${b.x} ${b.y + CELL / 2 - b.h} L${b.x + CELL} ${b.y - b.h} Z`}
                    fill="#0b0b0c"
                    stroke="#f2eee6"
                    strokeWidth="0.5"
                  />
                </>
              )}
              <path
                d={`M${b.x} ${b.y - CELL / 2 - b.h} L${b.x + CELL} ${b.y - b.h} L${b.x} ${b.y + CELL / 2 - b.h} L${b.x - CELL} ${b.y - b.h} Z`}
                fill={b.level === 4 ? "#9cc2ff" : b.level > 0 ? "#f2eee6" : "#1a1a1c"}
                stroke={b.level > 0 ? "#0b0b0c" : "#3a3a3e"}
                strokeWidth="0.6"
              />
            </g>
          ))}
        </svg>
      </div>
      <p className="mt-2 font-hud text-[10px] text-grey-3">
        one block per day · taller = busier · blue = his busiest days
      </p>
    </div>
  );
}
