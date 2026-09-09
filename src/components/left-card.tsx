import { Grandstander } from "next/font/google";

import { GlassCard } from "@/components/glass-card";
import { SaasCards } from "@/components/saas-cards";
import { SocialCards } from "@/components/social-cards";

const grandstander = Grandstander({ subsets: ["latin"], weight: "700" });

/*
 * What the card says, as opposed to what it is made of. The glass, the light on
 * it and the slider that thickens it are all in GlassCard; everything here is
 * the name and the two groups of cards, which stay rendered on the server since
 * none of this changes once it is drawn.
 */
export function LeftCard() {
  return (
    <GlassCard>
      {/* The name is set on one line at any width: "Max Winter-Leinweber" in
          Grandstander 700 measures 9.375% of its own font size per character of
          column width, i.e. it exactly fills the column at 9.375cqi, so 9cqi
          fits it with a little air at both ends. The cap stops it growing
          without limit on very wide displays. */}
      <h1
        className={`${grandstander.className} text-[min(5rem,9cqi)] leading-tight whitespace-nowrap text-neutral-900`}
      >
        Max Winter-Leinweber
      </h1>

      <div className="mt-8 w-full md:mt-10">
        <SocialCards />
      </div>

      {/* The builds sit well clear of the social row, so the two read as
          separate groups rather than one block of cards. */}
      <div className="mt-16 w-full md:mt-20">
        <SaasCards />
      </div>
    </GlassCard>
  );
}
