import { Scene } from "@/components/story/Scene";
import { SplitText } from "@/components/story/SplitText";
import { features } from "@/lib/content";

export function FeaturesScene() {
  return (
    <Scene
      id={features.id}
      start={features.scene.start}
      end={features.scene.end}
      label={features.eyebrow}
      stagger={0.01}
      className="flex items-center overflow-hidden still:py-20 md:still:py-32"
    >
      {/* Dims the film so the panels stay legible */}
      <div aria-hidden="true" data-reveal="fade" className="pointer-events-none absolute inset-0 bg-ink/60 still:hidden" />

      {/* Decorative parallax numerals */}
      <span
        aria-hidden="true"
        data-parallax="0.5"
        className="pointer-events-none absolute -right-6 top-[8%] select-none font-display text-[28vw] font-light leading-none text-transparent [-webkit-text-stroke:1px_rgba(94,234,212,0.14)] md:text-[22vw]"
      >
        {"</>"}
      </span>
      <span
        aria-hidden="true"
        data-parallax="-0.3"
        className="pointer-events-none absolute left-[8%] top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-accent/30 to-transparent md:block"
      />

      <div className="relative mx-auto w-full max-w-[1600px] px-5 md:px-10">
        <p className="eyebrow" data-reveal="fade">
          {features.eyebrow}
        </p>
        <h2 data-reveal="chars" className="mt-4 max-w-[14ch] font-display text-display-lg font-light text-bone">
          <SplitText text={features.title} />
        </h2>

        <ol className="mt-10 grid grid-cols-2 border-l border-t border-bone/15 md:mt-16 lg:grid-cols-4">
          {features.items.map((item) => (
            <li
              key={item.index}
              data-reveal="up"
              className="group relative border-b border-r border-bone/15 bg-ink/30 p-4 backdrop-blur-[2px] transition-colors duration-500 hover:bg-ink/50 sm:p-6 md:p-8"
            >
              <span className="font-sans text-[0.65rem] font-medium tracking-eyebrow text-accent">{item.index}</span>
              <h3 className="mt-5 font-display text-lg font-medium text-bone sm:text-2xl md:mt-12 md:text-3xl">
                {item.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-bone/70 sm:text-sm md:mt-3">{item.body}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5 md:mt-5" aria-label={`${item.title} skills`}>
                {item.tags.map((tag) => (
                  <li
                    key={tag}
                    className="border border-accent/25 px-1.5 py-0.5 font-mono text-[0.6rem] text-accent/90 sm:px-2 sm:text-[0.65rem]"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </Scene>
  );
}
