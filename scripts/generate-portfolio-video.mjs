// Generates a developer-portfolio background film (16 s, 1920x1080) in three acts
// that line up with a portfolio's scroll story:
//
//   0–6 s   CODE      Laravel / React / Drizzle + SQL scrolling at two depths
//   5–11 s  DATA      a living data field, grid lines and REST API logs
//   10–16 s INFRA     a dolly past server racks, a security scan line and a
//                     pentest terminal typing results
//
// Output: media-src/portfolio-bg.mp4 (master, not served), then run
//   npm run prepare-video -- media-src/portfolio-bg.mp4
// to produce the scrub-friendly site assets. Story stills are written to
// public/images/story-*.webp.
//
// Usage: npm run portfolio-video

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const textDir = path.join(root, "scripts", "portfolio-text");
const outDir = path.join(root, "media-src");
const images = path.join(root, "public", "images");
mkdirSync(outDir, { recursive: true });
mkdirSync(images, { recursive: true });

const W = 1920;
const H = 1080;
const FPS = 30;
const ACT = 6; // seconds per act; acts overlap by 1 s cross-fades
const FONT = "/System/Library/Fonts/Menlo.ttc";

const CYAN = "0x22d3ee";
const TEAL = "0x5eead4";
const GREEN = "0x34d399";
const AMBER = "0xf59e0b";

// Terminal lines for act 3, one file each (avoids drawtext escaping rules).
const tmp = mkdtempSync(path.join(os.tmpdir(), "portfolio-video-"));
const terminal = [
  "$ nmap -sV --top-ports 100 10.0.4.12",
  "[ OK ] TLS 1.3 only, HSTS preload",
  "[ OK ] CSP: default-src 'self'",
  "[ OK ] SQLi probes: 0 findings",
  "[ OK ] XSS probes: 0 findings",
  "[WARN] X-Powered-By header exposed",
  "$ systemctl status nginx   active (running)",
];
const termFiles = terminal.map((line, i) => {
  const f = path.join(tmp, `term-${i}.txt`);
  writeFileSync(f, line);
  return f;
});

const text = (opts) =>
  "drawtext=" +
  Object.entries({ fontfile: FONT, expansion: "none", ...opts })
    .map(([k, v]) => `${k}=${v}`)
    .join(":");

/* ---------------- Act 1: code ---------------- */
const act1 = [
  `gradients=s=${W}x${H}:r=${FPS}:d=${ACT}:type=radial:nb_colors=3:speed=0.008:` +
    `c0=0x0c3446:c1=0x061620:c2=0x020609:x0=1400:y0=380:x1=${W}:y1=${H},format=gbrp[bg1]`,
  // far layer: two blurred columns drifting up slowly
  `color=c=black:s=${W}x${H}:r=${FPS}:d=${ACT},` +
    text({ textfile: path.join(textDir, "code-far.txt"), fontsize: 24, fontcolor: `${CYAN}@0.55`, line_spacing: 14, x: "'90-t*6'", y: "'40-t*38'" }) + "," +
    text({ textfile: path.join(textDir, "code-far.txt"), fontsize: 24, fontcolor: `${TEAL}@0.4`, line_spacing: 14, x: "'1250-t*6'", y: "'-520-t*30'" }) + "," +
    `gblur=sigma=6,format=gbrp[far1]`,
  // near layer: sharp code on the right half, faster (parallax)
  `color=c=black:s=${W}x${H}:r=${FPS}:d=${ACT},` +
    text({ textfile: path.join(textDir, "code-near.txt"), fontsize: 36, fontcolor: "0xd9f7ff@0.82", line_spacing: 18, x: "'1010-t*14'", y: "'120-t*72'" }) + "," +
    `gblur=sigma=0.6,format=gbrp[near1]`,
  `[bg1][far1]blend=all_mode=screen[a1b]`,
  `[a1b][near1]blend=all_mode=screen,format=yuv420p[a1]`,
];

/* ---------------- Act 2: data + API ---------------- */
const act2 = [
  `life=s=240x135:r=${FPS}:ratio=0.06:mold=12:seed=7:` +
    `life_color=${CYAN}:death_color=0x02070b:mold_color=0x0a3442,` +
    `trim=duration=${ACT},setpts=PTS-STARTPTS,` +
    `scale=${W}:${H}:flags=neighbor,lagfun=decay=0.94,gblur=sigma=1.4,` +
    `eq=brightness=-0.06:saturation=0.9,` +
    `drawgrid=w=96:h=96:t=1:c=${CYAN}@0.06,format=gbrp[life2]`,
  `gradients=s=${W}x${H}:r=${FPS}:d=${ACT}:type=radial:nb_colors=2:speed=0.01:` +
    `c0=0x0a2533:c1=0x010405:x0=600:y0=500:x1=${W}:y1=${H},format=gbrp[bg2]`,
  `color=c=black:s=${W}x${H}:r=${FPS}:d=${ACT},` +
    text({ textfile: path.join(textDir, "api-logs.txt"), fontsize: 26, fontcolor: "0xa5f3fc@0.85", line_spacing: 20, x: "1130", y: "'260-t*58'" }) + "," +
    // highlight row: a soft bar the logs scroll through
    `drawbox=x=1100:y=520:w=760:h=40:color=${CYAN}@0.07:t=fill,format=gbrp[logs2]`,
  `[bg2][life2]blend=all_mode=screen:all_opacity=0.75[a2b]`,
  `[a2b][logs2]blend=all_mode=screen,format=yuv420p[a2]`,
];

/* ---------------- Act 3: data center + security ---------------- */
// Wrap-safe horizontal position for repeating elements moving left.
const loopX = (offset, speed, period, w) =>
  `'mod(${offset}-t*${speed}+${period * 1000}\\,${period})-${w}'`;

const racks = [];
// far racks: thin, slow, dim
{
  const n = 10, gap = 240, w = 90, speed = 55;
  for (let i = 0; i < n; i++) {
    racks.push(`drawbox=x=${loopX(i * gap, speed, n * gap, w)}:y=150:w=${w}:h=760:color=0x0b1726@0.75:t=fill`);
  }
}
// near racks: wide, fast, with blinking LEDs
{
  const n = 5, gap = 500, w = 230, speed = 170;
  const ledColors = [GREEN, GREEN, CYAN, GREEN, AMBER];
  for (let i = 0; i < n; i++) {
    const rx = (dx) => loopX(i * gap + 120 + dx, speed, n * gap, w);
    racks.push(`drawbox=x=${rx(0)}:y=60:w=${w}:h=900:color=0x070b11@0.96:t=fill`);
    racks.push(`drawbox=x=${rx(0)}:y=60:w=${w}:h=900:color=0x1d3a52@0.9:t=2`);
    for (let r = 0; r < 12; r++) {
      const y = 110 + r * 68;
      // server unit face
      racks.push(`drawbox=x=${rx(14)}:y=${y}:w=${w - 28}:h=50:color=0x111b26@0.95:t=fill`);
      for (let l = 0; l < 3; l++) {
        const color = ledColors[(i + r + l) % ledColors.length];
        const rate = (1.3 + ((i * 7 + r * 3 + l) % 5) * 0.55).toFixed(2);
        const phase = (((i * 13 + r * 5 + l * 3) % 10) / 10).toFixed(2);
        racks.push(
          `drawbox=x=${rx(28 + l * 22)}:y=${y + 20}:w=10:h=8:color=${color}@0.95:t=fill:` +
            `enable='lt(mod(t*${rate}+${phase}\\,1)\\,0.55)'`
        );
      }
    }
  }
}

const act3 = [
  `gradients=s=${W}x${H}:r=${FPS}:d=${ACT}:type=radial:nb_colors=3:speed=0.01:` +
    `c0=0x123a5c:c1=0x07182a:c2=0x020509:x0=960:y0=300:x1=${W}:y1=${H},` +
    racks.join(",") + "," +
    // floor + reflection band
    `drawbox=x=0:y=960:w=iw:h=120:color=0x03070c@0.85:t=fill,` +
    // security scan line with a soft trailing band
    `drawbox=x=0:y='mod(t*230\\,ih)-60':w=iw:h=60:color=${TEAL}@0.05:t=fill,` +
    `drawbox=x=0:y='mod(t*230\\,ih)':w=iw:h=3:color=${TEAL}@0.7:t=fill,` +
    // terminal panel (top right), lines appear one by one
    `drawbox=x=1150:y=120:w=700:h=330:color=0x02060a@0.78:t=fill,` +
    `drawbox=x=1150:y=120:w=700:h=330:color=${TEAL}@0.25:t=1,` +
    termFiles
      .map((f, i) =>
        text({
          textfile: f,
          fontsize: 22,
          fontcolor: (terminal[i].startsWith("[WARN]") ? `${AMBER}` : terminal[i].startsWith("$") ? "0xe2e8f0" : `${GREEN}`) + "@0.95",
          x: 1180,
          y: 150 + i * 40,
          enable: `'gte(t\\,${(0.4 + i * 0.65).toFixed(2)})'`,
        })
      )
      .join(",") +
    `[a3]`,
];

/* ---------------- Assemble ---------------- */
const graph = [
  ...act1,
  ...act2,
  ...act3,
  `[a1][a2]xfade=transition=fade:duration=1:offset=${ACT - 1}[x1]`,
  `[x1][a3]xfade=transition=fade:duration=1:offset=${ACT * 2 - 2}[x2]`,
  `[x2]vignette=PI/4.2,noise=alls=5:allf=t,format=yuv420p[out]`,
].join(";");

const master = path.join(outDir, "portfolio-bg.mp4");

function run(args, label) {
  process.stdout.write(`• ${label}… `);
  const res = spawnSync(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    stdio: ["ignore", "inherit", "inherit"],
  });
  if (res.status !== 0) {
    console.error("failed");
    process.exit(res.status ?? 1);
  }
  console.log("done");
}

run(
  ["-filter_complex", graph, "-map", "[out]", "-c:v", "libx264", "-preset", "slow", "-crf", "20",
    "-g", "10", "-keyint_min", "10", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", master],
  "portfolio-bg.mp4 (master)"
);

// Story stills, one per act, cropped portrait.
const stills = [
  { name: "story-material", at: 3 },
  { name: "story-light", at: 8 },
  { name: "story-form", at: 13.5 },
];
for (const s of stills) {
  run(
    ["-ss", String(s.at), "-i", master, "-frames:v", "1",
      "-vf", "crop=ih*0.8:ih:iw*0.55:0,scale=960:-2", "-c:v", "libwebp", "-quality", "82",
      path.join(images, `${s.name}.webp`)],
    `${s.name}.webp`
  );
}

console.log(`\nMaster written to ${path.relative(root, master)}.`);
console.log("Next: npm run prepare-video -- media-src/portfolio-bg.mp4");
