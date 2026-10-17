import { brand, nav } from "@/lib/content";

export function SiteHeader() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-bone focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
      >
        Skip to content
      </a>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-5 md:px-10 md:py-7">
          <a
            href="#film"
            className="pointer-events-auto shrink-0 font-display text-base tracking-tight text-bone sm:text-lg md:text-xl"
            aria-label={`${brand.name}, back to top`}
          >
            {brand.name}
          </a>
          <nav aria-label="Primary" className="pointer-events-auto">
            <ul className="flex items-center gap-4 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-bone/80 sm:gap-6 sm:text-[0.68rem] sm:tracking-eyebrow md:gap-10">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="relative py-2 transition-colors duration-300 hover:text-bone after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 hover:after:scale-x-100"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
