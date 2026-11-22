import { createFileRoute } from "@tanstack/react-router";
import { PROJECTS } from "@/lib/projects";
import { SITE } from "@/lib/site";

// Built from PROJECTS so a new case study is listed as soon as it is added.
const PAGES: { path: string; priority: string }[] = [
  { path: "/", priority: "1.0" },
  { path: "/resume", priority: "0.9" },
  { path: "/anime", priority: "0.7" },
  { path: "/reviews", priority: "0.6" },
  { path: "/llms.txt", priority: "0.5" },
  ...PROJECTS.map((p, i) => ({ path: `/projects/${p.slug}`, priority: i === 0 ? "0.9" : "0.8" })),
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const urls = PAGES.map(
          (p) =>
            `  <url>\n    <loc>${SITE}${p.path}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
        ).join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
