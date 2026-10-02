import { Orbitron } from "next/font/google";

import { GlassCard } from "@/components/glass-card";
import { SaasCards } from "@/components/saas-cards";
import { ServiceCards } from "@/components/service-cards";
import { SocialCards } from "@/components/social-cards";

const orbitron = Orbitron({ subsets: ["latin"], weight: "800" });

/*
 * The name cut into the glass rather than sitting on it: a hairline of white
 * along the bottom of each letter and a fainter dark one along the top, which
 * is how a letter engraved into a pane catches light coming from above it.
 *
 * What it is for is the clear end of the slider. The name and the heading over
 * the builds are the only text on the card that sits on bare glass, so at 0.4
 * fill they are read against whatever the cloud is doing behind them, and that
 * is not a fixed background but a swinging one: black on the plate measures
 * about 3.5:1 where the empty sky passes behind and about 11.6:1 where a lit
 * filament does. The hairlines put a value break hard against the edge of every
 * stroke, so the letter has an edge of its own to be read by wherever the cloud
 * happens to be.
 *
 * It also needs no wiring to the slider, because it cancels itself: at the
 * frosted end the pane is 0.96 white, a white hairline against that has
 * nothing to show, and what is left is black on near white.
 */
const ETCHED = "0 1px 0 rgb(255 255 255 / 0.9), 0 -1px 0 rgb(10 4 40 / 0.18)";

/*
 * What the card says, as opposed to what it is made of. The glass and the light
 * on it are both in GlassCard; everything here is the name and the three groups
 * of cards, which stay rendered on the server since none of this changes once
 * it is drawn.
 */

/*
 * The two headings over the groups below the social row, cut into the glass
 * the same way the name is, and for the same reason: they sit on bare glass
 * with the cloud swinging behind them, so they need the hairlines to hold an
 * edge. Sized at about three quarters of the name, which keeps them clearly
 * under it while carrying more weight over the titles on the cards beneath, and
 * tracked a little wider because Orbitron's counters close up as it comes down
 * in size. Even at the cap the longer of the two still fits the column with air
 * at both ends: twenty one characters against the name's twenty, but at three
 * quarters the size, so about three quarters of the width the name takes.
 */
const SECTION_HEADING = `${orbitron.className} mb-3 text-center text-[min(3rem,5.4cqi)] leading-tight tracking-[0.04em] text-neutral-900 md:mb-4`;

/*
 * The room above each of the two groups. On the wide layout the card is the
 * window, and the whole of it, name to last card, is meant to be in view at
 * once rather than scrolled to, so the gap is measured off the window's height
 * and comes in on a short one: four hundredths of the window, between a floor
 * that keeps the groups readable as groups and a cap that stops a tall display
 * from spreading them out again. Measured against a 48px tile and 8px between
 * cards, the floor is still twice the gap within a group, which is what keeps
 * the heading reading as the start of something new rather than another card.
 */
const SECTION_GAP = "mt-[clamp(1.5rem,4svh,2.5rem)]";

export function LeftCard() {
  return (
    <GlassCard>
      {/* The name is set on one line at any width: "Max Winter-Leinweber" in
          Orbitron 800 at this tracking measures 13.06 times its own font size,
          i.e. it exactly fills the column at 7.66cqi, so 7.15cqi fits it with a
          little air at both ends. The margin is wider than the arithmetic needs
          because glyph advances round to whole pixels as the line is laid out,
          which swells it by a few percent at the smaller sizes and would
          otherwise put the last letter on the padding. Both numbers are down
          from the 7.8 and 7.3 that 700 at no extra tracking was set at, and
          only because the line is 1.9% longer now, not because the name is
          meant to be smaller. Orbitron is a wide face, so this is smaller than
          Grandstander's 9cqi set it at, and it is the letters being wider
          rather than the name being smaller. The cap stops it growing without
          limit on very wide displays. */}
      <h1
        className={`${orbitron.className} text-[min(5rem,7.15cqi)] leading-tight tracking-[0.01em] whitespace-nowrap text-neutral-900`}
        style={{ textShadow: ETCHED }}
      >
        Max Winter-Leinweber
      </h1>

      {/* The social row sits close under the name, so the two read as one
          header: the name, and the handles it goes by. Only enough room is
          left for the carve's hairline above the pills to clear the name's
          descenders. */}
      <div className="mt-4 w-full">
        <SocialCards />
      </div>

      {/* The projects sit close under the social row: far enough off it that
          the heading reads as the start of a new group rather than a caption
          on the pills, and no further, since every pixel between the two is a
          pixel the last card below has to find at the bottom of the window. */}
      <div className={`${SECTION_GAP} w-full`}>
        <h2 className={SECTION_HEADING} style={{ textShadow: ETCHED }}>
          SaaS Projects
        </h2>
        <SaasCards />
      </div>

      {/* The services are held the same distance off the projects as the
          projects are off the social row, so the groups fall down the card at
          one steady beat. */}
      <div className={`${SECTION_GAP} w-full`}>
        <h2 className={SECTION_HEADING} style={{ textShadow: ETCHED }}>
          Professional Services
        </h2>
        <ServiceCards />
      </div>
    </GlassCard>
  );
}
