import { createFileRoute } from "@tanstack/react-router";
import { homeJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";
import portrait from "@/assets/abhishek-portrait.jpg.asset.json";
import ogCover from "@/assets/og-cover.jpg.asset.json";
import { StaticWebtoon } from "@/components/comic/StaticWebtoon";
import { Experience } from "@/components/comic/Experience";
import { Finale, Footer } from "@/components/comic/Chrome";

const TITLE = "Abhishek Rai A · Aspiring ML Engineer, Mysuru · Abhishek's World";
const DESCRIPTION =
  "Abhishek Rai A is an aspiring machine learning engineer in Mysuru (B.E. AI & ML, GPA 9.44) looking for ML internships. His story as an interactive manhwa: projects, résumé and contact.";

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
    scripts: [
      // Before first paint: if the WebGL comic will run, hide the static webtoon now (no flash before hydration).
      {
        children:
          "try{var c=document.createElement('canvas');if(c.getContext('webgl2')&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!/tier=static/.test(location.search))document.documentElement.classList.add('stage-on')}catch(e){}",
      },
      ...homeJsonLd(SITE, portrait.url).map((block) => ({
        type: "application/ld+json",
        children: JSON.stringify(block),
      })),
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main id="story" className="home">
      <StaticWebtoon />
      <Experience />
      <Finale />
      <Footer />
    </main>
  );
}
