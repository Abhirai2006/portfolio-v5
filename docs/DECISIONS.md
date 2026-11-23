# Decisions

Every judgment call made while building, newest last: what was decided, why, and what it costs if wrong.

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-11-22 | Animals are licensed rigged 3D models with a custom manga ink shader (not code-only) | Realistic motion; Abhishek chose option A | Asset licensing work |
| 2026-11-22 | Stack stays TanStack Start on Cloudflare Workers; 3D with three.js/R3F; GSAP + Lenis | Crawlable SSR, existing deploy, existing verified engine | None significant |
| 2026-11-22 | Phones get pre-rendered cinematic videos | Abhishek approved; recruiters open links on phones | Video production time |
| 2026-11-22 | Sound off by default, one toggle | Abhishek approved; browsers block autoplay audio | None |
| 2026-11-22 | Whole site built in one session; one look check (M0 stills) instead of eight milestone stops | Abhishek's choice | Look changes requested after the fact cost rework |
| 2026-11-22 | Creatures: CC0 Quaternius horse (knight) + knight character (pawn's soldier); elephant, lion, Garuda, phoenix built in code | Model sites were unreachable from the build sandbox; Abhishek chose the mix | Code-built creatures are more stylised than rigged models |
| 2026-11-22 | Products "FIVE VOLUMES" = the five main arcs, Churn system included | Abhishek's answer | None |
| 2026-11-22 | Overnight: M0 look check delivered but non-blocking | Abhishek went to sleep and granted all permissions | He may ask for look changes in the morning |
| 2026-11-22 | Sound is synthesised with Web Audio (no sample files) | Sound libraries unreachable; synthesis is original and licence-free | Less realistic than recorded foley |
| 2026-11-22 | Single ink theme; the light/dark toggle is gone | DESIGN §3 HUD has no theme control; the world is ink and paper | Visitors who preferred light mode lose it |
| 2026-11-22 | WebGL canvas is transparent and sits ABOVE the giant type (pointer-events off) | Lets 3D pass in front of the name and blur it (Neuroform masking) while every word stays real DOM text | — |
| 2026-11-22 | Custom alpha-preserving ink compositor instead of the postprocessing library | The library drops alpha; ours does Sobel outlines + light-only bloom + chromatic aberration with alpha; screentone lives in the material | More shader code to own |
| 2026-11-22 | No Draco/Meshopt decoders (useGLTF with both off); no gltf-transform pass | Models are already 666 KB / 384 KB; avoids WebAssembly, CDN fetches and a looser CSP | Bigger downloads if heavier models are added later |
| 2026-11-22 | Each creature runs its own 3D chamfered route shaped like its piece's move (L-moves, ranks, diagonals) | The DOM "Where are you going?" line lives further down the page; the 3D routes echo it | — |
| 2026-11-22 | Transformation timing, sound, flashes and the final scroll live in the DOM (ImpactOverlay) | Same behaviour for live 3D, reduced motion and the phone videos | — |
| 2026-11-22 | Phone videos rendered at 960×540 / 540×960 and scaled ×2 by ffmpeg; frame-exact capture with Playwright's paused clock | The build machine's software GPU is too slow for native 1080p | Slightly softer than native |
| 2026-11-22 | Phone board = still image with numbered markers + six full-width buttons | Text labels collide at 390 px; 44 px touch targets | — |
| 2026-11-22 | 404 page lost the One Piece quote; original copy "LOST IN THE VOID." | PRD N5: no lines or characters from existing works in the site's own voice | — |
| 2026-11-22 | Lookdev/recording URL params: `?shot=&t=`, `?tier=high`, `?clean=1` | Needed to render stills/videos in a headless browser; harmless for visitors | None |
| 2026-11-22 | Loader shows "Skip" after 8 s even if READY hasn't arrived | A stalled download or shader compile must never trap a visitor | — |
| 2026-11-22 | Share image (og-cover) rendered from the live name shot | Same art direction as the site | Must be re-rendered after look changes |
