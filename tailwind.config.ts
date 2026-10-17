import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#04080c",
          900: "#04080c",
          800: "#0a1219",
          700: "#111d27",
        },
        bone: {
          DEFAULT: "#e4eef2",
          muted: "#a7b8c2",
          dim: "#6f8390",
        },
        accent: {
          DEFAULT: "#5eead4",
          deep: "#22d3ee",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(3rem, 8vw, 8.5rem)", { lineHeight: "0.95", letterSpacing: "-0.04em" }],
        "display-lg": ["clamp(2.5rem, 6vw, 6rem)", { lineHeight: "0.98", letterSpacing: "-0.025em" }],
        "display-md": ["clamp(2rem, 4vw, 3.75rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
      },
      letterSpacing: {
        eyebrow: "0.28em",
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      // `cine:` applies when scroll-driven storytelling is active (html.motion).
      // `still:` applies in the static fallback (reduced motion, save-data, no JS).
      addVariant("cine", ".motion &");
      addVariant("still", "html:not(.motion) &");
    }),
  ],
};

export default config;
