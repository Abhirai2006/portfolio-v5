import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import ogCover from "@/assets/og-cover.jpg.asset.json";
import { SITE } from "@/lib/site";

function NotFoundComponent() {
  return (
    <main className="page">
      <div
        className="page-wrap"
        style={{ minHeight: "80vh", display: "grid", placeContent: "center", textAlign: "center" }}
      >
        <p className="page-kicker">Error · 404</p>
        <h1 className="page-title">Page not found</h1>
        <p className="page-lede" style={{ margin: "0 auto 24px" }}>
          This panel was never drawn. The story is still where you left it.
        </p>
        <div className="case-actions" style={{ justifyContent: "center" }}>
          <Link to="/" className="btn-ink primary">
            Back to the story
          </Link>
          <a href="/#contact" className="btn-ink">
            Contact
          </a>
        </div>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  return (
    <main className="page">
      <div
        className="page-wrap"
        style={{ minHeight: "80vh", display: "grid", placeContent: "center", textAlign: "center" }}
      >
        <p className="page-kicker">Something broke</p>
        <h1 className="page-title">This page didn't load</h1>
        <div className="case-actions" style={{ justifyContent: "center" }}>
          <button
            type="button"
            className="btn-ink primary"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </button>
          <a href="/" className="btn-ink">
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "google-site-verification", content: "P2DRuJ18Vnv9ODoBdeu9g8N8WJNXvirCetwE0pxIK2Y" },
      { title: "Abhishek Rai A · Aspiring ML Engineer · Abhishek's World" },
      {
        name: "description",
        content:
          "Portfolio of Abhishek Rai A, a B.E. AI & ML student and Bluemind Solutions intern who built a Customer Churn Intelligence System.",
      },
      { name: "author", content: "Abhishek Rai A" },
      { property: "og:title", content: "Abhishek Rai A · Aspiring ML Engineer · Abhishek's World" },
      {
        property: "og:description",
        content:
          "Portfolio of Abhishek Rai A, a B.E. AI & ML student and Bluemind Solutions intern who built a Customer Churn Intelligence System.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Abhishek Rai A · Aspiring ML Engineer · Abhishek's World",
      },
      {
        name: "twitter:description",
        content:
          "Portfolio of Abhishek Rai A, a B.E. AI & ML student and Bluemind Solutions intern who built a Customer Churn Intelligence System.",
      },
      // Default share image; pages with their own (anime, case studies with screenshots) override it.
      { property: "og:image", content: `${SITE}${ogCover.url}` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Abhishek Rai A, Aspiring ML Engineer" },
      { name: "twitter:image", content: `${SITE}${ogCover.url}` },
      { name: "theme-color", content: "#0E0E10" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
