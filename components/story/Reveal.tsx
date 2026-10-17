"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { hiddenVars, restVarsFor } from "@/lib/reveal";
import { useIsoLayoutEffect } from "@/lib/useIsoLayoutEffect";
import { useMotionEnabled } from "@/lib/useMotionEnabled";

type RevealProps = {
  as?: ElementType;
  id?: string;
  className?: string;
  /** ScrollTrigger start, e.g. "top 75%". */
  start?: string;
  /** Seconds between items. */
  stagger?: number;
  children: ReactNode;
  "aria-labelledby"?: string;
};

/**
 * Reveal group for normal-flow sections (outside the pinned stage).
 * Animates each `data-reveal` descendant in when the group scrolls into view
 * and reverses when scrolling back above it. Parallax via `data-parallax`.
 */
export function Reveal({
  as: Tag = "div",
  id,
  className,
  start = "top 75%",
  stagger = 0.09,
  children,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const motion = useMotionEnabled();

  useIsoLayoutEffect(() => {
    const root = ref.current;
    if (!root || !motion) return;

    const ctx = gsap.context(() => {
      const items = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
      const tl = gsap.timeline({
        paused: true,
        defaults: { duration: 1.1, ease: "power3.out" },
      });

      items.forEach((item, i) => {
        const at = i * stagger;
        if (item.dataset.reveal === "chars") {
          const chars = item.querySelectorAll<HTMLElement>("[data-char]");
          tl.fromTo(item, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, at);
          tl.fromTo(chars, { yPercent: 115, rotate: 4 }, { yPercent: 0, rotate: 0, stagger: 0.025 }, at);
        } else {
          tl.fromTo(item, hiddenVars(item), restVarsFor(item), at);
        }
      });

      ScrollTrigger.create({
        trigger: root,
        start,
        onEnter: () => tl.play(),
        onLeaveBack: () => tl.reverse(),
      });

      root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((item) => {
        const speed = Number(item.dataset.parallax) || 0.2;
        gsap.fromTo(
          item,
          { yPercent: speed * 60 },
          {
            yPercent: -speed * 60,
            ease: "none",
            scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
          }
        );
      });
    }, root);

    return () => ctx.revert();
  }, [motion, start, stagger]);

  return (
    <Tag ref={ref} id={id} className={className} {...rest}>
      {children}
    </Tag>
  );
}
