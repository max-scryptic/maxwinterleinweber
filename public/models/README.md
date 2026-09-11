# Models

The tabs above the figure switch between these. They are listed in `FIGURES` in
`src/lib/figure.ts`, oldest first, and the first entry is what the page opens
on.

The column down the right hand side switches between poses instead, and is only
there for a model with a skeleton in it. See [Making one move](#making-one-move)
below, which is also where the answer to "why can the mannequin do that and a
raw scan cannot" lives.

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

Like scan-01 it has no skeleton and no animation clips, so it stands still. This
is the capture as it came back, and it stays that way: `scan-03.glb` and
`scan-04.glb` are the same mesh rigged, and keeping the raw one means the rig can
be redone, or thrown away, against something that is still the original. It has
been redone once already, which is what scan-04 is, and that is the argument for
keeping this file in one sentence.

Exported from Blender at 10.2 MB with a 4096px base colour and normal map.
Reduced the same way as scan-01:

```
npx @gltf-transform/cli optimize raw.glb scan-02.glb \
  --texture-size 2048 --compress meshopt --simplify false
```

which brought it to 3.4 MB with all 96,744 triangles intact.

## scan-03.glb

Not a third capture. It is scan-02's mesh with a skeleton in it, which makes it
the first scan here that can be posed, and it sits beside the raw one rather
than replacing it so that both are on the page to compare.

**It is rigged.** Twenty seven joints on Mixamo's naming, fitted to the mesh and
weighted by Blender's bone heat solver by `scripts/rig-scan.py`, then rebound in
a T-pose so that the poses apply to it. It carries no animation clips, because
an auto rigger does not produce any, so its Default is the standing shape
written in `POSES` rather than a recording.

**It faces the wrong way, and that is the fault `scan-04.glb` exists to fix.**
It carries no yaw, where scan-02 needs a half turn, because rigging was meant to
be the moment the export was turned round instead. That turn never happened. The
rigger asked for it and Blender dropped it in silence, for the reason written up
in `scripts/rig-scan.py`, so mesh and skeleton both came out of it still facing
away from the camera and with the joints named `Left` sitting down the body's
right hand side.

Nothing about that is visible in the model standing there, which is exactly what
makes it worth a paragraph. It shows up the moment anything is asked of the
skeleton, because a pose is written about the figure's own axes and this figure's
axes are turned around: Default bends the elbows backwards, and Squat sits the
body down facing out of its own back. It is kept here posed wrongly rather than
quietly turned round, because a yaw on the figure would not have fixed it. Yaw
turns the whole result, poses and all, so it would have put the standing figure's
face to the camera and left every pose reaching out of its spine.

What was also against it, and still shows on scan-04, is the capture pose.
Measured across the body before rigging, the arms were in contact with the torso
for the whole length of the upper arm: no gap at all from the armpit at 1.30 m
down to about 1.15 m, one centimetre at the elbow, and only five or six by the
wrist.
Shoulders are 49 cm across and the widest the figure got was 70 cm, which was
the arms, hanging.

A rigger works out which vertices belong to which limb by where they are, so an
upper arm sharing a surface with the ribs gets weighted to both. The rig came
out usable. What it did not come out with is an armpit that survives the arm
being lifted: swinging the arms up to a T drags the near side of the chest
about 3 cm with them, and 10 cm at the worst vertex, which is visible as a smear
across the shoulder in the T-pose and the squat. Everything below the ribs, and
the head, is untouched.

Re-capturing in an A-pose is a great deal less work than repairing that, and is
the one thing to get right for the next one.

3.39 MB against the raw mesh's 3.36: a skeleton and its weights are a rounding
error next to two 2048px textures.

## scan-04.glb

Scan-03 done again, on the same mesh, with the half turn that was missing from
it. Same script, same solver, same twenty seven joints, same T-pose rebind, and
the same 3.39 MB. The only difference is that this one is the way round it
always meant to be, which is the difference between the poses working and the
poses being backwards.

What that turn is worth, measured off the two files. In scan-03 the toes reach
5 to 7 cm behind the ankles, so the figure's front is `-Z` where every pose in
`src/lib/poses.ts` is written for a figure facing `+Z`: Squat throws the knees
and the hands out of the body's back, and the elbows in Default and Squat bend
the wrong way, which is the symptom worth knowing because a mesh standing at
rest gives nothing away. In scan-04 the toes reach 5 to 7 cm in front, the same
squat puts the knees 41 cm forward of the hips and drops them from 0.97 m to
0.53 m, and the joints called `Left` are down the body's left rather than its
right, which is what makes an asymmetric pose like Moonwalk lead with the leg it
was written to lead with.

The bug was in `face_forward` in `scripts/rig-scan.py`, and it is worth reading
the docstring there rather than only the fix: the rigger measured the mesh
correctly, decided correctly that it needed turning, asked Blender to turn it,
and Blender ignored it without raising anything. Setting `rotation_euler` on an
object whose `rotation_mode` is `QUATERNION`, which is what the glTF importer
leaves it as, writes a value that reads back exactly as it was set and is never
applied to anything. The `transform_apply` that followed applied only the
importer's scale. It now goes through `matrix_world`, which no rotation mode can
drop, and the result is checked before the script will use it.

What is not fixed here, because it is not a rigging problem, is the shoulder.
This is scan-02's mesh, captured arms-down, so it has the same welded armpit and
the same smear across the chest when the arms come up. Re-capturing in an A-pose
is still the one thing to get right for the next one.

## Making one move

A figure moves because something is turning its joints. A model with no joints
has nothing to turn, and no amount of code at this end invents them: posing a
photogrammetry scan is a thing that happens to the file, before it ever reaches
this directory. That is the whole of why the pose column is missing on the two
raw scans and present on the placeholder and on scans 03 and 04, which are one of
those scans after the thing had happened to it.

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

The second is what makes rigging a scan worth doing. A scan that comes back with
a Mixamo skeleton in it needs `rigged: true` on its entry in `FIGURES` and
nothing else, and every pose already written applies to it.

With one condition, which is easy to meet and quietly fatal to miss: **the rig
has to be bound in a T-pose.** A pose here is a rotation *from* where a joint
rests, not an instruction to point it somewhere absolute, which is what lets the
same squat sit rigs of different proportions. Legs are unaffected either way,
because a leg rests hanging down whatever the capture pose was. Arms are not.
`LeftArm: { x: -66, z: -76 }` means "down out of the T and forward", and applied
to a rig bound with its arms already down it means "down another 76 degrees",
which puts the arm through the ribs. So bind in a T and the arm poses are right;
bind in an A-pose and they are not. The step that guarantees it is in
[Rigging a scan](#rigging-a-scan) below.

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

There are two ways to do this. `scripts/rig-scan.py` is the one that produced
scan-03 and then scan-04 out of scan-02: it fits the skeleton by measuring the
mesh, hands the weighting to Blender's own bone heat solver, and rebinds in a T,
all without a browser or an account. Read its docstring; it is one command
either side of a gltf-transform decode and re-compress. Write the result out
beside the scan under the next number rather than over it, as scans 03 and 04
are: a rig can be redone, and a capture cannot. Scan-04 is that sentence being
cashed in, and the reason it is a rule here rather than a preference.

The rest of this section is the path to reach for on a scan captured properly,
which is Mixamo's, because a person placing six markers by eye will beat a
script measuring silhouettes on a figure whose limbs are where a rigger expects
them.

Mixamo's auto rigger is at https://www.mixamo.com, free with an Adobe
account. Upload the mesh, drop
markers on the chin, wrists, elbows, knees and groin, and it hands back a
skinned FBX with a `mixamorig:` skeleton. Blender imports that and exports glTF,
and then it is compressed like any other model here.

Almost everything that goes wrong goes wrong at the capture, not at the rigger,
so it is worth getting the scan right first:

- **Capture in an A-pose, arms well clear of the torso.** This is the one that
  matters, and it is what scan-02 got wrong and both rigs of it still show. An
  auto rigger works out which vertices belong to which limb by their position,
  so a forearm resting against a hip is a forearm that welds itself to the hip,
  and every pose after that drags the body with the arm. Feet apart, palms
  visible, elbows out.
- **One mesh, closed, with all four limbs.** Holes and floating shards confuse
  the weighting. Scan-01 fails this before anything else does.
- **Decimate before uploading, not after.** Mixamo has an upload limit, and
  simplifying a mesh after it has been skinned is what tears the weights at the
  joints. Fifty thousand triangles is plenty to rig against.
- **Keep the textures out of it.** Rig the bare geometry, and let Blender put
  the material back on the skinned mesh afterwards.

Then, in Blender, the step that makes the arm poses land:

1. On Mixamo, with the rigged character selected, pick **T-Pose** from the
   animation list and download it as FBX.
2. Import that into Blender alongside the rigged mesh.
3. Select the armature, go into Pose mode, and **Pose > Apply > Apply Pose as
   Rest Pose**.

That rebinds the skeleton so the T is what the rig rests in, which is the
condition the arm poses need. Skipping it is not an error anyone will see at
import: the model looks fine, and then Squat folds its arms through its chest.

Then export and compress:

```
# in Blender: export glTF Binary, +Y up, with Skinning ticked
npx @gltf-transform/cli optimize raw.glb scan-05.glb \
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
