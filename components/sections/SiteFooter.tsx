import { brand } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="border-t border-bone/10 bg-ink px-5 py-10 md:px-10">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 text-xs text-bone/50 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-base text-bone/80">{brand.name}</p>
        <p>{brand.tagline}</p>
        <p>© {new Date().getFullYear()} {brand.name}</p>
      </div>
    </footer>
  );
}
