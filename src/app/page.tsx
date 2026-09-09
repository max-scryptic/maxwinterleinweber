import { Grandstander } from "next/font/google";

import { MannequinViewer } from "@/components/mannequin-viewer";
import { SaasCards } from "@/components/saas-cards";
import { SocialCards } from "@/components/social-cards";

const grandstander = Grandstander({ subsets: ["latin"], weight: "700" });

export default function Home() {
  return (
    // Two equal columns from md up: the name and the cards on the left, the 3D
    // model on the right. Narrower than that there is no room to split the
    // screen, so the left column takes the full width and the model is dropped
    // rather than squeezed.
    <div className="grid flex-1 grid-cols-1 bg-[#f4f4f4] md:grid-cols-2">
      {/* A query container, so the name below can size itself against this
          column's content box rather than the viewport, and keeps fitting if
          the split between the two columns ever changes. */}
      {/* Horizontally centred but top aligned: the name and the cards sit at
          the head of the column and grow downwards, rather than riding up and
          down with the height of the viewport. */}
      <div className="@container flex flex-col items-center justify-start px-4 pt-10 pb-10 sm:px-6 md:px-10 md:pt-12 md:pb-10">
        {/* The name is set on one line at any width: "Max Winter-Leinweber" in
            Grandstander 700 measures 9.375% of its own font size per character
            of column width — i.e. it exactly fills the column at 9.375cqi — so
            9cqi fits it with a little air at both ends. The cap stops it
            growing without limit on very wide displays. */}
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
      </div>
      {/* The 3D model. */}
      <div className="hidden md:block">
        <MannequinViewer />
      </div>
    </div>
  );
}
