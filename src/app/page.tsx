import { Grandstander } from "next/font/google";

import { MannequinViewer } from "@/components/mannequin-viewer";
import { SocialCards } from "@/components/social-cards";

const grandstander = Grandstander({ subsets: ["latin"], weight: "700" });

export default function Home() {
  return (
    // Two equal columns from md up: the name and links on the left, the right
    // half held clear for the 3D model. Narrower than that there is no room to
    // split the screen, so the left column takes the full width and the empty
    // right one collapses to nothing.
    <div className="grid flex-1 grid-cols-1 bg-[#f4f4f4] md:grid-cols-2">
      {/* A query container, so the name below can size itself against this
          column's content box rather than the viewport, and keeps fitting if
          the split between the two columns ever changes. */}
      <div className="@container flex flex-col items-center justify-center px-4 py-10 sm:px-6 md:p-10">
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
      </div>
      {/* The 3D model. */}
      <div className="hidden md:block">
        <MannequinViewer />
      </div>
    </div>
  );
}
