import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { homeJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";
import portrait from "@/assets/abhishek-portrait.jpg.asset.json";
import ogCover from "@/assets/og-cover.jpg.asset.json";
import { Hud } from "@/hud/Hud";
import { BoardSection } from "@/sections/BoardSection";
import { Chapters } from "@/sections/Chapters";
import { MapSection } from "@/sections/MapSection";
import { NameShot } from "@/sections/NameShot";
import { Welcome } from "@/sections/Welcome";
import { Stage } from "@/world/Stage";

/*
 * "Abhishek's World" (docs/DESIGN.md). Every word below is server-rendered HTML (crawlable, works without JS);
 * the WebGL world, loader and cinematics are added on the client by <Stage />.
 */

const TITLE = "Abhishek Rai A · Aspiring ML Engineer, Mysuru";
const DESCRIPTION =
  "Abhishek Rai A is an aspiring machine learning engineer in Mysuru (B.E. AI & ML, GPA 9.44) looking for ML internships. Projects, live ML demo and contact.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "profile" },
      { property: "og:url", content: `${SITE}/` },
      { property: "og:image", content: `${SITE}${ogCover.url}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${SITE}${ogCover.url}` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/` }],
    scripts: homeJsonLd(SITE, portrait.url).map((block) => ({
      type: "application/ld+json",
      children: JSON.stringify(block),
    })),
  }),
  component: Home,
});

/** The world (canvas, loader, cinematics) only exists in the browser. */
function ClientStage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <Stage /> : null;
}

function Home() {
  return (
    <>
      <Hud />
      <main id="main" className="relative">
        <Welcome />
        <NameShot />
        <BoardSection />
        <MapSection />
        <Chapters />
      </main>
      <ClientStage />
    </>
  );
}
