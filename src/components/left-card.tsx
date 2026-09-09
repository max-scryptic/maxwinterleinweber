import { Orbitron } from "next/font/google";

import { GlassCard } from "@/components/glass-card";
import { SaasCards } from "@/components/saas-cards";
import { SocialCards } from "@/components/social-cards";

const orbitron = Orbitron({ subsets: ["latin"], weight: "700" });

/*
 * What the card says, as opposed to what it is made of. The glass and the light
 * on it are both in GlassCard; everything here is the name and the two groups
 * of cards, which stay rendered on the server since none of this changes once
 * it is drawn.
 */
export function LeftCard() {
  return (
    <GlassCard>
      {/* The name is set on one line at any width: "Max Winter-Leinweber" in
          Orbitron 700 measures 12.8% of its own font size per character of
          column width, i.e. it exactly fills the column at 7.8cqi, so 7.3cqi
          fits it with a little air at both ends. The margin is wider than the
          arithmetic needs because glyph advances round to whole pixels as the
          line is laid out, which swells it by a few percent at the smaller
          sizes and would otherwise put the last letter on the padding.
          Orbitron is a wide face, so this is smaller than Grandstander's 9cqi
          set it at, and it is the letters being wider rather than the name
          being smaller. The cap stops it growing without limit on very wide
          displays. */}
      <h1
        className={`${orbitron.className} text-[min(5rem,7.3cqi)] leading-tight whitespace-nowrap text-neutral-900`}
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
