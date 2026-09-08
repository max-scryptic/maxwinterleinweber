import { Grandstander } from "next/font/google";

const grandstander = Grandstander({ subsets: ["latin"], weight: "700" });

export default function Home() {
  return (
    <div className="flex-1 bg-[#f4f4f4] px-4 py-6 sm:px-6 sm:py-8 md:p-10">
      <h1
        className={`${grandstander.className} text-4xl leading-tight break-words text-neutral-900 sm:text-5xl md:text-6xl`}
      >
        Max Winter-Leinweber
      </h1>
    </div>
  );
}
