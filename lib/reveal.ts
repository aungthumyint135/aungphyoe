"use client";

import type { gsap } from "gsap";

/**
 * Reveal presets. Put `data-reveal="<effect>"` on any element inside a
 * <Scene> or <Reveal> group and it animates in (and out) with that effect.
 */
export type RevealEffect = "fade" | "up" | "down" | "left" | "right" | "scale" | "blur" | "chars";

type Vars = gsap.TweenVars;

const HIDDEN: Record<Exclude<RevealEffect, "chars">, Vars> = {
  fade: { autoAlpha: 0 },
  up: { autoAlpha: 0, y: 56 },
  down: { autoAlpha: 0, y: -56 },
  left: { autoAlpha: 0, x: -72 },
  right: { autoAlpha: 0, x: 72 },
  scale: { autoAlpha: 0, scale: 0.92 },
  blur: { autoAlpha: 0, filter: "blur(18px)", scale: 1.04 },
};

/** Where an element goes when its scene ends. Mostly continues the motion "through". */
const EXIT: Record<RevealEffect, Vars> = {
  fade: { autoAlpha: 0 },
  up: { autoAlpha: 0, y: -40 },
  down: { autoAlpha: 0, y: 40 },
  left: { autoAlpha: 0, x: 48 },
  right: { autoAlpha: 0, x: -48 },
  scale: { autoAlpha: 0, scale: 1.04 },
  blur: { autoAlpha: 0, filter: "blur(14px)" },
  chars: { autoAlpha: 0, y: -32 },
};

const NEUTRAL: Vars = { autoAlpha: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" };

/** Resting values for exactly the properties an effect touches. */
function restFor(vars: Vars): Vars {
  const rest: Vars = {};
  for (const key of Object.keys(vars)) rest[key] = NEUTRAL[key];
  return rest;
}

export function effectOf(el: HTMLElement): RevealEffect {
  const value = el.dataset.reveal as RevealEffect | undefined;
  return value && (value in EXIT) ? value : "up";
}

/**
 * Adds an enter tween for `el` to `tl` at `at`. Uses fromTo with explicit
 * start values so scrubbing backwards always returns to the exact hidden
 * state (no flashes, no stale inline styles).
 */
export function addEnter(tl: gsap.core.Timeline, el: HTMLElement, at: number, duration: number) {
  const effect = effectOf(el);

  if (effect === "chars") {
    const chars = el.querySelectorAll<HTMLElement>("[data-char]");
    tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: duration * 0.2, ease: "none" }, at);
    if (chars.length) {
      tl.fromTo(
        chars,
        { yPercent: 115, rotate: 4 },
        {
          yPercent: 0,
          rotate: 0,
          duration: duration * 0.75,
          ease: "power3.out",
          stagger: { amount: duration * 0.6 },
        },
        at
      );
    }
    return;
  }

  const from = HIDDEN[effect];
  tl.fromTo(el, from, { ...restFor(from), duration, ease: "power2.out" }, at);
}

/** Adds an exit tween. Starts from the resting state so reverse scrubbing is exact. */
export function addExit(tl: gsap.core.Timeline, el: HTMLElement, at: number, duration: number) {
  const to = EXIT[effectOf(el)];
  tl.fromTo(el, restFor(to), { ...to, duration, ease: "power2.in", immediateRender: false }, at);
}

/** Initial (hidden) vars for non-scrubbed reveals. */
export function hiddenVars(el: HTMLElement): Vars {
  const effect = effectOf(el);
  return effect === "chars" ? { autoAlpha: 0 } : HIDDEN[effect];
}

export function restVarsFor(el: HTMLElement): Vars {
  return restFor(hiddenVars(el));
}
