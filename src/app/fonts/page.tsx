import {
  Aldrich,
  Audiowide,
  Bruno_Ace,
  Chakra_Petch,
  Exo_2,
  Grandstander,
  Michroma,
  Orbitron,
  Oxanium,
  Quantico,
  Rajdhani,
  Share_Tech_Mono,
  Space_Grotesk,
  Syncopate,
  Zen_Dots,
} from "next/font/google";

import { FontShowcase, type FontGroup } from "@/components/font-showcase";
import { SpaceBackdrop } from "@/components/space-backdrop";

/*
 * Candidates for the name on the home page, now that the page sits in space.
 * Every one of them loads through next/font, so it is self hosted and can be
 * moved to the home page by changing which font that file imports.
 *
 * Weights are the display weight of each family: the heaviest that still
 * holds its shape at header size, which for most of these squared faces is
 * 700. The ones set at 400 have only that one weight.
 */

const orbitron = Orbitron({ subsets: ["latin"], weight: "700" });
const michroma = Michroma({ subsets: ["latin"], weight: "400" });
const audiowide = Audiowide({ subsets: ["latin"], weight: "400" });
const syncopate = Syncopate({ subsets: ["latin"], weight: "700" });
const brunoAce = Bruno_Ace({ subsets: ["latin"], weight: "400" });
const zenDots = Zen_Dots({ subsets: ["latin"], weight: "400" });

const chakraPetch = Chakra_Petch({ subsets: ["latin"], weight: "700" });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: "700" });
const oxanium = Oxanium({ subsets: ["latin"], weight: "700" });
const quantico = Quantico({ subsets: ["latin"], weight: "700" });
const aldrich = Aldrich({ subsets: ["latin"], weight: "400" });
const shareTechMono = Share_Tech_Mono({ subsets: ["latin"], weight: "400" });

const exo2 = Exo_2({ subsets: ["latin"], weight: "700" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: "700" });

const grandstander = Grandstander({ subsets: ["latin"], weight: "700" });

const groups: FontGroup[] = [
  {
    title: "Nameplate",
    blurb:
      "Display faces. Loud, built for a title and nothing else, and the ones that read as space rather than as tech.",
    samples: [
      {
        name: "Orbitron 700",
        note: "Squared bowls and wide counters. The one everybody means by sci fi.",
        className: orbitron.className,
      },
      {
        name: "Michroma 400",
        note: "Wide and single weight, so it sets a little smaller than the rest. Pure mission patch.",
        className: michroma.className,
      },
      {
        name: "Audiowide 400",
        note: "Chrome and neon. Reads eighties future more than deep space.",
        className: audiowide.className,
      },
      {
        name: "Syncopate 700",
        note: "Airy and letterspaced. Calm and expensive rather than fast.",
        className: syncopate.className,
      },
      {
        name: "Bruno Ace 400",
        note: "Geometric with a flick on the terminals. Already looks like a logotype.",
        className: brunoAce.className,
      },
      {
        name: "Zen Dots 400",
        note: "Rounded robot lettering. Keeps some of the warmth Grandstander has.",
        className: zenDots.className,
      },
    ],
  },
  {
    title: "Instrument panel",
    blurb:
      "Technical faces off a readout or a HUD. Sharper, narrower, and they carry into the smaller text on the page if you ever want the whole site to match.",
    samples: [
      {
        name: "Chakra Petch 700",
        note: "Clipped corners and tight joints. Cockpit display.",
        className: chakraPetch.className,
      },
      {
        name: "Rajdhani 700",
        note: "Condensed, so the name sets larger here than anything else on the page.",
        className: rajdhani.className,
      },
      {
        name: "Oxanium 700",
        note: "Angular but soft cornered. Console gaming rather than military.",
        className: oxanium.className,
      },
      {
        name: "Quantico 700",
        note: "Squared and compact, with a stencil edge to it.",
        className: quantico.className,
      },
      {
        name: "Aldrich 400",
        note: "Even and machined. The quietest of the technical set.",
        className: aldrich.className,
      },
      {
        name: "Share Tech Mono 400",
        note: "Monospaced telemetry. Every letter on its own grid slot.",
        className: shareTechMono.className,
      },
    ],
  },
  {
    title: "Quietly future",
    blurb:
      "Modern faces that lean forward without dressing up. These stay readable as a person's name, which the nameplates give up on.",
    samples: [
      {
        name: "Exo 2 700",
        note: "Smooth futurism. Sci fi at a distance, a normal name up close.",
        className: exo2.className,
      },
      {
        name: "Space Grotesk 700",
        note: "Spacey by association only. Would sit well with the rest of the page as it stands.",
        className: spaceGrotesk.className,
      },
    ],
  },
  {
    title: "Where it stands now",
    blurb: "The current header, for the comparison.",
    samples: [
      {
        name: "Grandstander 700",
        note: "Rounded and friendly. Reads playful rather than spacey.",
        className: grandstander.className,
      },
    ],
  },
];

export default function FontsPage() {
  return (
    <>
      <SpaceBackdrop />
      <FontShowcase groups={groups} />
    </>
  );
}
