import { FeaturesScene } from "@/components/sections/FeaturesScene";
import { FinalScene } from "@/components/sections/FinalScene";
import { HeroScene } from "@/components/sections/HeroScene";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { StoryScene } from "@/components/sections/StoryScene";
import { ScrollVideoSection } from "@/components/story/ScrollVideoSection";
import { brand, film, story } from "@/lib/content";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <ScrollVideoSection
          id="film"
          label={`${brand.name}: the story behind the collection`}
          src={film.sources}
          poster={film.poster}
          scrollLength={film.scrollLength}
          smoothing={film.smoothing}
          scrub={film.scrub}
          videoRange={film.videoRange}
          fadeOutRange={film.fadeOutRange}
        >
          <HeroScene />
          {story.map((block, i) => (
            <StoryScene key={block.title} block={block} index={i} />
          ))}
          <FeaturesScene />
        </ScrollVideoSection>

        <FinalScene />
      </main>
      <SiteFooter />
    </>
  );
}
