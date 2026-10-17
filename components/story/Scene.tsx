"use client";

import { useRef, type ReactNode } from "react";
import { addEnter, addExit } from "@/lib/reveal";
import { useIsoLayoutEffect } from "@/lib/useIsoLayoutEffect";
import { useStory } from "./StoryContext";

export type SceneProps = {
  /** Pinned progress (0–1) at which this scene starts entering. */
  start: number;
  /** Pinned progress (0–1) at which this scene has fully left. */
  end: number;
  /** Visible at progress 0 (e.g. the hero). Skips the enter animation. */
  initial?: boolean;
  /** Stay on screen until the pin releases. Skips the exit animation. */
  hold?: boolean;
  /** Progress between successive `data-reveal` items entering. */
  stagger?: number;
  enterDuration?: number;
  exitDuration?: number;
  id?: string;
  label?: string;
  className?: string;
  children: ReactNode;
};

/**
 * A layer of foreground content inside <ScrollVideoSection>.
 *
 * Every descendant with `data-reveal="up|down|left|right|fade|scale|blur|chars"`
 * enters in DOM order starting at `start` and exits just before `end`.
 * Descendants with `data-parallax="<speed>"` drift vertically for the whole
 * lifetime of the scene (decorative elements).
 *
 * With motion disabled the scene renders as a normal block in document flow.
 */
export function Scene({
  start,
  end,
  initial = false,
  hold = false,
  stagger = 0.012,
  enterDuration = 0.05,
  exitDuration = 0.035,
  id,
  label,
  className = "",
  children,
}: SceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { register } = useStory();

  useIsoLayoutEffect(() => {
    return register((tl) => {
      const el = ref.current;
      if (!el) return;

      const items = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]"));
      const parallax = Array.from(el.querySelectorAll<HTMLElement>("[data-parallax]"));

      // In-page links land where every item has finished entering.
      const revealed = initial ? start : start + Math.max(0, items.length - 1) * stagger + enterDuration;
      el.dataset.sceneFocus = Math.min(hold ? 1 : end - exitDuration, revealed + 0.01).toFixed(4);

      // Visibility gates interaction: hidden scenes can't be clicked or focused.
      if (!initial) tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, start);

      if (!initial) {
        items.forEach((item, i) => addEnter(tl, item, start + i * stagger, enterDuration));
      }

      if (!hold) {
        const exitAt = end - exitDuration;
        items.forEach((item, i) => addExit(tl, item, exitAt + i * stagger * 0.25, exitDuration * 0.75));
        tl.fromTo(el, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.001, immediateRender: false }, end);
      }

      parallax.forEach((item) => {
        const speed = Number(item.dataset.parallax) || 0.2;
        tl.fromTo(
          item,
          { yPercent: speed * 60 },
          { yPercent: -speed * 60, duration: (hold ? 1 : end) - start, ease: "none" },
          start
        );
      });
    });
  }, [register, start, end, initial, hold, stagger, enterDuration, exitDuration]);

  return (
    <div
      ref={ref}
      id={id}
      aria-label={label}
      role={label ? "group" : undefined}
      tabIndex={id ? -1 : undefined}
      data-scene
      data-scene-initial={initial ? "" : undefined}
      data-scene-focus={((start + end) / 2).toFixed(4)}
      className={`outline-none still:relative cine:absolute cine:inset-0 ${className}`}
    >
      {children}
    </div>
  );
}
