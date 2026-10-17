// Turns any source clip into scroll-scrub-friendly assets:
//   public/videos/hero-video.mp4         (long side ≤ 1920px, H.264)
//   public/videos/hero-video-mobile.mp4  (long side ≤ 1280px, H.264, lighter)
//   public/videos/hero-video.webm        (long side ≤ 1280px, VP9)
//   public/images/hero-poster.jpg        (first frame)
//
// Why re-encode? Browsers can only seek precisely by decoding forward from the
// previous keyframe. Camera/phone exports often have one keyframe every few
// seconds, which makes scroll scrubbing stutter. These outputs have a keyframe
// every 10 frames, no audio track, and `faststart` metadata.
//
// Usage: npm run prepare-video -- path/to/source.mp4
// The source may be one of the output paths; outputs are written to a temp
// file first and then moved into place.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync } from "node:fs";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const input = process.argv[2];
if (!input || !existsSync(input)) {
  console.error("Usage: npm run prepare-video -- path/to/source.mp4");
  process.exit(1);
}

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const videos = path.join(root, "public", "videos");
const images = path.join(root, "public", "images");
mkdirSync(videos, { recursive: true });
mkdirSync(images, { recursive: true });

// Fit the long side to `max` px without upscaling, keep even dimensions.
const fit = (max) =>
  `scale='if(gte(iw,ih),min(${max},iw),-2)':'if(gte(iw,ih),-2,min(${max},ih))'`;

const GOP = ["-g", "10", "-keyint_min", "10", "-sc_threshold", "0"];

function encode(label, args, out) {
  const tmp = `${out}.tmp${path.extname(out)}`;
  process.stdout.write(`• ${label}… `);
  const res = spawnSync(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", "-i", input, ...args, tmp], {
    stdio: ["ignore", "inherit", "inherit"],
  });
  if (res.status !== 0) {
    console.error("failed");
    process.exit(res.status ?? 1);
  }
  renameSync(tmp, out);
  console.log("done");
}

encode(
  "poster",
  ["-frames:v", "1", "-vf", fit(1920), "-q:v", "5"],
  path.join(images, "hero-poster.jpg")
);
encode(
  "mobile mp4",
  ["-vf", fit(1280), "-c:v", "libx264", "-preset", "slow", "-crf", "30", ...GOP, "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an"],
  path.join(videos, "hero-video-mobile.mp4")
);
encode(
  "webm",
  ["-vf", fit(1280), "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "42", ...GOP, "-deadline", "good", "-cpu-used", "4", "-row-mt", "1", "-an"],
  path.join(videos, "hero-video.webm")
);
// Desktop last, so a source at this path is read for the steps above first.
encode(
  "desktop mp4",
  ["-vf", fit(1920), "-c:v", "libx264", "-preset", "slow", "-crf", "27", ...GOP, "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an"],
  path.join(videos, "hero-video.mp4")
);

console.log("\nDone. Restart `npm run dev` or hard-refresh to bypass the browser cache.");
