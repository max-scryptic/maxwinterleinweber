import { Orbitron } from "next/font/google";

import { SaasCards } from "@/components/saas-cards";
import { SocialCards } from "@/components/social-cards";
import { SpaceBackdrop } from "@/components/space-backdrop";

const orbitron = Orbitron({ subsets: ["latin"], weight: "700" });

export default function Home() {
  return (
    <>
      <SpaceBackdrop />

      {/* The window, exactly: the sky behind is pinned to it, so the page
          cannot be allowed to grow past it and drag the card off the bottom.
          Anything longer than the card scrolls inside the card instead, which
          is also what keeps the 10px of space around it the same 10px all the
          way down.

          Two equal columns from md up, the card on the left and the figure's
          half of the sky left clear on the right. Narrower than that there is
          no room to split the screen, so the card takes the full width and the
          figure is dropped rather than squeezed.

          Nothing here takes the pointer except the card itself: a drag anywhere
          on the right hand side has to reach the canvas underneath to turn the
          figure. */}
      <div className="pointer-events-none relative z-10 grid h-svh grid-cols-1 grid-rows-1 p-[10px] md:grid-cols-2">
        {/* A query container, so the name below can size itself against this
            card's content box rather than the viewport, and keeps fitting if
            the split between the two halves ever changes. */}
        {/* Horizontally centred but top aligned: the name and the cards sit at
            the head of the card and grow downwards, rather than riding up and
            down with the height of the window. */}
        <div className="@container pointer-events-auto flex min-h-0 flex-col items-center justify-start overflow-y-auto overscroll-contain rounded-2xl bg-[#f4f4f4] px-4 pt-10 pb-10 shadow-[0_6px_24px_rgba(0,0,0,0.18)] sm:px-6 md:px-10 md:pt-12 md:pb-10">
          {/* The name is set on one line at any width. In caps, in Orbitron
              700, it measures 15% of its own font size per character of column
              width, i.e. it exactly fills the column at 6.667cqi, so 6.4cqi
              fits it with a little air at both ends. Orbitron is a wide face
              and caps are wider still, so the same column carries the name at
              about two thirds the size Grandstander set it at. The cap stops
              it growing without limit on very wide displays.

              The caps are CSS rather than typed into the text, so the name is
              still spelled normally to anything reading the page rather than
              looking at it. */}
          <h1
            className={`${orbitron.className} text-[min(5rem,6.4cqi)] leading-tight whitespace-nowrap text-neutral-900 uppercase`}
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
        </div>
      </div>
    </>
  );
}
