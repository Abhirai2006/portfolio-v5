# Abhishek's World

The portfolio of **Abhishek Rai A**, an aspiring machine learning engineer in Mysuru, looking for ML internships.

A walk down through a real rainforest: a scroll-driven 3D site built with three.js and GSAP, with real physics
(gravity, wind, falling leaves, mist) and a camera that focuses like a real lens. Every word on the page is also
server-rendered, so it reads fine without JavaScript or WebGL.

## Run it

```bash
bun install
bun run dev        # http://localhost:8080
bun run test
bun run build
```

Debug: `/?p=0.4` pins the opening at a scroll position; `&tier=lite` or `&tier=static` forces a quality level.

## Stack

TanStack Start (React 19, SSR) · three.js · GSAP ScrollTrigger · Lenis · Tailwind · Cloudflare Workers.

The plants, trees and animals are 3D scans and models by other artists (CC0 and CC BY 4.0), credited in the
site footer. The ML and algorithm work is his; the web layer was built with AI as a copilot.
