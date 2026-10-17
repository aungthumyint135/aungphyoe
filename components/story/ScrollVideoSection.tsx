"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useIsoLayoutEffect } from "@/lib/useIsoLayoutEffect";
import { useMotionEnabled } from "@/lib/useMotionEnabled";
import {
  createVideoScrubber,
  inferVideoType,
  type VideoScrubber,
  type VideoSource,
} from "@/lib/videoScrubber";
import { StoryContext, type SceneBuilder, type StoryContextValue } from "./StoryContext";

export type ScrollVideoSectionProps = {
  /** A single file path ("/videos/hero-video.mp4") or a prioritised list of sources. */
  src: string | VideoSource[];
  /** Shown while the video loads, if it fails, and in the reduced-motion layout. */
  poster: string;
  /** Accessible name for the section landmark. */
  label: string;
  id?: string;
  /** How long the section stays pinned, in viewport heights. */
  scrollLength?: number;
  /** Part of the pinned progress (0–1) that is mapped onto the video's duration. */
  videoRange?: [number, number];
  /** Progress range over which the stage fades to the page background before release. */
  fadeOutRange?: [number, number];
  /** GSAP scrub for foreground scenes: true = locked to scroll, number = seconds of catch-up. */
  scrub?: boolean | number;
  /** 0–1 easing of video seeks. Lower = smoother but laggier. */
  smoothing?: number;
  /** Defer the video download until the section is about one viewport away. */
  lazy?: boolean;
  /** Readability overlay strength. */
  overlay?: "none" | "soft" | "strong";
  children?: ReactNode;
};

const OVERLAYS = {
  none: "",
  soft: "bg-[radial-gradient(ellipse_at_center,rgba(13,11,9,0)_35%,rgba(13,11,9,0.6)_100%)]",
  strong: "bg-[radial-gradient(ellipse_at_center,rgba(13,11,9,0.25)_20%,rgba(13,11,9,0.8)_100%)]",
} as const;

export function ScrollVideoSection({
  src,
  poster,
  label,
  id,
  scrollLength = 6,
  videoRange = [0, 1],
  fadeOutRange,
  scrub = 0.6,
  smoothing = 0.18,
  lazy = false,
  overlay = "soft",
  children,
}: ScrollVideoSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);

  const triggerRef = useRef<ScrollTrigger | null>(null);
  const scrubberRef = useRef<VideoScrubber | null>(null);
  const progressRef = useRef(0);
  const initialHashHandled = useRef(false);

  // Latest videoRange without re-running effects when the array identity changes.
  const videoRangeRef = useRef(videoRange);
  videoRangeRef.current = videoRange;

  const motion = useMotionEnabled();

  const sources = useMemo<VideoSource[]>(
    () => (typeof src === "string" ? [{ src, type: inferVideoType(src) }] : src),
    [JSON.stringify(src)]
  );

  /* ---------------------------------------------------------------
     Scene registry. Scenes register a builder in a layout effect;
     ours runs after theirs (children first), so all builders exist
     on the first build. Late registrations trigger one rebuild.
     --------------------------------------------------------------- */
  const registry = useRef(new Set<SceneBuilder>());
  const builtRef = useRef(false);
  const rebuildFrame = useRef(0);
  const [version, setVersion] = useState(0);

  const storyContext = useMemo<StoryContextValue>(() => {
    const requestRebuild = () => {
      if (!builtRef.current || rebuildFrame.current) return;
      rebuildFrame.current = requestAnimationFrame(() => {
        rebuildFrame.current = 0;
        setVersion((v) => v + 1);
      });
    };
    return {
      register(builder) {
        registry.current.add(builder);
        requestRebuild();
        return () => {
          registry.current.delete(builder);
          requestRebuild();
        };
      },
    };
  }, []);

  useEffect(() => () => cancelAnimationFrame(rebuildFrame.current), []);

  /** Pinned progress (0–1) → video progress (0–1). */
  const toVideoProgress = (p: number) => {
    const [a, b] = videoRangeRef.current;
    return b > a ? Math.min(1, Math.max(0, (p - a) / (b - a))) : 0;
  };

  /** Scroll so that a scene inside the pinned stage is on screen. */
  const scrollToStoryTarget = (target: HTMLElement, behavior: ScrollBehavior) => {
    const st = triggerRef.current;
    const stage = stageRef.current;
    if (!st || !stage || !stage.contains(target)) return false;
    const scene = target.closest<HTMLElement>("[data-scene]");
    const focus = scene ? Number(scene.dataset.sceneFocus ?? 0) : 0;
    window.scrollTo({ top: st.start + (st.end - st.start) * focus, behavior });
    return true;
  };

  /* ---------------------------------------------------------------
     Master timeline + pin. One ScrollTrigger drives both the
     foreground timeline (scrubbed) and the video (raw progress →
     its own eased rAF loop).
     --------------------------------------------------------------- */
  const fadeStart = fadeOutRange?.[0];
  const fadeEnd = fadeOutRange?.[1];

  useIsoLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || motion === null) return;
    if (!motion) {
      stage.dataset.videoState = "static";
      return;
    }

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "none" } });
      timeline.set({}, {}, 1); // normalise: timeline length = 1 = full pin

      registry.current.forEach((build) => build(timeline));

      if (fadeRef.current && fadeStart !== undefined && fadeEnd !== undefined) {
        timeline.fromTo(
          fadeRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: Math.max(0.001, fadeEnd - fadeStart), ease: "power1.inOut" },
          fadeStart
        );
      }

      const sync = (self: ScrollTrigger) => {
        progressRef.current = self.progress;
        scrubberRef.current?.setProgress(toVideoProgress(self.progress));
      };

      triggerRef.current = ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * scrollLength)}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        scrub,
        animation: timeline,
        invalidateOnRefresh: true,
        refreshPriority: 1, // measure the pin before triggers further down the page
        onUpdate: sync,
        onRefresh: sync,
      });
    }, stage);

    builtRef.current = true;
    // A rebuild re-inserts the pin spacer after later triggers were measured.
    if (version > 0) ScrollTrigger.refresh();

    // Webfonts change text metrics → recompute positions once they're in.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    // Deep link (e.g. /#skills) into a pinned scene. Turn off the browser's
    // scroll restoration so a reload doesn't override the jump afterwards.
    if (!initialHashHandled.current && window.location.hash) {
      initialHashHandled.current = true;
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (target && stage.contains(target)) {
        history.scrollRestoration = "manual";
        requestAnimationFrame(() => scrollToStoryTarget(target, "auto"));
      }
    }

    return () => {
      cancelled = true;
      builtRef.current = false;
      triggerRef.current = null;
      ctx.revert(); // kills tweens + ScrollTrigger, removes pin spacer, restores inline styles
    };
  }, [motion, version, scrollLength, scrub, fadeStart, fadeEnd]);

  /* ---------------------------------------------------------------
     Video loading + scrubbing. Only when motion is enabled: the
     static layout never downloads the video.
     --------------------------------------------------------------- */
  useEffect(() => {
    const video = videoRef.current;
    const stage = stageRef.current;
    const section = sectionRef.current;
    if (!video || !stage || !section || !motion) return;

    let scrubber: VideoScrubber | null = null;
    let observer: IntersectionObserver | null = null;

    const start = () => {
      scrubber = createVideoScrubber(video, {
        sources,
        smoothing,
        onStateChange: (state, detail) => {
          stage.dataset.videoState = state;
          if (state === "error") {
            console.warn(`[ScrollVideoSection] ${detail ?? "Video unavailable"} — showing the poster image instead.`);
          }
        },
      });
      scrubberRef.current = scrubber;
      scrubber.setProgress(toVideoProgress(progressRef.current));
    };

    if (lazy && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            observer?.disconnect();
            observer = null;
            start();
          }
        },
        { rootMargin: "100% 0px" }
      );
      observer.observe(section);
    } else {
      start();
    }

    return () => {
      observer?.disconnect();
      scrubber?.destroy();
      scrubberRef.current = null;
      stage.dataset.videoState = "idle";
    };
  }, [motion, sources, smoothing, lazy]);

  /* ---------------------------------------------------------------
     In-page links to scenes inside the pin: native anchors can't
     know where a pinned scene "lives" on the scroll track.
     --------------------------------------------------------------- */
  useEffect(() => {
    if (!motion) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
      if (!link || !link.hash) return;
      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (!target) return;
      if (!scrollToStoryTarget(target, "smooth")) return;
      event.preventDefault();
      history.replaceState(null, "", link.hash);

      // The scene is visibility:hidden until we arrive, so move focus
      // (for keyboard & screen-reader users) once scrolling settles.
      cancelPendingFocus();
      const focusTarget = () => {
        cancelPendingFocus();
        target.focus({ preventScroll: true });
      };
      window.addEventListener("scrollend", focusTarget, { once: true });
      focusTimer = window.setTimeout(focusTarget, 1500); // browsers without `scrollend`
      cancelPendingFocus = () => {
        window.removeEventListener("scrollend", focusTarget);
        window.clearTimeout(focusTimer);
      };
    };
    // Hash changes that don't come from a click (typed URL, back/forward).
    const onHashChange = () => {
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (target) scrollToStoryTarget(target, "auto");
    };
    let focusTimer = 0;
    let cancelPendingFocus = () => {};
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      cancelPendingFocus();
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [motion]);

  return (
    <StoryContext.Provider value={storyContext}>
      <section ref={sectionRef} id={id} aria-label={label} className="relative">
        <div
          ref={stageRef}
          data-video-state="idle"
          className="relative bg-ink cine:h-[100svh] cine:overflow-hidden"
        >
          {/* Background media: decorative, hidden from assistive tech */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[100svh] overflow-hidden cine:inset-0 cine:h-auto"
          >
            <Image src={poster} alt="" fill priority sizes="100vw" className="object-cover" />
            <video
              ref={videoRef}
              data-video-el
              muted
              playsInline
              preload="none"
              disablePictureInPicture
              disableRemotePlayback
              tabIndex={-1}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {overlay !== "none" && <div className={`absolute inset-0 ${OVERLAYS[overlay]}`} />}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 to-transparent still:h-1/2 still:from-ink" />
          </div>

          {/* Fades the stage into the page background right before the pin releases */}
          <div
            ref={fadeRef}
            aria-hidden="true"
            className="pointer-events-none invisible absolute inset-0 z-20 bg-ink opacity-0 still:hidden"
          />

          <div
            data-video-loader
            aria-hidden="true"
            className="pointer-events-none absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 text-[0.65rem] uppercase tracking-eyebrow text-bone/70 still:hidden"
          >
            <span className="relative block h-px w-10 overflow-hidden bg-bone/20">
              <span className="absolute inset-0 animate-pulse bg-bone/70" />
            </span>
            Loading film
          </div>

          {/* Foreground scenes */}
          <div className="relative z-10 cine:absolute cine:inset-0">{children}</div>
        </div>
      </section>
    </StoryContext.Provider>
  );
}
