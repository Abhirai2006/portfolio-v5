# Art

Every illustration on the site is drawn in code (SVG and CSS) in an original webtoon style. No characters,
panels, logos or fonts from any existing manga, manhwa or anime are used.

## Swapping in hand-drawn art

Each drawn element has a slot so a scan or photo of a hand-drawn sketch can replace it:

| Component | Slot | How |
|---|---|---|
| `Panel` (`primitives.tsx`) | `art` | `<Panel art="/media/art/origin-1.jpg" artAlt="…">`: the image fills the panel behind its text. |
| `EpisodeCover` | `project.cover` | Add `cover: "/media/art/<slug>.jpg"` to the project in `src/lib/projects.ts`. |
| `ChessPiece` | (none) | Pieces stay code-drawn so the board stays crisp at every size. |

Put images in `public/media/art/`, ideally 1600 px on the long side, JPG or WebP.

## Pieces

- `Panel`: outlined panel with hard shadow; `tone="wash"` tints it with the chapter colour (`--wash-*`).
- `Bubble`: speech bubble, tail left or right.
- `SpeedLines`: radial lines for emphasis (decorative, `aria-hidden`).
- `Screentone`: halftone dots for shading (decorative, `aria-hidden`).
