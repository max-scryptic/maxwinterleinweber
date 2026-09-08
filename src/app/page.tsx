import { Grandstander } from "next/font/google";

import { SocialCards } from "@/components/social-cards";

const grandstander = Grandstander({ subsets: ["latin"], weight: "700" });

export default function Home() {
  return (
    <div className="flex-1 bg-[#f4f4f4] px-4 py-6 sm:px-6 sm:py-8 md:p-10">
      <div className="w-fit max-w-full">
        <h1
          className={`${grandstander.className} text-4xl leading-tight break-words text-neutral-900 sm:text-5xl md:text-6xl`}
        >
          Max Winter-Leinweber
        </h1>
        {/* w-0 min-w-full keeps the grid from widening the fit-content wrapper,
            so the cards match the title's width instead of the other way round. */}
        <div className="mt-8 w-0 min-w-full md:mt-10">
          <SocialCards />
        </div>
      </div>
    </div>
  );
}
