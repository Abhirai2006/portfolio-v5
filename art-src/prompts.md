# Abhishek's World — ChatGPT image prompts

How to use (docs/ART-PIPELINE.md §2):
1. Make a ChatGPT **Project** called "Abhishek's World art". Upload your clearest front-facing photo (and 2–3 more angles).
2. New chat → paste the **STYLE BIBLE** (§1), then the **CHARACTER SHEET** prompts (§2). Approve the sheets first.
3. Upload the approved character sheets to the project. Then paste the panel prompts (§3) **one per message, in order**.
4. Download each full-resolution PNG and name it **exactly** as the prompt says (e.g. `coast.sky.ink.png`).
5. Put the PNGs in `art-src/incoming/` and run `bun scripts/import-art.ts`. It resizes/crops each image to its slot,
   writes the WebP layers the site already uses, clears the code-drawn layers it replaces, and rebuilds the no-JS
   stills. The comic picks the new art up on the next build.

Every panel has an **ink** version and a **colour** version (the colour flood mixes them). If you only make one, make
the ink one first; the code-drawn colour twin stays until you replace it.

Provisional choices (change them if you want, then regenerate the sheet): outfit = dark navy hoodie over a white T-shirt,
dark trousers, white sneakers; signature detail = **one electric-blue keycap on a cord around his neck**; age ≈ 20
(≈ 8 in Chapter 1); his father appears only as **hands** (no face).

---

## 1. STYLE BIBLE (paste first in every new chat)
```
STYLE BIBLE — "Abhishek's World" (an original webtoon)
You are illustrating an original Korean-webtoon-style comic. Rules for every image:
- Rendering: modern manhwa line art — clean, confident ink lines with varying weight, sharp cel shading,
  dramatic cinematic lighting, strong rim light, expressive eyes, dynamic angles.
- Ink chapters (before the awakening): ONLY black ink on warm off-white paper (#F2EFE8), with heavy
  cross-hatching, screentone dots, stippling, dry-brush strokes and ink splatter. The ONLY colour allowed is
  electric blue (#1F6BFF, glow #62AEFF), and only on the thing named in the prompt (a monitor, an eye, a light).
- Colour chapters (after the awakening): full-colour manhwa painting — rich, saturated but tasteful colour, deep
  night blues, warm skin tones, glowing electric-blue light as the hero's signature.
- Never include any text, letters, numbers, logos, watermarks or speech bubbles in the image (all text is added
  later in code). Screens may show abstract glowing lines, not readable text.
- Never imitate any existing manga, manhwa, anime, studio or artist. Original designs only.
- No borders or panel frames in the image unless the prompt asks (frames are drawn in code).
- Composition: leave clear empty space where the prompt says a caption will go.
```

## 2. CHARACTER SHEETS (approve before any panel)
### 2a. `sheet.ink.png` — 1536×1024
```
Use the attached photo(s) as the face reference. Create an original manhwa CHARACTER SHEET of this young man,
"Abhishek", about 20 years old, a B.E. AI & ML student from Mysuru, India. Keep his real face shape, skin tone,
eyes, nose, hairline and short dark hairstyle recognisable, drawn in the style bible's modern manhwa style.
Show on one 1536x1024 sheet, on plain off-white paper: front view, three-quarter view, side profile, full-body
standing pose, and four face close-ups (calm, focused at a screen at night, determined, smiling at the viewer).
Outfit: a dark navy hoodie over a white T-shirt, dark trousers, white sneakers.
Signature detail: a single small electric-blue keyboard keycap worn on a thin black cord around his neck.
Ink version (black ink + paper, blue only on the keycap). No text, no labels.
```
### 2b. `sheet.colour.png` — 1536×1024
```
Same character sheet as before, same views and poses, now in FULL COLOUR manhwa painting: warm brown skin,
dark navy hoodie, white T-shirt, the keycap glowing electric blue. Plain off-white background. No text, no labels.
```
### 2c. `sheet.kid.png` — 1024×1024
```
Use the attached character sheet. The same boy at about 8 years old: short dark hair, a white T-shirt and dark
shorts, barefoot. Front, back and three-quarter-back views, ink version on off-white paper. No text.
```

---

## 3. PANELS
Start every prompt with: **"Use the attached character sheet for Abhishek. Follow the style bible."**
Ask for **1536x1024** for landscape panels (the importer crops to the slot), **1024x1536** for tall ones.
"Transparent background" layers: if ChatGPT returns white instead, reply "make the background transparent".

### Chapter 1 · Origin — the Mangaluru coast (ink, blue only on the moon's path on the sea)
**`coast.sky.ink.png`** — background, 1536x1024
```
IMAGE: coast.sky.ink.png — LAYER: background plate. CHAPTER MODE: ink (blue only on the moonlight path on the sea).
SCENE: the Mangaluru coast at night, wide shot, eye level. Top half: black ink night sky full of white stars,
a large stippled full moon upper right, white puffy clouds outlined in ink. Bottom: a calm sea drawn with
horizontal ink wave strokes, the moon's reflection on the water as an electric-blue path, a few tiled-roof
Mangalorean houses and small palms far right. NO people, NO foreground palms.
LIGHT: moonlight from upper right. COMPOSITION: keep the lower-left and upper-left areas calm for captions.
```
**`coast.land.ink.png`** — foreground shore, transparent, 1536x1024
```
IMAGE: coast.land.ink.png — LAYER: foreground on transparent background. CHAPTER MODE: ink.
SCENE: only the sandy shore in the bottom quarter of the frame, same perspective as the background: stippled
sand, a gentle foam line, a trail of small footprints from the left edge to the centre. Everything above the
shoreline is TRANSPARENT.
```
**`coast.boy.ink.png`** — character, transparent, 1536x1024
```
IMAGE: coast.boy.ink.png — LAYER: character on transparent background. CHAPTER MODE: ink.
SCENE: young Abhishek (about 8, from the kid sheet) small in frame, standing at the centre-bottom on the shore
line, three-quarter back view, looking up at the sky; white T-shirt, dark shorts, barefoot. Same camera and light
as the coast background. Everything else TRANSPARENT.
```
**`coast.palms.ink.png`** — foreground frame, transparent, 1536x1024
```
IMAGE: coast.palms.ink.png — LAYER: foreground on transparent background. CHAPTER MODE: ink.
SCENE: two tall coconut palms very close to the camera, one rising from the bottom-left corner and leaning in,
one at the far right edge; heavy black ink silhouettes with thin white rim lines so they read against a black
sky; fronds reaching into the top corners. The centre of the frame is TRANSPARENT.
```
**`hands.back.ink.png`** — inset, 1024x1024
```
IMAGE: hands.back.ink.png — LAYER: inset close-up. CHAPTER MODE: ink (blue only on the screen glow).
SCENE: close-up, top-down, of an adult man's two hands typing fast on an old office keyboard (his father, a
typist), motion lines around the fingers, the glow of a screen at the top edge in electric blue. Hands only,
no face, no rings or watches. Cross-hatched shadows.
```
**`boy-eyes.eyes.ink.png`** — letterbox inset, 1536x1024 (the importer crops the middle band)
```
IMAGE: boy-eyes.eyes.ink.png — LAYER: inset. CHAPTER MODE: ink.
SCENE: extreme close-up letterbox of the boy's two eyes (about 8 years old), wide with curiosity, catch-lights,
speed lines radiating outward. Keep the eyes in the middle horizontal band of the image.
```
**`maths.sky.ink.png`** — tall panel, 1024x1536
```
IMAGE: maths.sky.ink.png — LAYER: background plate. CHAPTER MODE: ink (blue only on one glowing wave curve).
SCENE: a black ink night sky where the stars connect into abstract constellations: a big zig-zag, a long arch,
a tiny network of dots joined by lines, and one glowing electric-blue sine-wave curve across the sky. Bottom:
the silhouette of a small Mangalorean house with one lit window and two palms. No letters or numbers.
COMPOSITION: keep the right side of the sky open.
```
**`mysuru.sky.ink.png`** — background, 1536x1024
```
IMAGE: mysuru.sky.ink.png — LAYER: background plate. CHAPTER MODE: ink.
SCENE: Mysuru at night seen from a rooftop: the great palace far away, its domes and arches outlined by rows of
tiny white light bulbs; quiet city rooftops and water tanks between; black ink sky with stars and two white
clouds. No people. COMPOSITION: keep the top-left corner calm for a caption.
```
**`mysuru.roof.ink.png`** — character + roof, transparent, 1536x1024
```
IMAGE: mysuru.roof.ink.png — LAYER: foreground on transparent background. CHAPTER MODE: ink (blue only on the keycap).
SCENE: a flat rooftop edge across the bottom fifth of the frame; Abhishek (about 18) sitting on the edge seen from
behind, lower-left third, hoodie, a backpack beside him, looking at the distant palace. Above the roof: TRANSPARENT.
```

### Chapter 2 · The night shift (ink, blue only on the monitor and its light)
**`room.back.ink.png`** — background, 1536x1024
```
IMAGE: room.back.ink.png — LAYER: background plate. CHAPTER MODE: ink (blue only on the monitor and its light).
SCENE: a dark student room at 10 pm, eye level from behind the chair: a desk across the lower third, one monitor
glowing electric blue with abstract code lines, a self-built PC tower on the right with a glass side panel and
three fans ringed in blue, a window top-right with the moon and city lights, blank posters on the wall, a mug.
The blue light spills across the desk. No person, no chair.
COMPOSITION: keep the lower-left area dark and calm for captions.
```
**`room.figure.ink.png`** — character, transparent, 1536x1024
```
IMAGE: room.figure.ink.png — LAYER: character on transparent background. CHAPTER MODE: ink, electric-blue rim
light from the monitor in front of him. SCENE: Abhishek (about 20) seen from behind, sitting in a desk chair at
the centre-bottom of the frame, shoulders and head, hood down, the same camera as the room background.
Everything else TRANSPARENT.
```
**`keys.keys.ink.png`** — inset, 1024x1024
```
IMAGE: keys.keys.ink.png — CHAPTER MODE: ink, blue light from above. SCENE: close-up of his hands on a dark
mechanical keyboard at night, fingers mid-keystroke, lit only by blue screen light, speed lines.
```
**`gpu.gpu.ink.png`** — inset, 1024x1024
```
IMAGE: gpu.gpu.ink.png — CHAPTER MODE: ink, blue glow. SCENE: macro close-up of a graphics card's two fans inside
the PC, ringed with electric-blue light, cross-hatched metal, speed lines.
```
**`eyes.eyes.ink.png`** — letterbox inset, 1536x1024 (cropped to the middle band)
```
IMAGE: eyes.eyes.ink.png — CHAPTER MODE: ink, blue reflections in the eyes. SCENE: extreme close-up letterbox of
Abhishek's focused eyes at night, the monitor's code light reflected as electric-blue specks in his irises.
```

### Code Awakening (the turning point)
**`monitor.hands.ink.png`** then **`monitor.hands.colour.png`** — transparent, 1536x1024
```
IMAGE: monitor.hands.ink.png — LAYER: foreground on transparent background. CHAPTER MODE: ink, blue rim light.
SCENE: only his two hands on a keyboard at the bottom edge of the frame, seen from behind his shoulders, light
streaming down onto his fingers from a screen above. Everything above the bottom quarter TRANSPARENT.
(Then the same again in full colour, named monitor.hands.colour.png, the light now wrapping his fingers.)
```
**`rise.hero.colour.png`** — character, transparent, 1024x1536
```
IMAGE: rise.hero.colour.png — LAYER: character on transparent background. CHAPTER MODE: full colour.
SCENE: Abhishek rising upward through the air, low angle, arms opening, head tilted up, eyes determined, hoodie and
hair lifting, a blue code-light aura streaming around him, small glowing square particles, the keycap glowing.
```

### The colour world
**`room.back.colour.png`** and **`room.figure.colour.png`** — the same as the two ink room prompts, in full colour
(deep navy room, warm skin, the monitor's blue light). These appear when "the old room breaks".
**`dawn.sky.colour.png`** — 1536x1024
```
IMAGE: dawn.sky.colour.png — full colour. SCENE: a vast dawn sky above the clouds: deep blue at the top fading to
lavender and warm peach at the horizon, huge sunlit cumulus clouds below, the last stars fading. No people.
COMPOSITION: keep the upper middle open for a big title.
```
**`altar.sky.colour.png`** — 1536x1024
```
IMAGE: altar.sky.colour.png — full colour. SCENE: a night landscape of blue mountains under a starry sky, mist in
the valleys, and in the foreground an ancient flat stone slab seen in perspective, with three soft round pools of
light on it where three objects will float. No objects, no people.
```
**`ml-sky.sky.colour.png`** — 1536x1024
```
IMAGE: ml-sky.sky.colour.png — full colour. SCENE: a deep night sky filled with abstract glowing data streams and
one huge luminous rising curve of light (like a graph line drawn in the sky) and an amber wave falling across it.
No numbers, no text, no people.
```
**`ml-sky.ledge.colour.png`** — transparent, 1536x1024
```
IMAGE: ml-sky.ledge.colour.png — LAYER: foreground on transparent background. SCENE: a dark rock ledge across the
bottom fifth; Abhishek small, seen from behind, standing on it looking up at the sky. Above: TRANSPARENT.
```
**`portrait.face.ink.png`** then **`portrait.face.colour.png`** — 1024x1536
```
IMAGE: portrait.face.ink.png — CHAPTER MODE: ink with screentone. SCENE: half-body portrait of Abhishek facing the
reader, a warm confident smile, eyes straight at the viewer, hoodie, the blue keycap. Plain paper background.
(Then the same in full colour: portrait.face.colour.png, a deep blue background with soft light.)
```
**`eyes.eyes.colour.png`** — 1536x1024: his eyes looking straight at the reader, full colour, blue light in them
(used for "Ask Abhishek").

---

## 4. Prompt log
| Date | File | Prompt § | Notes |
|---|---|---|---|
| | | | |
