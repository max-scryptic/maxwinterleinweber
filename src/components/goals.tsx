import Image from "next/image";

import grandPiano from "@/assets/goals/grand-piano.jpg";

/*
 * The goal, shown rather than said: a grand piano. The photo fills its frame
 * edge to edge, so its own white backdrop is the frame and the floor shadow
 * runs out to the border rather than stopping short of it. It is kept to the
 * photo's own width, so it is never stretched past the pixels it has.
 */
export function Goals() {
  return (
    <Image
      src={grandPiano}
      alt="A black grand piano with its lid open, and a piano bench"
      sizes="(min-width: 768px) 36rem, 100vw"
      className="w-full max-w-xl rounded-[0.25rem] border border-border"
    />
  );
}
