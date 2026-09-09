import { LeftCard } from "@/components/left-card";
import { SpaceBackdrop } from "@/components/space-backdrop";

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
        <LeftCard />
      </div>
    </>
  );
}
