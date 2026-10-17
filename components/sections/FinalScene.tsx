import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/story/Reveal";
import { SplitText } from "@/components/story/SplitText";
import { finale } from "@/lib/content";

export function FinalScene() {
  return (
    <Reveal
      as="section"
      id={finale.id}
      aria-labelledby={`${finale.id}-title`}
      className="relative overflow-hidden bg-ink px-5 pb-24 pt-28 md:px-10 md:pb-32 md:pt-40"
    >
      {/* Soft glow continuing the film's light into the page */}
      <div
        aria-hidden="true"
        data-parallax="0.25"
        className="pointer-events-none absolute left-1/2 top-0 h-[60vh] w-[90vw] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(94,234,212,0.12),transparent)]"
      />

      <div className="relative mx-auto grid max-w-[1600px] grid-cols-12 gap-y-10 md:gap-x-10">
        <p className="eyebrow col-span-12" data-reveal="up">
          {finale.eyebrow}
        </p>

        <h2
          id={`${finale.id}-title`}
          data-reveal="chars"
          className="col-span-12 -mt-4 font-display text-display-lg font-light text-bone md:col-span-10 lg:col-span-9"
        >
          <SplitText text={finale.title} />
        </h2>

        <p data-reveal="up" className="col-span-12 max-w-xl text-lg leading-relaxed text-bone/75 md:col-span-6">
          {finale.body}
        </p>

        <div data-reveal="up" className="col-span-12 flex flex-wrap items-center gap-x-8 gap-y-5">
          <a
            href={finale.cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 bg-bone px-7 py-4 text-sm font-medium tracking-wide text-ink transition-colors duration-300 hover:bg-accent"
          >
            {finale.cta.label}
            <ArrowUpRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>
          <a
            href={finale.secondary.href}
            target="_blank"
            rel="noopener noreferrer"
            className="border-b border-bone/30 py-1 text-sm text-bone/80 transition-colors hover:border-bone hover:text-bone"
          >
            {finale.secondary.label}
          </a>
        </div>

        <div data-reveal="fade" className="hairline col-span-12 mt-10 md:mt-16" />

        <dl data-reveal="up" className="col-span-12 grid gap-8 sm:grid-cols-3">
          {finale.details.map((d) => (
            <div key={d.label}>
              <dt className="eyebrow text-bone/50">{d.label}</dt>
              <dd className="mt-3 font-display text-lg font-light text-bone md:text-xl">{d.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Reveal>
  );
}
