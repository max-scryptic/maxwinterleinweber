# Models

## mannequin.glb

A placeholder, to be replaced by a scan.

It is the `Xbot` figure from the three.js example assets
(`examples/models/gltf/Xbot.glb` in https://github.com/mrdoob/three.js), a
rigged, untextured humanoid originally rigged through Adobe Mixamo. It carries
seven animation clips; the viewer plays `idle`.

### Replacing it

`src/components/mannequin-scene.tsx` reads one constant:

```ts
const MODEL_URL = "/models/mannequin.glb";
```

Drop a `.glb` or `.gltf` in this directory, point that constant at it, and the
scene re-fits: the model is measured, uniformly scaled to 1.8 m, centred on its
X and Z axes and stood on the ground plane, and the camera framing, the orbit
and zoom limits and the contact shadow are all derived from that height. A scan
exported in centimetres, or sitting a long way off its own origin, needs no
numbers changed here.

The three view buttons work the same way. `VIEWS` in that file gives each one a
band of the figure to fit, as fractions of its height measured up from the
ground, plus how wide that band is at its widest. Those are proportions of a
standing person rather than measurements of the placeholder, so a scan of a
whole standing figure should need no change: the hips sit a little above half
of a person's height and the head is the top eighth. The placeholder is
stylised and has a head nearer a sixth of its height, so its head shot includes
more shoulder than a scan's would.

Two things a scan does need to get right, because neither can be inferred from
a bounding box:

- **Up axis.** glTF is Y-up. Exporters that work in Z-up (Blender's default,
  and most photogrammetry tools) have to be told to convert on export, or the
  figure arrives lying on its back.
- **Size.** Only if it is not a whole standing figure. A bust scaled to 1.8 m
  tall is a very large bust; change `HEIGHT` in the scene to the real height of
  whatever the model actually shows.

A raw scan is usually far too heavy for a web page (millions of triangles, 4K
or 8K textures). Decimating it and resizing its textures, then compressing the
result with Draco or Meshopt, is worth doing before it goes in here. If the
file ends up Draco-compressed, `useGLTF` needs its decoder enabled:
`useGLTF(MODEL_URL, "/draco/")` with the decoder files served from `public`.
