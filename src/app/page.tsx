import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { CreativeCards } from "@/components/creative-cards";
import { PortraitSwitch } from "@/components/portrait-switch";
import { SaasCards } from "@/components/saas-cards";
import { ServiceCards } from "@/components/service-cards";
import { SiteNav } from "@/components/site-nav";
import { SocialLinks } from "@/components/social-links";
import type { SectionId } from "@/lib/sections";

const NAME = "Max Winter-Leinweber";
const ROLE = "Founder of Scryptic";

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
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-svh lg:w-80 lg:shrink-0 lg:flex-col lg:border-r lg:border-neutral-200 lg:px-12 lg:py-14">
        <a
          href="#about"
          className="font-serif text-[1.75rem] leading-none text-neutral-900"
        >
          {NAME}
        </a>
        <p className="mt-2 text-[15px] text-neutral-500">{ROLE}</p>

        <div className="mt-12">
          <SiteNav />
        </div>

        <Colophon className="mt-auto" />
      </aside>

      <div className="min-w-0 flex-1">
        <header className="px-6 pt-8 sm:px-10 lg:hidden">
          <p className="font-serif text-2xl leading-none text-neutral-900">
            {NAME}
          </p>
          <p className="mt-1.5 text-sm text-neutral-500">{ROLE}</p>
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
                <h1 className="font-serif text-[clamp(3.5rem,7vw,6rem)] leading-[0.95] tracking-tight text-neutral-900">
                  Hey, I&apos;m <em>Max</em>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-neutral-600 md:mx-0 md:text-xl">
                  Full-stack developer and founder of{" "}
                  <strong className="font-semibold text-neutral-900">
                    Scryptic
                  </strong>
                  . I&apos;ve spent five years building software for enterprise
                  clients and startups, and I ship my own SaaS products along
                  the way.
                </p>

                <SocialLinks className="mt-8 justify-center md:justify-start" />

                <a
                  href="#services"
                  className="group mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-neutral-900 px-6 text-base font-medium text-white transition hover:bg-neutral-700 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none"
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
            lede="Outside of work, I make videos and music."
          >
            <CreativeCards />
          </Section>
        </main>

        <footer className="mx-auto max-w-5xl px-6 pb-10 sm:px-10 lg:hidden">
          <Colophon className="border-t border-neutral-200 pt-8" />
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
        <h2 className="font-serif text-4xl leading-tight text-neutral-900 sm:text-5xl">
          {title}
        </h2>
        <p className="mt-3 text-lg text-neutral-500">{lede}</p>
      </div>
      {children}
    </section>
  );
}

function Colophon({ className = "" }: { className?: string }) {
  return (
    <div className={`text-sm ${className}`}>
      <p className="text-neutral-500">Building things on the internet.</p>
      <p className="mt-1 text-neutral-400">
        &copy; {new Date().getFullYear()} {NAME}
      </p>
    </div>
  );
}
