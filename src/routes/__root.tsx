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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4">
      <div aria-hidden className="speed-lines pointer-events-none absolute inset-0" />
      <div className="relative max-w-2xl text-center">
        <p className="font-hud text-xs text-grey-3">ERROR 404 · SQUARE NOT FOUND</p>
        <h1 className="mt-4 font-display text-[clamp(4rem,16vw,11rem)] text-paper">
          LOST IN THE VOID.
        </h1>
        <p className="mt-6 text-lg text-grey-4">This square is empty. The board is this way.</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/" className="ink-btn">
            Back to the board →
          </Link>
          <button onClick={() => window.history.back()} className="ink-btn ink-btn-ghost">
            Go back
          </button>
        </div>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "google-site-verification", content: "P2DRuJ18Vnv9ODoBdeu9g8N8WJNXvirCetwE0pxIK2Y" },
      { title: "Abhishek Rai A - ML Engineer · Live Projects" },
      {
        name: "description",
        content:
          "Portfolio of Abhishek Rai A, a B.E. AI & ML student and Bluemind Solutions intern who built a Customer Churn Intelligence System.",
      },
      { name: "author", content: "Abhishek Rai A" },
      { property: "og:title", content: "Abhishek Rai A - ML Engineer · Live Projects" },
      {
        property: "og:description",
        content:
          "Portfolio of Abhishek Rai A, a B.E. AI & ML student and Bluemind Solutions intern who built a Customer Churn Intelligence System.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Abhishek Rai A - ML Engineer · Live Projects" },
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
      { name: "theme-color", content: "#0b0b0c" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      // Self-hosted fonts (public/fonts). The display face is on screen first, so preload it.
      {
        rel: "preload",
        href: "/fonts/big-shoulders-display-900.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/jetbrains-mono-500.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
    ],
    // Marks that JavaScript runs, so scroll reveals can hide words before animating them in.
    // Without JS (crawlers, JS off) the class is never added and every word stays visible.
    scripts: [{ children: "document.documentElement.classList.add('js')" }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    // The inline head script adds `js` to <html> before hydration, so its class is allowed to differ.
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
      {/* Film grain + vignette over every page (DESIGN §2.3). Decoration only. */}
      <div aria-hidden className="vignette" />
      <div aria-hidden className="grain-overlay" />
    </QueryClientProvider>
  );
}
