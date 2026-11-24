import { createFileRoute, Link } from "@tanstack/react-router";
import { PageNav, Footer } from "@/components/comic/Chrome";

import { SITE } from "@/lib/site";

export const Route = createFileRoute("/thank-you")({
  head: () => ({
    meta: [
      { title: "Thank You | Abhishek Rai A" },
      {
        name: "description",
        content:
          "A personal thank-you from Abhishek Rai A for taking the time to visit and share feedback.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Thank You | Abhishek Rai A" },
      {
        property: "og:description",
        content: "Thanks for taking the time to visit Abhishek Rai A's portfolio.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/thank-you` },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `${SITE}/thank-you` }],
  }),
  component: ThankYouPage,
});

function ThankYouPage() {
  return (
    <div className="page">
      <PageNav />
      <main
        className="page-wrap"
        style={{ minHeight: "72vh", display: "grid", placeContent: "center", textAlign: "center" }}
      >
        <p className="page-kicker">Message received</p>
        <h1 className="page-title">Thank you</h1>
        <p className="page-lede" style={{ margin: "0 auto 24px" }}>
          I really appreciate you taking a moment to look around, share a thought, or leave a little
          kindness behind. It means more than a metric ever could.
        </p>
        <div className="case-actions" style={{ justifyContent: "center" }}>
          <Link to="/" className="btn-ink primary">
            Back to the story
          </Link>
          <Link to="/reviews" className="btn-ink">
            Read the review wall
          </Link>
        </div>
        <p style={{ font: "italic 400 34px var(--swash)", color: "var(--blue-deep)" }}>Abhishek</p>
      </main>
      <Footer />
    </div>
  );
}
