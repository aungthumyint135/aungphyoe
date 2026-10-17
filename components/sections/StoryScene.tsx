import Image from "next/image";
import { Scene } from "@/components/story/Scene";
import { SplitText } from "@/components/story/SplitText";
import type { StoryBlock } from "@/lib/content";

const BODY_EFFECT = { left: "left", right: "right" } as const;

export function StoryScene({ block, index }: { block: StoryBlock; index: number }) {
  const textLeft = block.align === "left";

  return (
    <Scene
      id={block.id}
      start={block.scene.start}
      end={block.scene.end}
      label={block.eyebrow}
      className="flex items-center still:py-20 md:still:py-32"
    >
      {/* Readability scrim on the text side, fades in with the scene */}
      <div
        aria-hidden="true"
        data-reveal="fade"
        className={`pointer-events-none absolute inset-y-0 w-full md:w-2/3 still:hidden ${
          textLeft
            ? "left-0 bg-gradient-to-r from-ink/80 via-ink/40 to-transparent"
            : "right-0 bg-gradient-to-l from-ink/80 via-ink/40 to-transparent"
        }`}
      />

      <div className="relative mx-auto grid w-full max-w-[1600px] grid-cols-12 items-center gap-y-10 px-5 md:gap-x-10 md:px-10">
        <div
          className={`col-span-12 md:col-span-6 lg:col-span-5 ${
            textLeft ? "md:col-start-1" : "md:col-start-7 lg:col-start-8"
          } md:row-start-1`}
        >
          <p className="eyebrow" data-reveal="fade">
            {block.eyebrow}
          </p>
          <h2
            data-reveal={block.effect}
            className="mt-5 font-display text-display-md font-light text-bone text-shadow-soft"
          >
            {block.effect === "chars" ? <SplitText text={block.title} by="words" /> : block.title}
          </h2>
          <div className="mt-8 max-w-[4rem]" data-reveal={BODY_EFFECT[block.align]}>
            <div className="h-px bg-accent/70" />
          </div>
          <p
            data-reveal="up"
            className="mt-8 max-w-md text-base leading-relaxed text-bone/80 text-shadow-soft md:text-lg"
          >
            {block.body}
          </p>
          <ul data-reveal="up" className="mt-6 flex max-w-md flex-wrap gap-2" aria-label="Skills">
            {block.tags.map((tag) => (
              <li
                key={tag}
                className="border border-accent/30 bg-ink/40 px-2.5 py-1 font-mono text-[0.68rem] text-accent backdrop-blur-sm"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>

        <figure
          data-reveal="scale"
          className={`relative col-span-8 col-start-3 aspect-[4/5] overflow-hidden border border-bone/10 sm:col-span-6 sm:col-start-4 md:col-span-4 md:row-start-1 cine:max-md:hidden ${
            textLeft ? "md:col-start-9" : "md:col-start-2"
          }`}
        >
          <div data-parallax="0.12" className="absolute inset-x-0 -inset-y-[10%]">
            <Image
              src={block.image.src}
              alt={block.image.alt}
              fill
              sizes="(min-width: 768px) 33vw, 70vw"
              className="object-cover"
            />
          </div>
          <figcaption className="absolute bottom-0 left-0 bg-ink/70 px-3 py-2 text-[0.6rem] uppercase tracking-eyebrow text-bone/70 backdrop-blur-sm">
            Fig. {String(index + 1).padStart(2, "0")}
          </figcaption>
        </figure>
      </div>
    </Scene>
  );
}
