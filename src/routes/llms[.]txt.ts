import { createFileRoute } from "@tanstack/react-router";
import { llmsTxt } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(llmsTxt(SITE), {
          headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
        }),
    },
  },
});
