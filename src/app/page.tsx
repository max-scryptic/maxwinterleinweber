import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { CreativeCards } from "@/components/creative-cards";
import { MusicPlayer } from "@/components/music-player";
import { PortraitSwitch } from "@/components/portrait-switch";
import { SaasCards } from "@/components/saas-cards";
import { ServiceCards } from "@/components/service-cards";
import { SiteNav } from "@/components/site-nav";
import { SocialLinks } from "@/components/social-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { getTracks } from "@/lib/music";
import type { SectionId } from "@/lib/sections";

const NAME = "Max Winter-Leinweber";
const ROLE = "Chronic creator";

/*
 * One page, read top to bottom: who Max is, then the work he sells, the
 * products he has built, and what he makes outside of both.
 *
 * From lg up the name and the list of sections stand in a column down the left
 * that stays put while the page scrolls past it, so where you are and how to
 * get anywhere else are always in view. Narrower than that there is no width
 * to give a column, so the name heads the page and the sections simply follow
 * one another.
 */
export default function Home() {
  return (
    <div className="flex w-full flex-col lg:flex-row">
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-svh lg:w-80 lg:shrink-0 lg:flex-col lg:border-r lg:border-border lg:px-12 lg:py-14">
        <a
          href="#about"
          className="font-serif text-[1.75rem] leading-none text-foreground"
        >
          {NAME}
        </a>
        <p className="mt-2 text-[15px] text-muted-foreground">{ROLE}</p>

        <div className="mt-12">
          <SiteNav />
        </div>

        <ThemeToggle className="mt-auto" />
        <Colophon className="mt-6" />
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-4 px-6 pt-8 sm:px-10 lg:hidden">
          <div>
            <p className="font-serif text-2xl leading-none text-foreground">
              {NAME}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">{ROLE}</p>
          </div>
          <ThemeToggle />
        </header>

        <main className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-16">
          {/* The introduction has the first screen to itself on a wide
              window, centred in it, with the work starting below the fold. */}
          <section
            id="about"
            className="flex items-center py-14 lg:min-h-svh lg:py-20"
          >
            <div className="grid w-full items-center gap-10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-12 xl:gap-16">
              <PortraitSwitch />

              <div className="text-center md:text-left">
                <h1 className="font-serif text-[clamp(3.5rem,7vw,6rem)] leading-[0.95] tracking-tight text-foreground">
                  Hey, I&apos;m <em>Max</em>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-subtle-foreground md:mx-0 md:text-xl">
                  Full-stack developer and founder of{" "}
                  <strong className="font-semibold text-foreground">
                    Scryptic
                  </strong>
                  . I&apos;ve spent five years building software for enterprise
                  clients and startups, and I ship my own SaaS products along
                  the way.
                </p>

                <SocialLinks className="mt-8 justify-center md:justify-start" />

                <a
                  href="#services"
                  className="group mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-base font-medium text-primary-foreground transition hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
                >
                  View my work
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                  />
                </a>
              </div>
            </div>
          </section>

          <Section
            id="services"
            title="Professional services"
            lede="I build apps for founders through my studio."
          >
            <ServiceCards />
          </Section>

          <Section
            id="projects"
            title="SaaS projects"
            lede="Products I've designed, built and run myself."
          >
            <SaasCards />
          </Section>

          <Section
            id="creative"
            title="Creative"
            lede="Outside of work, I make videos about crypto, gaming and anything else, and music under the alias eutonix."
          >
            <Subheading>Videos</Subheading>
            <CreativeCards />

            <Subheading className="mt-12">Music</Subheading>
            <MusicPlayer tracks={getTracks()} />
          </Section>
        </main>

        <footer className="mx-auto max-w-5xl px-6 pb-10 sm:px-10 lg:hidden">
          <Colophon className="border-t border-border pt-8" />
        </footer>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  lede,
  children,
}: {
  id: SectionId;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="py-16 lg:py-24">
      <div className="mb-10 max-w-2xl">
        <h2 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">
          {title}
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">{lede}</p>
      </div>
      {children}
    </section>
  );
}

// A label over one group within a section, where a section holds more than
// one kind of thing: quieter than the section's own heading, so it reads as a
// division of it rather than a new one.
function Subheading({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <h3
      className={`mb-4 text-xs font-semibold tracking-[0.14em] text-faint-foreground uppercase ${className}`}
    >
      {children}
    </h3>
  );
}

function Colophon({ className = "" }: { className?: string }) {
  return (
    <p className={`text-sm text-faint-foreground ${className}`}>
      &copy; {new Date().getFullYear()} {NAME}
    </p>
  );
}
