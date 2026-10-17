import { Scene } from "@/components/story/Scene";
import { hero } from "@/lib/content";

export function HeroScene() {
  return (
    <Scene
      initial
      start={hero.scene.start}
      end={hero.scene.end}
      className="flex flex-col justify-end still:min-h-[100svh]"
    >
      <div className="mx-auto w-full max-w-[1600px] px-5 pb-20 md:px-10 md:pb-24">
        <p className="eyebrow text-shadow-soft" data-reveal="up">
          {hero.eyebrow}
        </p>
        <h1
          data-reveal="blur"
          className="mt-5 max-w-[11ch] font-display text-display-xl font-light text-bone text-shadow-soft md:mt-7"
        >
          {hero.title} <em className="font-normal not-italic text-accent">{hero.titleAccent}</em>
        </h1>

        <div className="mt-8 flex flex-col gap-10 md:mt-12 md:flex-row md:items-end md:justify-between">
          <p data-reveal="up" className="max-w-md text-base leading-relaxed text-bone/80 text-shadow-soft md:text-lg">
            {hero.subtitle}
          </p>

          <a
            href="#story"
            data-reveal="fade"
            className="group flex items-center gap-4 self-start text-[0.68rem] font-medium uppercase tracking-eyebrow text-bone/80 hover:text-bone md:self-auto"
          >
            <span className="relative block h-12 w-px overflow-hidden bg-bone/20" aria-hidden="true">
              <span className="animate-scroll-cue absolute inset-0 bg-bone" />
            </span>
            Scroll to explore
          </a>
        </div>
      </div>
    </Scene>
  );
}
