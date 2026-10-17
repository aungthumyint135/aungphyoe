/**
 * Framework-agnostic controller that maps a 0–1 progress value onto a
 * paused <video>'s timeline. The video never plays on its own; every frame
 * shown is the result of setting `currentTime` from scroll progress.
 *
 * - Waits for `loadedmetadata` before using the duration.
 * - Eases toward the target time with a requestAnimationFrame loop that
 *   stops itself once settled (no work while the user isn't scrolling).
 * - Never issues a new seek while one is in flight (`video.seeking`), so
 *   fast scrolling can't queue up hundreds of seeks.
 * - Loads the file into a Blob URL when possible: the whole clip is then
 *   in memory and seeks are near-instant instead of waiting on range requests.
 */

export type VideoSource = {
  src: string;
  /** MIME type, e.g. "video/mp4" or 'video/webm; codecs="vp9"' */
  type: string;
  /** Optional media query, e.g. "(max-width: 767px)" */
  media?: string;
};

export type VideoState = "idle" | "loading" | "ready" | "error";

export type ScrubberOptions = {
  sources: VideoSource[];
  /** 0–1. Fraction of the remaining distance covered per 60fps frame. 1 = no easing. */
  smoothing?: number;
  /** Fetch the file into memory for instant seeking (default true). */
  preferBlob?: boolean;
  onStateChange?: (state: VideoState, detail?: string) => void;
};

export type VideoScrubber = {
  /** Set the target position, 0 = first frame, 1 = last frame. */
  setProgress: (progress: number) => void;
  destroy: () => void;
};

const SETTLE_EPSILON = 0.002; // seconds
const SEEK_EPSILON = 0.001; // seconds
const END_PADDING = 0.04; // stay just before the end; some browsers show black on the final timestamp

export function inferVideoType(src: string): string {
  const ext = src.split("?")[0].split(".").pop()?.toLowerCase();
  if (ext === "webm") return "video/webm";
  if (ext === "mov") return "video/quicktime";
  if (ext === "ogv" || ext === "ogg") return "video/ogg";
  return "video/mp4";
}

/** First source whose media query matches and whose type the browser can decode. */
export function pickSource(video: HTMLVideoElement, sources: VideoSource[]): VideoSource | null {
  for (const source of sources) {
    if (source.media && !window.matchMedia(source.media).matches) continue;
    if (video.canPlayType(source.type) !== "") return source;
  }
  return null;
}

function isIOS(): boolean {
  return (
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function createVideoScrubber(video: HTMLVideoElement, options: ScrubberOptions): VideoScrubber {
  const { sources, smoothing = 0.18, preferBlob = true, onStateChange } = options;

  let duration = 0;
  let target = 0; // 0–1
  let current = 0; // seconds
  let raf = 0;
  let lastTick = 0;
  let destroyed = false;
  let objectUrl: string | null = null;
  const abort = new AbortController();

  const setState = (state: VideoState, detail?: string) => {
    if (!destroyed) onStateChange?.(state, detail);
  };

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.autoplay = false;
  video.loop = false;
  video.pause();

  const tick = (now: number) => {
    raf = 0;
    if (destroyed || !duration) return;

    // Frame-rate independent easing: `smoothing` is calibrated for 60fps.
    // After a long stall (tab in background, slow device) jump straight there.
    const dt = lastTick ? now - lastTick : 16.7;
    lastTick = now;
    const alpha = dt > 250 ? 1 : 1 - Math.pow(1 - smoothing, dt / 16.7);

    const goal = target * Math.max(0, duration - END_PADDING);
    current += (goal - current) * alpha;
    if (Math.abs(goal - current) < SETTLE_EPSILON) current = goal;

    if (!video.seeking && Math.abs(video.currentTime - current) > SEEK_EPSILON) {
      video.currentTime = current;
    }

    // Keep looping until we've settled AND the last seek has landed.
    if (current !== goal || video.seeking || Math.abs(video.currentTime - goal) > SEEK_EPSILON) {
      raf = requestAnimationFrame(tick);
    } else {
      lastTick = 0;
    }
  };

  const schedule = () => {
    if (!raf && !destroyed) raf = requestAnimationFrame(tick);
  };

  const onLoadedMetadata = () => {
    const d = video.duration;
    if (!Number.isFinite(d) || d <= 0) {
      setState("error", "Video duration is unavailable");
      return;
    }
    duration = d;
    // Jump straight to the right frame on load (no easing from 0).
    current = target * Math.max(0, duration - END_PADDING);
    video.currentTime = current;
  };

  const onLoadedData = () => setState("ready");

  const onError = () => {
    const code = video.error?.code;
    const reason =
      code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
        ? "Video format not supported or file missing"
        : code === MediaError.MEDIA_ERR_NETWORK
          ? "Network error while loading video"
          : code === MediaError.MEDIA_ERR_DECODE
            ? "Video could not be decoded"
            : "Video failed to load";
    setState("error", reason);
  };

  // Seeks finishing can leave us one step behind; resume the loop.
  const onSeeked = () => schedule();

  // Some browsers refuse to paint the result of a seek on a video that has
  // never played. Ask iOS to play+pause once, inside the user's first touch.
  const onFirstTouch = () => {
    const p = video.play();
    if (p) {
      p.then(() => {
        video.pause();
        schedule();
      }).catch(() => {
        /* ignored: seeking still works on most devices */
      });
    } else {
      video.pause();
    }
  };

  video.addEventListener("loadedmetadata", onLoadedMetadata);
  video.addEventListener("loadeddata", onLoadedData);
  video.addEventListener("error", onError);
  video.addEventListener("seeked", onSeeked);

  const ios = isIOS();
  if (ios) window.addEventListener("touchstart", onFirstTouch, { once: true, passive: true });

  const source = pickSource(video, sources);

  const load = async (src: string) => {
    setState("loading");
    video.preload = "auto";

    if (preferBlob && typeof fetch === "function" && typeof URL.createObjectURL === "function") {
      try {
        const res = await fetch(src, { signal: abort.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (destroyed) return;
        objectUrl = URL.createObjectURL(blob);
        video.src = objectUrl;
        video.load();
        return;
      } catch (err) {
        if (destroyed || abort.signal.aborted) return;
        if (err instanceof Error && /^HTTP 404/.test(err.message)) {
          setState("error", `Video not found: ${src}`);
          return;
        }
        // Fall through to streaming the file directly (e.g. CORS-restricted CDN).
      }
    }

    video.src = src;
    video.load();
  };

  if (!source) {
    queueMicrotask(() => setState("error", "No playable video source for this browser"));
  } else {
    void load(source.src);
  }

  return {
    setProgress(progress: number) {
      target = Math.min(1, Math.max(0, progress));
      schedule();
    },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      abort.abort();
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("error", onError);
      video.removeEventListener("seeked", onSeeked);
      if (ios) window.removeEventListener("touchstart", onFirstTouch);
      video.pause();
      video.removeAttribute("src");
      video.load(); // releases the decoder and buffered data
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    },
  };
}
