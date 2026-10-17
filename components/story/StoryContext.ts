"use client";

import { createContext, useContext } from "react";
import type { gsap } from "gsap";

/**
 * A scene adds its tweens to the master timeline. The timeline is
 * normalised so that position 0 = start of the pinned section and
 * position 1 = the moment the pin releases.
 */
export type SceneBuilder = (timeline: gsap.core.Timeline) => void;

export type StoryContextValue = {
  register: (builder: SceneBuilder) => () => void;
};

export const StoryContext = createContext<StoryContextValue | null>(null);

export function useStory(): StoryContextValue {
  const ctx = useContext(StoryContext);
  if (!ctx) throw new Error("<Scene> must be rendered inside <ScrollVideoSection>.");
  return ctx;
}
