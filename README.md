# Aung Phyoe — portfolio

Personal portfolio for a full-stack developer (Laravel, React, PostgreSQL, web security), built as a cinematic one-page site built with Next.js (App Router), React, TypeScript, Tailwind CSS and GSAP ScrollTrigger. A full-screen background video is **scrubbed by scroll** (scroll down = forward, scroll up = backward; it never autoplays) while foreground scenes animate in and out at precise scroll positions.

## Quick start

```bash
npm install
npm run portfolio-video                          # optional: re-render the background film
npm run prepare-video -- media-src/portfolio-bg.mp4  # encode it for the site
npm run dev            # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Type check only: `npm run typecheck`.

## Project structure

```
app/
  layout.tsx            fonts, metadata, pre-paint motion/reduced-motion detection
  page.tsx              page composition
  globals.css           base styles + initial hidden states (no flash)
components/
  story/
    ScrollVideoSection.tsx  pinned stage, master timeline, video scrubbing
    Scene.tsx               a foreground layer timed to a progress range
    Reveal.tsx              scroll reveals for normal-flow sections
    SplitText.tsx           accessible char/word splitting
    StoryContext.ts         scene registry
  sections/             Hero, Story, Features, Final, Header, Footer
lib/
  content.ts            ← all copy, media paths, scene timings, scroll tuning
  videoScrubber.ts      framework-agnostic scroll→currentTime controller
  reveal.ts             animation presets (fade/up/down/left/right/scale/blur/chars)
  useMotionEnabled.ts   reduced-motion / save-data handling
scripts/
  generate-portfolio-video.mjs  renders the code → data → infrastructure film
  portfolio-text/       code, API logs used in the film
  prepare-video.mjs     re-encode any clip for smooth scrubbing
  generate-sample-video.mjs  original abstract placeholder film
public/videos, public/images
```

## How it works

- One ScrollTrigger pins the stage for `scrollLength` viewport heights and drives a single GSAP timeline normalised to 0–1.
- Every `<Scene start end>` adds its tweens to that timeline. Children with `data-reveal="up|down|left|right|fade|scale|blur|chars"` enter in DOM order and exit before `end`; `data-parallax="0.3"` elements drift.
- The same trigger's raw progress drives `videoScrubber`: it maps progress to `currentTime`, eases with a requestAnimationFrame loop that stops when settled, and never queues a seek while one is in flight. No React state updates on scroll.
- The video is fetched into a Blob URL so seeks don't wait on network range requests.
- All tweens use `fromTo` with explicit states, so reverse scrolling never flashes.

## The background film

`npm run portfolio-video` renders a 16 s, 1920×1080 film with ffmpeg (bundled via `ffmpeg-static`, no install needed) in three acts that match the story:

| Time | Act | Scene |
|---|---|---|
| 0–6 s | Laravel / React / Drizzle code scrolling at two depths | Hero, 01 Full-stack |
| 5–11 s | Data field, grid and REST API logs | 02 Data & backend |
| 10–16 s | Dolly past server racks, security scan, pentest terminal | 03 Systems & security, Skills |

Edit the code and logs shown in `scripts/portfolio-text/`. The master goes to `media-src/` (git-ignored), and the story stills to `public/images/`. Then run `prepare-video` on it.

## Replacing the video

1. Put your clip anywhere and run:

   ```bash
   npm run prepare-video -- path/to/your-clip.mp4
   ```

   This writes `public/videos/hero-video.mp4`, `hero-video-mobile.mp4`, `hero-video.webm` and `public/images/hero-poster.jpg`, re-encoded with a keyframe every 10 frames, no audio and faststart. **This matters:** phone and camera exports often have one keyframe every few seconds, and that makes scroll scrubbing stutter.

2. Hard-refresh the browser (videos are cached for a day).

Prefer to encode by hand? The important flags are:

```bash
ffmpeg -i in.mp4 -c:v libx264 -crf 26 -g 10 -keyint_min 10 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart -an public/videos/hero-video.mp4
```

Tips: keep clips 8–20 s and under ~15 MB (desktop) / ~6 MB (mobile). Slow, continuous camera moves scrub best. Use a landscape clip for desktop and, if you have one, a portrait cut for `hero-video-mobile.mp4`.

Sources are configured in `lib/content.ts → film.sources`. The first entry whose `media` query matches and whose `type` the browser supports is used.

## Tuning scroll feel (lag when scrolling fast)

All in `lib/content.ts → film`:

| Setting | Effect |
|---|---|
| `smoothing` (0–1) | Video easing. Higher = video sticks tighter to the scrollbar. `1` = no easing. |
| `scrub` | Text/card catch-up. `true` = locked to scroll, `0.3` snappy, `1` floaty. |
| `scrollLength` | Pinned distance in viewport heights. Higher = video moves slower per scroll and fast flicks are easier to keep up with. |

If the video still trails on fast scrolls, the cause is almost always the file (sparse keyframes or very high resolution/bitrate). Run `prepare-video`.

## Changing content and timing

Edit `lib/content.ts`. Scene timings (`scene: { start, end }`) are fractions of the pinned scroll. To sync text with a moment in the video at time **t** seconds, use `start ≈ (t / duration) × videoRange[1]`. Add a story block by appending to `story`. Each block picks a heading `effect`.

## Accessibility and fallbacks

- `prefers-reduced-motion`, Save-Data, very low-end devices, or `?motion=off` → a static stacked layout: no pinning, no video download, poster image only. The same layout is used without JavaScript.
- If the video is missing, fails or is unsupported, the poster stays and the story still works (a warning is logged).
- All scene text stays in the DOM for screen readers. Split headings expose the plain sentence. Nav links jump to pinned scenes and move focus there. There's a skip link, and scrolling is never hijacked.
