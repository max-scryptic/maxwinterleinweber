#!/usr/bin/env python3
"""
Fit a Mixamo-named skeleton to a photogrammetry scan, weight it, and rebind it
in a T-pose, so that the poses in src/lib/poses.ts apply to it.

This is what produced public/models/scan-04.glb out of scan-02.glb, which is
the same capture and is kept unrigged beside it. It produced scan-03.glb too,
before `face_forward` below was fixed, and that file is kept facing backwards as
the record of what the bug cost. It exists
because Mixamo's auto rigger, which is what public/models/README.md recommends
and what anyone should reach for first, wants an Adobe account and six markers
placed by hand in a browser. This does the same three jobs without one: it works
out where the joints are, hands the weighting to Blender's own bone heat solver,
and leaves the model bound in a T.

    pip install bpy==5.0.1                       # needs CPython 3.11
    npx @gltf-transform/cli copy in.glb raw.glb  # Blender cannot read meshopt
    python scripts/rig-scan.py raw.glb out.glb

then compress the result the way every other model here is compressed:

    npx @gltf-transform/cli optimize out.glb scan-NN.glb \
      --texture-size 2048 --compress meshopt --simplify false

Every measurement below is taken off the mesh. There is not a number in here
that was arrived at by looking at one particular person, which is the only
reason it is worth keeping rather than having been a thing that happened once.

What it cannot do is invent an armpit. Where a scan was captured with its arms
against its sides, the arm and the ribs share a surface, and the weighting has
no way to tell which vertices belong to which. It will still produce a rig. The
shoulder will still smear when the arm comes up. Capturing in an A-pose is the
fix, and it is a great deal cheaper than this script.
"""

import math
import statistics
import sys

# bpy first, and not for tidiness: importing it is what puts Blender's own
# modules on the path, so bmesh and mathutils cannot be found before it has run.
import bpy

import bmesh
from mathutils import Matrix, Vector

# The chain, and the names. These are Mixamo's, because the poses are addressed
# to them: a joint here called LeftUpLeg is what `LeftUpLeg` in a pose finds.
CHAINS = [
    ["Hips", "Spine", "Spine1", "Spine2", "Neck", "Head", "HeadTop_End"],
    ["Spine2", "LeftShoulder", "LeftArm", "LeftForeArm", "LeftHand", "LeftHandEnd"],
    ["Spine2", "RightShoulder", "RightArm", "RightForeArm", "RightHand", "RightHandEnd"],
    ["Hips", "LeftUpLeg", "LeftLeg", "LeftFoot", "LeftToeBase", "LeftToe_End"],
    ["Hips", "RightUpLeg", "RightLeg", "RightFoot", "RightToeBase", "RightToe_End"],
]

# Joints at the very tip of a hand or a toe, which exist to give the joint above
# them a direction and nothing else. They are excluded from deformation because
# they sit on or just outside the surface, and a joint outside the mesh is the
# thing bone heat cannot solve for: leaving them in is what makes the solver
# give up and report that it found no solution for one or more bones.
LEAVES = ["HeadTop_End", "LeftHandEnd", "RightHandEnd", "LeftToe_End", "RightToe_End"]

# Where each joint sits, as a fraction of the figure's height. Proportions of a
# standing person rather than of any one scan, and only ever a starting height:
# the position across and front to back is measured, at that height, from the
# mesh itself.
HEIGHTS = {
    "Hips": 0.552, "Spine": 0.60, "Spine1": 0.655, "Spine2": 0.715,
    "Neck": 0.832, "Head": 0.868, "Shoulder": 0.822, "Arm": 0.800,
    "ForeArm": 0.617, "Hand": 0.487, "HandTip": 0.432,
    "UpLeg": 0.535, "Leg": 0.285, "Foot": 0.058, "ToeBase": 0.016,
}


def load(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    mesh = next(o for o in bpy.data.objects if o.type == "MESH")
    bpy.ops.object.select_all(action="DESELECT")
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = mesh
    return mesh


def clean(mesh):
    """
    Weld the split vertices and settle the normals.

    Bone heat solves a diffusion across the surface, so it needs a surface: a
    photogrammetry export arrives with its vertices split per face corner, and
    across a seam like that nothing diffuses. Welding does not cost the texture
    anything, because Blender keeps a UV per face corner rather than per vertex,
    and the glTF exporter splits them again on the way out.
    """
    before = len(mesh.data.vertices)
    bpy.ops.object.mode_set(mode="EDIT")
    bm = bmesh.from_edit_mesh(mesh.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0005)
    bmesh.update_edit_mesh(mesh.data)
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    print(f"  welded {before} -> {len(mesh.data.vertices)} vertices")


def facing(pts):
    """
    Which way along Y the figure's toes reach, read off the feet.

    Toes reach further from an ankle than heels do, which is the whole of the
    measurement: take the middle of the lower leg, then ask which side of it the
    foot reaches further on.
    """
    lo = min(p.z for p in pts)
    span = max(p.z for p in pts) - lo

    ankle = statistics.median(
        [p.y for p in pts if 0.10 < (p.z - lo) / span < 0.16] or [0]
    )
    feet = [p.y for p in pts if (p.z - lo) / span < 0.05]
    return 1 if (max(feet) - ankle) > (ankle - min(feet)) else -1


def face_forward(mesh):
    """
    Turn the figure to face -Y, which glTF export writes out as facing +Z.

    Doing this here rather than as a yaw on the figure is what lets the rig, the
    mesh and the poses agree about which way is forwards, and it is the
    difference between a squat leaning into the frame and a squat leaning out of
    it. Getting it wrong is not a thing anyone sees at import either: the figure
    stands there looking correct, and then bends its elbows backwards.

    The half turn is written onto the object's matrix rather than onto its
    `rotation_euler`, and that is not a matter of taste. The glTF importer leaves
    the object in quaternion rotation mode, and an object in quaternion mode
    ignores its Euler entirely. Setting it there raises nothing, reads back as
    the value that was set, and applies a transform that is silently only the
    importer's scale, which is what produced the backwards rig in scan-03.
    Assigning `matrix_world` says the same thing in a way no rotation mode can
    drop, and the check below is there because this failed quietly once already.
    """
    pts = [mesh.matrix_world @ v.co for v in mesh.data.vertices]
    forward = facing(pts)

    print(f"  toes reach {'+Y' if forward > 0 else '-Y'}")
    if forward > 0:
        mesh.matrix_world = Matrix.Rotation(math.pi, 4, "Z") @ mesh.matrix_world

    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    pts = [mesh.matrix_world @ v.co for v in mesh.data.vertices]

    if facing(pts) > 0:
        raise SystemExit("the half turn did not take: the figure still faces +Y")

    return pts


class Body:
    """The measurements a skeleton can be fitted to, taken from the mesh."""

    def __init__(self, pts):
        self.pts = pts
        self.lo = min(p.z for p in pts)
        self.span = max(p.z for p in pts) - self.lo

    def band(self, f, half=0.012):
        return [p for p in self.pts if abs((p.z - self.lo) / self.span - f) <= half]

    def z(self, f):
        return self.lo + f * self.span

    def blobs(self, sel, bins=90, gap=2):
        """Separate runs of geometry across the body, as (centre, y, count)."""
        if len(sel) < 40:
            return []
        xs = sorted(p.x for p in sel)
        a, b = xs[len(xs) // 400], xs[-1 - len(xs) // 400]
        if b <= a:
            return []
        hist = [[] for _ in range(bins)]
        for p in sel:
            i = int((p.x - a) / (b - a) * bins)
            if 0 <= i < bins:
                hist[i].append(p)
        floor = max(1, len(sel) * 0.002)
        out, run, empty = [], [], 0
        for i in range(bins):
            if len(hist[i]) >= floor:
                run.extend(hist[i])
                empty = 0
            else:
                empty += 1
                if run and empty >= gap:
                    out.append(run)
                    run = []
        if run:
            out.append(run)
        return [
            ((min(p.x for p in r) + max(p.x for p in r)) / 2,
             statistics.median(p.y for p in r), len(r))
            for r in out if len(r) > len(sel) * 0.01
        ]

    def trunk(self, f):
        """The body itself at a height, which is the largest run across it."""
        found = self.blobs(self.band(f))
        if not found:
            return None
        big = max(found, key=lambda b: b[2])
        return Vector((big[0], big[1], self.z(f)))

    def width(self, f):
        sel = self.band(f)
        return max(p.x for p in sel) - min(p.x for p in sel)

    def fit_spine(self):
        """
        The spine, as a straight line through the trunk rather than as the trunk
        centre measured at each height.

        A silhouette centre wanders with the shape of what it is measuring, a
        belly against a chest, and over the ten centimetres between two spine
        joints that wander becomes the joint's direction. Measured directly it
        gave a spine resting 29 degrees off vertical, and every pose that leans
        the chest forwards would have been leaning it forwards from there.
        """
        samples = [p for p in (self.trunk(0.55 + 0.02 * i) for i in range(17)) if p]

        def fit(axis):
            zs = [p.z for p in samples]
            vs = [getattr(p, axis) for p in samples]
            mz = sum(zs) / len(zs)
            mv = sum(vs) / len(vs)
            denom = sum((z - mz) ** 2 for z in zs) or 1
            slope = sum((z - mz) * (v - mv) for z, v in zip(zs, vs)) / denom
            return slope, mv - slope * mz

        self.sx, self.ix = fit("x")
        self.sy, self.iy = fit("y")
        lean = math.degrees(math.atan(math.hypot(self.sx, self.sy)))
        print(f"  spine leans {lean:.1f} degrees off vertical")

    def spine(self, f):
        z = self.z(f)
        return Vector((self.sx * z + self.ix, self.sy * z + self.iy, z))

    def arm(self, side, f):
        """
        The outboard run at a height, which below the armpit is an arm.

        Returns nothing where the arm is not separable from the body, which on a
        scan captured arms-down is everything above the elbow. That is why the
        shoulder is placed from the shoulder's width instead.
        """
        found = self.blobs(self.band(f))
        if len(found) < 2:
            return None
        mid = self.spine(f).x
        outer = [b for b in found if (b[0] - mid) * side > 0.14]
        if not outer:
            return None
        pick = max(outer, key=lambda b: abs(b[0] - mid))
        return Vector((pick[0], pick[1], self.z(f)))

    def arm_at(self, side, f):
        """The arm's own axis at a height, from the samples either side of it."""
        got = [(g, p) for g, p in
               ((0.40 + 0.008 * i, self.arm(side, 0.40 + 0.008 * i)) for i in range(34))
               if p]
        if not got:
            raise SystemExit("no arm found: is this a whole figure?")
        below = [x for x in got if x[0] <= f]
        above = [x for x in got if x[0] >= f]
        if below and above:
            (f0, p0), (f1, p1) = below[-1], above[0]
            return p0.lerp(p1, 0 if f1 == f0 else (f - f0) / (f1 - f0))
        return (above[0][1] if above else below[-1][1]).copy()

    def leg(self, side, f):
        """
        A leg at a height. Below the crotch the only thing there is legs, so
        which side of the spine a vertex falls is the whole of the question, and
        no run finding is needed. Kept below the fingertips so that a hand
        hanging by a thigh is never mistaken for one.
        """
        mid = self.spine(f).x
        sel = [p for p in self.band(f, 0.016) if (p.x - mid) * side > 0]
        if len(sel) < 20:
            return None
        return Vector((statistics.median(p.x for p in sel),
                       statistics.median(p.y for p in sel), self.z(f)))


def joints(body):
    J = {}
    for name in ("Hips", "Spine", "Spine1", "Spine2", "Neck", "Head"):
        J[name] = body.spine(HEIGHTS[name])
    J["HeadTop_End"] = Vector((J["Head"].x, J["Head"].y, body.lo + body.span))

    half = body.width(0.812) / 2
    for side, s in ((1, "Left"), (-1, "Right")):
        shoulder = body.spine(HEIGHTS["Shoulder"])
        J[f"{s}Shoulder"] = Vector((shoulder.x + side * 0.035, shoulder.y, shoulder.z))

        # The shoulder joint sits inboard of the deltoid, which is the widest
        # part of it. Three quarters of the way out is where a humeral head is.
        arm = body.spine(HEIGHTS["Arm"])
        J[f"{s}Arm"] = Vector((arm.x + side * half * 0.74, arm.y + 0.015, arm.z))

        J[f"{s}ForeArm"] = body.arm_at(side, HEIGHTS["ForeArm"])
        J[f"{s}Hand"] = body.arm_at(side, HEIGHTS["Hand"])
        tip = body.arm_at(side, HEIGHTS["HandTip"])
        J[f"{s}HandEnd"] = J[f"{s}Hand"] + (tip - J[f"{s}Hand"]) * 1.6

        hip = body.spine(HEIGHTS["UpLeg"])
        J[f"{s}UpLeg"] = Vector((hip.x + side * 0.052 * body.span, hip.y, hip.z))
        for name, fallback in (("Leg", 0.09), ("Foot", 0.09)):
            f = HEIGHTS[name]
            J[f"{s}{name}"] = body.leg(side, f) or Vector(
                (body.spine(f).x + side * fallback, hip.y, body.z(f)))
        toe = body.leg(side, HEIGHTS["ToeBase"]) or (
            J[f"{s}Foot"] + Vector((0, -0.08, -0.06)))
        J[f"{s}ToeBase"] = toe
        J[f"{s}Toe_End"] = Vector((toe.x, toe.y - 0.05, toe.z))
    return J


def build(J):
    parent, order = {}, []
    for chain in CHAINS:
        for a, b in zip(chain, chain[1:]):
            if b not in parent:
                parent[b] = a
                order.append(b)
    order = ["Hips"] + order
    kids = {b: [] for b in order}
    for b, p in parent.items():
        kids[p].append(b)

    data = bpy.data.armatures.new("Armature")
    rig = bpy.data.objects.new("Armature", data)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="EDIT")

    for name in order:
        bone = data.edit_bones.new(f"mixamorig:{name}")
        bone.head = J[name]
        # A joint points at the joints it carries, so a chain is continuous and
        # a fork like the hips points up the middle of what it forks into.
        bone.tail = (sum((J[k] for k in kids[name]), Vector()) / len(kids[name])
                     if kids[name] else J[name] + Vector((0, 0, 0.05)))
        if (bone.tail - bone.head).length < 0.012:
            bone.tail = bone.head + Vector((0, 0, 0.02))
    for name in order:
        if name in parent:
            data.edit_bones[f"mixamorig:{name}"].parent = \
                data.edit_bones[f"mixamorig:{parent[name]}"]
    bpy.ops.object.mode_set(mode="OBJECT")

    for leaf in LEAVES:
        data.bones[f"mixamorig:{leaf}"].use_deform = False
    return rig, order


def weigh(mesh, rig, order):
    bpy.ops.object.select_all(action="DESELECT")
    mesh.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")

    held = {g.name: 0 for g in mesh.vertex_groups}
    for v in mesh.data.vertices:
        for g in v.groups:
            if g.weight > 0.01:
                held[mesh.vertex_groups[g.group].name] += 1
    empty = [n for n in order
             if n not in LEAVES and held.get(f"mixamorig:{n}", 0) == 0]
    print(f"  weighted; joints holding nothing: {empty or 'none'}")


def rebind_as_t(mesh, rig):
    """
    Swing the arms out level, bake that into the mesh, and make it the pose the
    skeleton rests in.

    A pose in src/lib/poses.ts is a rotation from where a joint rests, not an
    absolute orientation, which is what lets one squat fit rigs of different
    proportions. It also means the arm poses only land on a rig that rests in a
    T: applied to one bound arms-down, "down out of the T and forward" means
    down another 76 degrees, through the ribs. So the model is rebound here.

    The order is what matters. Baking the deformation into the mesh first and
    then applying the pose leaves a figure standing in a T whose skeleton
    believes a T is neutral. Doing it the other way leaves the mesh behind.
    """
    def point(name, target):
        pose = rig.pose.bones[f"mixamorig:{name}"]
        turn = (pose.tail - pose.head).normalized().rotation_difference(Vector(target))
        head = pose.head.copy()
        pose.matrix = (Matrix.Translation(head) @ turn.to_matrix().to_4x4()
                       @ Matrix.Translation(-head) @ pose.matrix)
        bpy.context.view_layer.update()

    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="POSE")
    for side, s in ((1, "Left"), (-1, "Right")):
        for bone in ("Arm", "ForeArm", "Hand"):
            point(f"{s}{bone}", (side, 0, 0))
    bpy.ops.object.mode_set(mode="OBJECT")

    bpy.context.view_layer.objects.active = mesh
    before = [m.name for m in mesh.modifiers]
    bpy.ops.object.modifier_copy(modifier=mesh.modifiers[0].name)
    bpy.ops.object.modifier_apply(
        modifier=next(m.name for m in mesh.modifiers if m.name not in before))

    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.armature_apply()
    bpy.ops.object.mode_set(mode="OBJECT")

    for name in ("LeftArm", "RightArm", "Spine", "LeftUpLeg"):
        bone = rig.data.bones[f"mixamorig:{name}"]
        d = (bone.tail_local - bone.head_local).normalized()
        print(f"  {name:12s} rests {d.x:+.2f} {d.y:+.2f} {d.z:+.2f}")


def main():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    source, target = sys.argv[1], sys.argv[2]

    print(f"reading {source}")
    mesh = load(source)
    clean(mesh)
    pts = face_forward(mesh)

    body = Body(pts)
    print(f"  {body.span:.3f} m tall, {len(pts)} vertices")
    body.fit_spine()

    rig, order = build(joints(body))
    print(f"  {len(rig.data.bones)} joints")
    weigh(mesh, rig, order)
    rebind_as_t(mesh, rig)

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=target, export_format="GLB",
                              export_yup=True, export_skins=True, export_apply=False)
    print(f"wrote {target}")


if __name__ == "__main__":
    main()
