// Generates placeholder media so the project runs before real assets exist:
//   public/videos/hero-video.mp4         (1920x1080, desktop)
//   public/videos/hero-video-mobile.mp4  (960x540, small screens)
//   public/videos/hero-video.webm        (VP9 alternative)
//   public/images/hero-poster.jpg        (first frame, shown while the video loads)
//   public/images/story-*.webp           (story imagery)
//
// The clip is an abstract "dolly past a colonnade in warm light" so that
// scroll scrubbing is easy to see. Replace these files with real assets anytime.
//
// Usage: npm run sample-video

import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const videos = path.join(root, "public", "videos");
const images = path.join(root, "public", "images");
mkdirSync(videos, { recursive: true });
mkdirSync(images, { recursive: true });

const DURATION = 12;
const FPS = 30;

function run(args, label) {
  process.stdout.write(`• ${label}… `);
  const res = spawnSync(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    stdio: ["ignore", "inherit", "inherit"],
  });
  if (res.status !== 0) {
    console.error(`failed (${label})`);
    process.exit(res.status ?? 1);
  }
  console.log("done");
}

// Columns slide left at different speeds (parallax) while a warm light rotates.
function colonnade(w, h) {
  const s = w / 1920;
  const pillars = [];
  // far layer: thin, slow, translucent
  for (let i = 0; i < 9; i++) {
    const pw = Math.round(46 * s);
    const gap = Math.round(260 * s);
    pillars.push(
      `drawbox=x='mod(${i * gap}-t*${Math.round(70 * s)}\\,${9 * gap})-${pw}':y=0:w=${pw}:h=ih:color=0x0b0907@0.45:t=fill`
    );
  }
  // near layer: wide, fast, dark
  for (let i = 0; i < 5; i++) {
    const pw = Math.round(150 * s);
    const gap = Math.round(560 * s);
    pillars.push(
      `drawbox=x='mod(${i * gap}+${Math.round(180 * s)}-t*${Math.round(210 * s)}\\,${5 * gap})-${pw}':y=0:w=${pw}:h=ih:color=0x070605@0.85:t=fill`
    );
  }
  return [
    `gradients=s=${w}x${h}:r=${FPS}:d=${DURATION}:type=radial:nb_colors=4:speed=0.012:` +
      `c0=0xf3d2a4:c1=0xb3804f:c2=0x3d2a1c:c3=0x120d0a:x0=${Math.round(w * 0.3)}:y0=${Math.round(h * 0.35)}:x1=${w}:y1=${h}`,
    ...pillars,
    // floor line and horizon glow
    `drawbox=x=0:y=ih*0.82:w=iw:h=ih*0.18:color=0x0a0806@0.7:t=fill`,
    `hue=h='t*2':s='1-t/${DURATION * 3}'`,
    `vignette=PI/3.6`,
    `noise=alls=7:allf=t`,
    `format=yuv420p`,
  ].join(",");
}

const desktop = path.join(videos, "hero-video.mp4");

run(
  [
    "-f", "lavfi", "-i", colonnade(1920, 1080),
    // Short GOP (keyframe every 5 frames) keeps scroll seeking responsive.
    "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-g", "5", "-keyint_min", "5",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
    desktop,
  ],
  "hero-video.mp4 (1920x1080)"
);

run(
  [
    "-i", desktop, "-vf", "scale=960:-2",
    "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-g", "5", "-keyint_min", "5",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
    path.join(videos, "hero-video-mobile.mp4"),
  ],
  "hero-video-mobile.mp4 (960x540)"
);

run(
  [
    "-i", desktop, "-vf", "scale=1280:-2",
    "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "38", "-g", "5", "-deadline", "realtime", "-cpu-used", "8", "-an",
    path.join(videos, "hero-video.webm"),
  ],
  "hero-video.webm (1280x720)"
);

run(
  ["-i", desktop, "-frames:v", "1", "-q:v", "3", path.join(images, "hero-poster.jpg")],
  "hero-poster.jpg"
);

// Story images: stills from different points of the film, cropped portrait.
const stills = [
  { name: "story-material", at: 3.2, hue: 0 },
  { name: "story-light", at: 6.4, hue: -12 },
  { name: "story-form", at: 9.6, hue: 10 },
];
for (const s of stills) {
  run(
    [
      "-ss", String(s.at), "-i", desktop, "-frames:v", "1",
      "-vf", `crop=ih*0.8:ih,scale=960:-2,hue=h=${s.hue},eq=contrast=1.08`,
      "-c:v", "libwebp", "-quality", "80",
      path.join(images, `${s.name}.webp`),
    ],
    `${s.name}.webp`
  );
}

console.log("\nPlaceholder media written to public/videos and public/images.");
