# Models

The tabs above the figure switch between these. They are listed in `FIGURES` in
`src/lib/figure.ts`, oldest first, and the first entry is what the page opens
on.

## mannequin.glb

The placeholder every later iteration is measured against.

It is the `Xbot` figure from the three.js example assets
(`examples/models/gltf/Xbot.glb` in https://github.com/mrdoob/three.js), a
rigged, untextured humanoid originally rigged through Adobe Mixamo. It carries
seven animation clips; the viewer plays `idle`.

## scan-01.glb

The first photogrammetry scan, captured in Polycam and exported through
Blender. Deliberately unretouched: limbs and most of the legs are missing, the
mesh is torn, and a long shard of jeans hangs below the body.

That shard is why the figure sits high and off centre in the frame. The scene
normalises by bounding box, so the lowest point of the model is what gets stood
on the ground plane, and here the lowest point is the tip of the shard rather
than a pair of feet. Cropping it in Blender is what fixes that, not a change
here.

It has no skeleton and no animation clips, which is true of every
photogrammetry scan. The viewer handles that: a model with no clips simply
stands still.

Raw export was 17.9 MB with three 4096px textures, or 268 MB of VRAM. Reduced
with:

```
npx @gltf-transform/cli optimize raw.glb scan-01.glb \
  --texture-size 2048 --compress meshopt --simplify false
```

which brought it to 4.6 MB and 67 MB of VRAM without touching the geometry.

## scan-02.glb

The second scan, and a whole figure this time: arms, legs and feet all present,
so nothing hangs below it and the bounding box holds a person rather than a
person and a shard. It stands on its own origin at 1.75 m and is centred within
a couple of centimetres, so it needs no shift or rise; it carries a half turn
of yaw because it was exported facing away from the camera.

Like scan-01 it has no skeleton and no animation clips, so it stands still.

Exported from Blender at 10.2 MB with a 4096px base colour and normal map.
Reduced the same way as scan-01:

```
npx @gltf-transform/cli optimize raw.glb scan-02.glb \
  --texture-size 2048 --compress meshopt --simplify false
```

which brought it to 3.4 MB with all 96,744 triangles intact.

## Adding another

Drop a `.glb` in this directory and add an entry to `FIGURES`. Nothing else
needs to change: the model is measured, uniformly scaled to 1.8 m, centred on
its X and Z axes and stood on the plane through the origin, and the camera
framing along with the orbit and zoom limits are all derived from that height.
A scan exported in centimetres, or sitting a long way off its own origin, needs
no numbers changed anywhere.

Compress it first. `useGLTF` reads Meshopt without any decoder to serve, which
Draco would need, so prefer `--compress meshopt` as above.

The three view buttons work the same way. `VIEWS` in `src/lib/figure.ts` gives
each one a band of the figure to fit, as fractions of its height measured up
from the ground, plus how wide that band is at its widest. Those are
proportions of a standing person rather than measurements of any one model, so
a scan of a whole standing figure should need no change: the hips sit a little
above half of a person's height and the head is the top eighth. The placeholder
is stylised and has a head nearer a sixth of its height, so its head shot
includes more shoulder than a scan's would, and `scan-01` is neither, so its
head shot misses.

Three things a scan has to get right, because none of them can be inferred from
a bounding box:

- **Up axis.** glTF is Y-up. Exporters that work in Z-up (Blender's default,
  and most photogrammetry tools) have to be told to convert on export, or the
  figure arrives lying on its back.
- **What is in the box.** Everything the mesh contains is measured, so a
  fragment of floor, a stray shard or a leaning pose all move the figure and
  change its scale. This is worth more than any amount of care over the numbers
  in the scene.
- **Size.** Only if it is not a whole standing figure. A bust scaled to 1.8 m
  tall is a very large bust; change `HEIGHT` in the scene to the real height of
  whatever the model actually shows.
