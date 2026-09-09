"use client";

import { Canvas } from "@react-three/fiber";

import { Nebula } from "@/components/nebula";

/*
 * The real sky, on its own, for the name lab.
 *
 * The page's own backdrop brings the figure, the view tabs and the camera rig
 * with it, none of which the lab is asking about, so this mounts the same
 * Nebula shader in a bare canvas instead. The colours and the noise are the
 * shader's, so what the panes are read against here is what they are read
 * against on the page.
 *
 * The cloud is held still. Its churn is slow enough not to be seen anyway, and
 * fixing uTime at zero means two screenshots of the same variant are of the
 * same patch of cloud rather than of two, which is the whole point of putting
 * the variants next to each other.
 */

// The page's own field of view, so the cloud has the same structure at the same
// screen size rather than being a wider or tighter crop of it.
const FOV = 35;

export default function LabSky() {
  return (
    <Canvas
      camera={{ fov: FOV, position: [0, 0, 0] }}
      // Nothing in the lab is meant to be dragged, and the panes sit over this.
      className="pointer-events-none"
    >
      <Nebula still />
    </Canvas>
  );
}
