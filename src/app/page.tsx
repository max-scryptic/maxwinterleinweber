import { LeftCard, asCardDesign } from "@/components/left-card";
import { SpaceBackdrop } from "@/components/space-backdrop";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  /* While the card's design is being settled, ?card= names which one to draw:
     current, lifted, frosted, aurora or editorial. Anything else, including
     nothing at all, gets the default. Once one is chosen this goes and the card
     is drawn with it directly, which also puts the page back to being static. */
  const design = asCardDesign((await searchParams).card);

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
        <LeftCard design={design} />
      </div>
    </>
  );
}
