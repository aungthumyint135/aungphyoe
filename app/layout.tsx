import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { brand } from "@/lib/content";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${brand.name} — ${brand.tagline}`,
  description: brand.description,
};

export const viewport: Viewport = {
  themeColor: "#04080c",
  width: "device-width",
  initialScale: 1,
};

/**
 * Decides, before first paint, whether the scroll-driven story runs.
 * Adds `motion` to <html> unless the visitor prefers reduced motion, has
 * Save-Data enabled, is on a very low-end device (<2 GB RAM or <3 cores),
 * or appended `?motion=off` to the URL. Without this
 * class (including when JS is disabled) the page renders as a static layout.
 */
const motionScript = `(function(){try{
var d=document.documentElement;
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var c=navigator.connection;var save=!!(c&&c.saveData);
var off=/[?&]motion=off\\b/.test(location.search);
var lowEnd=(navigator.deviceMemory&&navigator.deviceMemory<2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<3);
if(!reduce&&!save&&!off&&!lowEnd)d.classList.add('motion');
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
