import { Grandstander } from "next/font/google";

import { SocialCards } from "@/components/social-cards";

const grandstander = Grandstander({ subsets: ["latin"], weight: "700" });

export default function Home() {
  return (
    // Two equal columns from md up: the name and links on the left, the right
    // half held clear for the 3D model. Narrower than that there is no room to
    // split the screen, so the left column takes the full width and the empty
    // right one collapses to nothing.
    <div className="grid flex-1 grid-cols-1 bg-[#f4f4f4] md:grid-cols-2">
      <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-6 md:p-10">
        <h1
          className={`${grandstander.className} text-center text-4xl leading-tight break-words text-neutral-900 sm:text-5xl md:text-6xl`}
        >
          Max Winter-Leinweber
        </h1>
        <div className="mt-8 w-full md:mt-10">
          <SocialCards />
        </div>
      </div>
      {/* Reserved for the 3D model. */}
      <div className="hidden md:block" />
    </div>
  );
}
