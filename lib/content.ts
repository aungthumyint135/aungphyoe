import type { RevealEffect } from "./reveal";
import type { VideoSource } from "./videoScrubber";

/**
 * All copy, media paths and scene timings live here.
 * Timings are fractions (0–1) of the pinned scroll distance. See README →
 * "Changing content and timing".
 *
 * The background film (scripts/generate-portfolio-video.mjs) has three acts
 * of ~6 s each in a 16 s clip, mapped over videoRange [0, 0.92]:
 *   code   ≈ 0.00–0.34   → hero + "Full-stack"
 *   data   ≈ 0.29–0.63   → "Data & backend"
 *   infra  ≈ 0.58–0.92   → "Systems & security" + skills
 */

export const brand = {
  name: "Aung Phyoe",
  role: "Full-stack developer",
  tagline: "Full-stack developer — backend, data & security",
  description:
    "Portfolio of Aung Phyoe: full-stack web development with Laravel and React, PostgreSQL database design, and web application security.",
  github: "https://github.com/aungthumyint135",
  githubHandle: "aungthumyint135",
  repo: "https://github.com/aungthumyint135/aungphyoe",
};

export const film = {
  /** First playable match wins: media query → browser support → order. */
  sources: [
    { src: "/videos/hero-video-mobile.mp4", type: "video/mp4", media: "(max-width: 767px)" },
    { src: "/videos/hero-video.mp4", type: "video/mp4" },
    { src: "/videos/hero-video.webm", type: 'video/webm; codecs="vp9"' },
  ] satisfies VideoSource[],
  poster: "/images/hero-poster.jpg",
  /**
   * Viewport heights of scrolling while the film is pinned.
   * Higher = the video advances more slowly per scroll, which also makes
   * fast scrolling easier for the decoder to keep up with.
   */
  scrollLength: 7,
  /**
   * Video seek easing, 0–1 (per 60fps frame). Higher = video follows the
   * scrollbar more tightly; lower = smoother but trails behind.
   * 1 = no easing at all.
   */
  smoothing: 0.25,
  /**
   * Text/card catch-up after scrolling: `true` = locked to the scrollbar,
   * a number = seconds to catch up (e.g. 0.3 snappy, 1 floaty).
   */
  scrub: 0.4 as boolean | number,
  /** The video plays across this part of the pin, then holds its last frame. */
  videoRange: [0, 0.92] as [number, number],
  /** Stage fades to the page background here, then the pin releases. */
  fadeOutRange: [0.9, 0.98] as [number, number],
};

export const nav = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];

export const hero = {
  eyebrow: "Portfolio — Full-stack · Backend · Security",
  title: "I build secure,",
  titleAccent: "scalable web.",
  subtitle:
    "Hi, I'm Aung Phyoe. I design databases, build REST APIs and ship full-stack apps with Laravel and React, with security in mind from the first line of code.",
  scene: { start: 0, end: 0.11 },
};

export type StoryBlock = {
  id?: string;
  eyebrow: string;
  title: string;
  body: string;
  tags: string[];
  image: { src: string; alt: string };
  align: "left" | "right";
  /** Effect for the heading. Body and image follow with complementary effects. */
  effect: RevealEffect;
  scene: { start: number; end: number };
};

export const story: StoryBlock[] = [
  {
    id: "about",
    eyebrow: "01 · Full-stack development",
    title: "From the database to the browser.",
    body: "I work across the whole stack: Laravel and PHP on the server, React and JavaScript in the browser, joined by clean, well-documented REST APIs.",
    tags: ["PHP", "Laravel", "JavaScript", "React.js", "REST API"],
    image: { src: "/images/story-material.webp", alt: "Laravel and React code scrolling on a dark screen" },
    align: "left",
    effect: "chars",
    scene: { start: 0.13, end: 0.32 },
  },
  {
    eyebrow: "02 · Data & backend",
    title: "Schemas that stay fast as data grows.",
    body: "Relational modelling, indexing and query tuning in PostgreSQL, with type-safe access through Drizzle ORM and backends designed around clear boundaries.",
    tags: ["SQL", "PostgreSQL", "Database Design", "Drizzle ORM", "Backend"],
    image: { src: "/images/story-light.webp", alt: "API request logs over a glowing data grid" },
    align: "right",
    effect: "blur",
    scene: { start: 0.34, end: 0.52 },
  },
  {
    eyebrow: "03 · Systems & security",
    title: "Built to be attacked, and hold.",
    body: "Comfortable on Linux servers and virtualized infrastructure. I test web applications the way an attacker would, then fix what I find.",
    tags: ["Linux", "Web App Security", "Penetration Testing", "Virtualization", "System Design"],
    image: { src: "/images/story-form.webp", alt: "Server racks with blinking lights and a security scan terminal" },
    align: "left",
    effect: "up",
    scene: { start: 0.53, end: 0.69 },
  },
];

export const features = {
  id: "skills",
  eyebrow: "Toolkit",
  title: "What I work with.",
  items: [
    {
      index: "01",
      title: "Frontend",
      body: "Interactive, accessible interfaces.",
      tags: ["JavaScript", "React.js"],
    },
    {
      index: "02",
      title: "Backend & APIs",
      body: "Full-stack apps and REST services.",
      tags: ["PHP", "Laravel", "REST API"],
    },
    {
      index: "03",
      title: "Data",
      body: "Modelling, queries and ORMs.",
      tags: ["SQL", "PostgreSQL", "Drizzle ORM"],
    },
    {
      index: "04",
      title: "Systems & Security",
      body: "Infrastructure and offensive testing.",
      tags: ["Linux", "Pentesting", "Virtualization", "System Design"],
    },
  ],
  scene: { start: 0.71, end: 0.89 },
};

export const finale = {
  id: "contact",
  eyebrow: "Get in touch",
  title: "Let's build something solid.",
  body: "Open to full-stack, backend and security work. The fastest way to reach me or see my code is on GitHub.",
  cta: { label: "View my GitHub", href: brand.github },
  secondary: { label: "Source of this site", href: brand.repo },
  details: [
    { label: "GitHub", value: `@${brand.githubHandle}` },
    { label: "Focus", value: "Full-stack · Backend · Security" },
    { label: "Stack", value: "Laravel · React · PostgreSQL" },
  ],
};
