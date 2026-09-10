# Models

The tabs above the figure switch between these. They are listed in `FIGURES` in
`src/lib/figure.ts`, oldest first, and the first entry is what the page opens
on.

The column down the right hand side switches between poses instead, and is only
there for a model with a skeleton in it. See [Making one move](#making-one-move)
below, which is also where the answer to "why can the mannequin do that and the
scans cannot" lives.

## mannequin.glb

The placeholder every later iteration is measured against.

It is the `Xbot` figure from the three.js example assets
(`examples/models/gltf/Xbot.glb` in https://github.com/mrdoob/three.js), a
rigged, untextured humanoid originally rigged through Adobe Mixamo. It carries
seven animation clips: `agree`, `headShake`, `idle`, `run`, `sad_pose`,
`sneak_pose` and `walk`. Default plays `idle` and the other four poses are built
onto its skeleton, so the remaining six clips are sitting there unused and are
one line each in `POSES` to put on a button.

Its sixty seven joints are a stock Mixamo skeleton, which is the only reason the
poses in `src/lib/poses.ts` are worth writing: they are addressed to joints
called `LeftUpLeg` and `RightForeArm`, and anything else that has been through
the same rigger answers to those names too.

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
stands still, and is not offered the pose column at all. It is also the one
scan that could never be rigged as it stands, having no limbs to rig.

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

Like scan-01 it has no skeleton and no animation clips, so it stands still. It
is a whole figure, though, which makes it the first one that could be sent
through an auto rigger and come back able to move. What is against it is the
capture pose: it was scanned with its arms close to its sides, and that is the
one thing an auto rigger cannot work around. See below.

Exported from Blender at 10.2 MB with a 4096px base colour and normal map.
Reduced the same way as scan-01:

```
npx @gltf-transform/cli optimize raw.glb scan-02.glb \
  --texture-size 2048 --compress meshopt --simplify false
```

which brought it to 3.4 MB with all 96,744 triangles intact.

## Making one move

A figure moves because something is turning its joints. A model with no joints
has nothing to turn, and no amount of code at this end invents them: posing a
photogrammetry scan is a thing that happens to the file, before it ever reaches
this directory. That is the whole of why the pose column is missing on the two
scans and present on the placeholder.

Given a skeleton, there are two ways to drive it, and the viewer treats them as
the same kind of thing:

- **A clip the model was exported carrying.** Recorded motion, and no
  substitute for it exists: Default is the placeholder's `idle`, which is a
  recording of a person standing still and breathing, and it beats anything
  written by hand.
- **A pose written in `src/lib/poses.ts`.** A rotation per joint, in degrees,
  measured about the figure's own axes. T-pose, Squat and Moonwalk are these.
  They cost a few hundred bytes rather than a few megabytes, they can be read
  and edited later, and, because they are addressed to joints by name rather
  than baked against one particular body, they apply unchanged to any other rig
  that has been through the same rigger.

The second is what makes rigging a scan worth doing. The moment a scan comes
back with a Mixamo skeleton in it, every pose already written applies to it, and
the only change here is `rigged: true` on its entry in `FIGURES`.

Two things the poses do not have to state, because `src/lib/pose-clip.ts` solves
them against whatever skeleton it is handed. How far the hips drop, which is a
consequence of how long that rig's legs are: bending the knees as far as the
squat does lifts the feet off the floor, and the builder puts them back by
standing the figure on its own feet. And where the figure ends up, which for the
squat means the hips travelling backwards over the heels rather than the whole
body leaning forwards off the axis it is being turned on. A scan with shorter
legs than the placeholder therefore squats less deeply, correctly, with no
numbers touched.

### Rigging a scan

The path that needs no software licence is Mixamo's auto rigger
(https://www.mixamo.com, free with an Adobe account). Upload the mesh, drop
markers on the chin, wrists, elbows, knees and groin, and it hands back a
skinned FBX with a `mixamorig:` skeleton. Blender imports that and exports glTF,
and then it is compressed like any other model here.

Almost everything that goes wrong goes wrong at the capture, not at the rigger,
so it is worth getting the scan right first:

- **Capture in an A-pose, arms well clear of the torso.** This is the one that
  matters, and it is why scan-02 is not already rigged. An auto rigger works out
  which vertices belong to which limb by their position, so a forearm resting
  against a hip is a forearm that welds itself to the hip, and every pose after
  that drags the body with the arm. Feet apart, palms visible, elbows out.
- **One mesh, closed, with all four limbs.** Holes and floating shards confuse
  the weighting. Scan-01 fails this before anything else does.
- **Decimate before uploading, not after.** Mixamo has an upload limit, and
  simplifying a mesh after it has been skinned is what tears the weights at the
  joints. Fifty thousand triangles is plenty to rig against.
- **Keep the textures out of it.** Rig the bare geometry, and let Blender put
  the material back on the skinned mesh afterwards.

Then, converting and compressing:

```
# in Blender: import the rigged FBX, export glTF Binary, +Y up
npx @gltf-transform/cli optimize raw.glb scan-03.glb \
  --texture-size 2048 --compress meshopt --simplify false
```

`--simplify false` is not optional on a rigged model in the way it is merely
advisable on a static one. Simplification moves vertices, and a vertex moved
across a joint takes the wrong bone's weights with it, which shows up as an
elbow that tears open the first time it bends.

Nothing else changes. The poses are written against joint names with the prefix
left off, so `mixamorig:LeftUpLeg`, the `mixamorigLeftUpLeg` that three renames
it to on load, and the `mixamorig_LeftUpLeg` that Blender sometimes writes are
all found by the same entry.

### Adding a pose

An entry in `POSES` in `src/lib/poses.ts`. Degrees, about the figure's own axes:
+Y is up, +Z is the way it faces, +X is its own left, and each joint's rotation
is measured in its parent's frame, so an elbow is 60 degrees of elbow whatever
the shoulder above it is doing. A joint that hangs downwards swings backwards
under a positive X and forwards under a negative one; the spine and neck, which
point upwards, do the opposite.

One shape is a pose held. Several with times on them is a pose played, and
`mirror()` will turn a step written for one side into the same step on the
other, exactly rather than approximately. A pose that reaches wider than a
figure standing still also wants a `span`, or it will be framed by a number that
was never about it and lose its hands off the side of the window.

## Adding another figure

Drop a `.glb` in this directory and add an entry to `FIGURES`, saying in
`rigged` whether it has a skeleton in it. Nothing else needs to change: the model is measured, uniformly scaled to 1.8 m, centred on
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
