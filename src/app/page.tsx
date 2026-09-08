import {
  Audiowide,
  Baloo_2,
  Bangers,
  Bungee,
  Chewy,
  Comfortaa,
  Concert_One,
  Fredoka,
  Grandstander,
  Lilita_One,
  Nunito,
  Orbitron,
  Outfit,
  Poetsen_One,
  Righteous,
  Silkscreen,
  Sniglet,
  Space_Grotesk,
  Titan_One,
} from "next/font/google";

const NAME = "Max Winter-Leinweber";

const fredoka = Fredoka({ subsets: ["latin"], weight: "600" });
const baloo = Baloo_2({ subsets: ["latin"], weight: "700" });
const nunito = Nunito({ subsets: ["latin"], weight: "800" });
const grandstander = Grandstander({ subsets: ["latin"], weight: "700" });
const lilitaOne = Lilita_One({ subsets: ["latin"], weight: "400" });
const titanOne = Titan_One({ subsets: ["latin"], weight: "400" });
const bangers = Bangers({ subsets: ["latin"], weight: "400" });
const chewy = Chewy({ subsets: ["latin"], weight: "400" });
const concertOne = Concert_One({ subsets: ["latin"], weight: "400" });
const sniglet = Sniglet({ subsets: ["latin"], weight: "800" });
const poetsenOne = Poetsen_One({ subsets: ["latin"], weight: "400" });
const comfortaa = Comfortaa({ subsets: ["latin"], weight: "700" });
const bungee = Bungee({ subsets: ["latin"], weight: "400" });
const righteous = Righteous({ subsets: ["latin"], weight: "400" });
const audiowide = Audiowide({ subsets: ["latin"], weight: "400" });
const orbitron = Orbitron({ subsets: ["latin"], weight: "700" });
const silkscreen = Silkscreen({ subsets: ["latin"], weight: "700" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: "700" });
const outfit = Outfit({ subsets: ["latin"], weight: "700" });

type Sample = {
  name: string;
  vibe: string;
  note: string;
  className: string;
  size: string;
};

const samples: Sample[] = [
  {
    name: "Fredoka",
    vibe: "Cartoony",
    note: "Rounded and friendly, reads cleanly at any size.",
    className: fredoka.className,
    size: "text-4xl sm:text-5xl md:text-6xl",
  },
  {
    name: "Baloo 2",
    vibe: "Cartoony",
    note: "Chunky rounded terminals, warm without being goofy.",
    className: baloo.className,
    size: "text-4xl sm:text-5xl md:text-6xl",
  },
  {
    name: "Lilita One",
    vibe: "Cartoony",
    note: "Poster-bold with tight spacing, very high contrast.",
    className: lilitaOne.className,
    size: "text-4xl sm:text-5xl md:text-6xl",
  },
  {
    name: "Titan One",
    vibe: "Cartoony",
    note: "Fat rounded caps, feels like a mobile game logo.",
    className: titanOne.className,
    size: "text-3xl sm:text-4xl md:text-5xl",
  },
  {
    name: "Poetsen One",
    vibe: "Cartoony",
    note: "Soft and bouncy, still perfectly legible.",
    className: poetsenOne.className,
    size: "text-4xl sm:text-5xl md:text-6xl",
  },
  {
    name: "Concert One",
    vibe: "Cartoony",
    note: "Rounded slab feel, holds up well in a header.",
    className: concertOne.className,
    size: "text-4xl sm:text-5xl md:text-6xl",
  },
  {
    name: "Sniglet",
    vibe: "Cartoony",
    note: "Bubbly and playful with wide open letterforms.",
    className: sniglet.className,
    size: "text-3xl sm:text-4xl md:text-5xl",
  },
  {
    name: "Grandstander",
    vibe: "Cartoony",
    note: "Loose and hand-drawn feeling but tidy.",
    className: grandstander.className,
    size: "text-4xl sm:text-5xl md:text-6xl",
  },
  {
    name: "Chewy",
    vibe: "Cartoony",
    note: "Comic lettering energy, easy on the eyes.",
    className: chewy.className,
    size: "text-4xl sm:text-5xl md:text-6xl",
  },
  {
    name: "Bangers",
    vibe: "Comic book",
    note: "All caps action-comic look, loud but readable.",
    className: bangers.className,
    size: "text-4xl sm:text-5xl md:text-6xl",
  },
  {
    name: "Bungee",
    vibe: "Gamey",
    note: "Arcade signage caps, blocky and confident.",
    className: bungee.className,
    size: "text-2xl sm:text-3xl md:text-4xl",
  },
  {
    name: "Righteous",
    vibe: "Gamey",
    note: "Retro geometric display, clean at header size.",
    className: righteous.className,
    size: "text-4xl sm:text-5xl md:text-6xl",
  },
  {
    name: "Audiowide",
    vibe: "Gamey",
    note: "Racing game chrome, wide and techy.",
    className: audiowide.className,
    size: "text-2xl sm:text-3xl md:text-4xl",
  },
  {
    name: "Orbitron",
    vibe: "Gamey",
    note: "Sci-fi HUD lettering, squared off and sharp.",
    className: orbitron.className,
    size: "text-2xl sm:text-3xl md:text-4xl",
  },
  {
    name: "Silkscreen",
    vibe: "Gamey",
    note: "Pixel font that stays crisp instead of mushy.",
    className: silkscreen.className,
    size: "text-xl sm:text-2xl md:text-3xl",
  },
  {
    name: "Nunito",
    vibe: "Friendly",
    note: "Rounded workhorse sans, the safe nice-looking pick.",
    className: nunito.className,
    size: "text-4xl sm:text-5xl md:text-6xl",
  },
  {
    name: "Comfortaa",
    vibe: "Friendly",
    note: "Geometric and airy, calm rounded shapes.",
    className: comfortaa.className,
    size: "text-3xl sm:text-4xl md:text-5xl",
  },
  {
    name: "Outfit",
    vibe: "Modern",
    note: "Clean geometric sans, quietly stylish.",
    className: outfit.className,
    size: "text-4xl sm:text-5xl md:text-6xl",
  },
  {
    name: "Space Grotesk",
    vibe: "Modern",
    note: "Slightly quirky grotesk, a subtle step up from default.",
    className: spaceGrotesk.className,
    size: "text-4xl sm:text-5xl md:text-6xl",
  },
];

export default function Home() {
  return (
    <div className="flex-1 bg-[#f4f4f4] px-4 py-6 sm:px-6 sm:py-8 md:p-10">
      <p className="mb-6 text-sm text-neutral-500 sm:mb-8">
        Header font options. Same name, nineteen typefaces.
      </p>

      <div className="flex flex-col gap-4 sm:gap-5">
        {samples.map((sample) => (
          <section
            key={sample.name}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-5 sm:px-6 sm:py-7"
          >
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-xs font-semibold tracking-wide text-neutral-900 uppercase">
                {sample.name}
              </span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                {sample.vibe}
              </span>
              <span className="text-xs text-neutral-400">{sample.note}</span>
            </div>
            <h1
              className={`${sample.className} ${sample.size} leading-tight break-words text-neutral-900`}
            >
              {NAME}
            </h1>
          </section>
        ))}
      </div>
    </div>
  );
}
