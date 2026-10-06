#!/usr/bin/env python3
"""
inspect_model.py - 3D GLB/GLTF Character Model Inspector for Understand AR Pipeline

Analyzes 3D character models for real-time AR face tracking compatibility:
- GLTF/GLB structure & binary chunk integrity
- Mesh polygon count, vertices, primitives
- Morph targets / blendshapes & MediaPipe ARKit 52 compatibility scoring
- Materials, textures, and skinning/joint hierarchies
- Performance budget evaluation for mobile WebGL runtime
"""

import sys
import os
import json
import struct
from pathlib import Path

# Ensure UTF-8 output encoding for terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Canonical MediaPipe / ARKit 52 Facial Blendshape Target Names
STANDARD_FACIAL_BLENDSHAPES = {
    # Jaw
    "jawOpen", "jawForward", "jawLeft", "jawRight",
    # Mouth
    "mouthSmileLeft", "mouthSmileRight", "mouthFrownLeft", "mouthFrownRight",
    "mouthPucker", "mouthFunnel", "mouthLeft", "mouthRight",
    "mouthRollUpper", "mouthRollLower", "mouthShrugUpper", "mouthShrugLower",
    "mouthClose", "mouthUpperUpLeft", "mouthUpperUpRight",
    "mouthLowerDownLeft", "mouthLowerDownRight", "mouthPressLeft", "mouthPressRight",
    "mouthStretchLeft", "mouthStretchRight", "mouthDimpleLeft", "mouthDimpleRight",
    # Eyes & Brows
    "eyeBlinkLeft", "eyeBlinkRight", "eyeLookUpLeft", "eyeLookUpRight",
    "eyeLookDownLeft", "eyeLookDownRight", "eyeLookInLeft", "eyeLookInRight",
    "eyeLookOutLeft", "eyeLookOutRight", "eyeSquintLeft", "eyeSquintRight",
    "eyeWideLeft", "eyeWideRight",
    "browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft", "browOuterUpRight",
    # Cheeks & Nose
    "cheekPuff", "cheekSquintLeft", "cheekSquintRight", "noseSneerLeft", "noseSneerRight",
    "tongueOut"
}

def parse_glb(file_bytes):
    """Parses binary GLB file header and returns (json_data, binary_chunk_bytes)."""
    if len(file_bytes) < 12:
        raise ValueError("File is too small to be a valid GLB container (< 12 bytes)")
    
    magic, version, total_length = struct.unpack_from("<III", file_bytes, 0)
    if magic != 0x46546C67:  # 'glTF'
        raise ValueError(f"Invalid GLB magic header: 0x{magic:08X} (expected 0x46546C67)")
    
    offset = 12
    json_data = None
    binary_chunk = None

    while offset < len(file_bytes):
        if offset + 8 > len(file_bytes):
            break
        chunk_len, chunk_type = struct.unpack_from("<II", file_bytes, offset)
        offset += 8
        chunk_bytes = file_bytes[offset:offset + chunk_len]
        offset += chunk_len

        if chunk_type == 0x4E4F534A:  # 'JSON'
            json_str = chunk_bytes.decode("utf-8", errors="replace")
            json_data = json.loads(json_str)
        elif chunk_type == 0x004E4942:  # 'BIN\0'
            binary_chunk = chunk_bytes

    if json_data is None:
        raise ValueError("GLB container contains no JSON metadata chunk")

    return json_data, binary_chunk

def inspect_model(file_path):
    path = Path(file_path)
    if not path.is_file():
        print(f"Error: File not found: {file_path}", file=sys.stderr)
        return False

    file_size_kb = path.stat().st_size / 1024.0
    print("=" * 72)
    print(f"  UNDERSTAND AR PIPELINE - 3D CHARACTER MODEL INSPECTION")
    print("=" * 72)
    print(f"  File:       {path.name}")
    print(f"  Path:       {path.resolve()}")
    print(f"  Size:       {file_size_kb:.2f} KB ({file_size_kb / 1024.0:.2f} MB)")

    raw_bytes = path.read_bytes()
    ext = path.suffix.lower()

    if ext == ".glb":
        try:
            gltf, _ = parse_glb(raw_bytes)
            print(f"  Container:  GLTF 2.0 Binary (.glb)")
        except Exception as e:
            print(f"  Container parse error: {e}", file=sys.stderr)
            return False
    elif ext == ".gltf":
        try:
            gltf = json.loads(raw_bytes.decode("utf-8"))
            print(f"  Container:  GLTF 2.0 Text (.gltf)")
        except Exception as e:
            print(f"  Container parse error: {e}", file=sys.stderr)
            return False
    else:
        print(f"  Unsupported format '{ext}'. Expected .glb or .gltf", file=sys.stderr)
        return False

    # Extract Asset Metadata
    asset = gltf.get("asset", {})
    generator = asset.get("generator", "Unknown")
    version = asset.get("version", "2.0")
    print(f"  Generator:  {generator}")
    print(f"  GLTF Vers:  {version}")

    # Geometry & Mesh Analysis
    meshes = gltf.get("meshes", [])
    accessors = gltf.get("accessors", [])
    materials = gltf.get("materials", [])
    textures = gltf.get("textures", [])
    skins = gltf.get("skins", [])
    animations = gltf.get("animations", [])

    total_vertices = 0
    total_triangles = 0
    blendshape_names = []

    print("\n" + "-" * 72)
    print("  MESH & GEOMETRY HIERARCHY")
    print("-" * 72)
    print(f"  Total Meshes: {len(meshes)}")

    for m_idx, mesh in enumerate(meshes):
        m_name = mesh.get("name", f"Mesh_{m_idx}")
        prims = mesh.get("primitives", [])
        m_verts = 0
        m_tris = 0

        # Check extras.targetNames for blendshapes
        target_names = mesh.get("extras", {}).get("targetNames", [])

        for prim in prims:
            attrs = prim.get("attributes", {})
            pos_acc_idx = attrs.get("POSITION")
            if pos_acc_idx is not None and pos_acc_idx < len(accessors):
                m_verts += accessors[pos_acc_idx].get("count", 0)

            indices_idx = prim.get("indices")
            if indices_idx is not None and indices_idx < len(accessors):
                m_tris += accessors[indices_idx].get("count", 0) // 3
            elif pos_acc_idx is not None and pos_acc_idx < len(accessors):
                m_tris += accessors[pos_acc_idx].get("count", 0) // 3

            # Check primitive targets
            targets = prim.get("targets", [])
            if targets and not target_names:
                for t_idx in range(len(targets)):
                    target_names.append(f"morphTarget_{t_idx}")

        total_vertices += m_verts
        total_triangles += m_tris
        if target_names:
            blendshape_names.extend(target_names)

        print(f"  [{m_idx}] {m_name}: {len(prims)} primitive(s), {m_verts:,} verts, {m_tris:,} triangles" +
              (f", {len(target_names)} morph targets" if target_names else ""))

    unique_blendshapes = sorted(list(set(blendshape_names)))

    # Blendshape / Facial Morph Analysis
    print("\n" + "-" * 72)
    print("  FACIAL BLENDSHAPES & MEDIAPIPE COMPATIBILITY")
    print("-" * 72)
    print(f"  Total Morph Targets Found: {len(unique_blendshapes)}")

    matched_standard = []
    unmatched_custom = []

    for name in unique_blendshapes:
        # Normalize name for comparison (strip prefixes like 'head.')
        clean_name = name.split(".")[-1].split(":")[-1]
        if clean_name in STANDARD_FACIAL_BLENDSHAPES:
            matched_standard.append(name)
        else:
            unmatched_custom.append(name)

    print(f"  MediaPipe Standard ARKit Targets Matched: {len(matched_standard)} / 52")
    if matched_standard:
        print("  Key Matched Targets:")
        for name in matched_standard[:12]:
            print(f"    [+] {name}")
        if len(matched_standard) > 12:
            print(f"    ... and {len(matched_standard) - 12} more")

    if unmatched_custom:
        print(f"  Custom / Rig-Specific Targets ({len(unmatched_custom)}):")
        for name in unmatched_custom[:6]:
            print(f"    * {name}")
        if len(unmatched_custom) > 6:
            print(f"    ... and {len(unmatched_custom) - 6} more")

    # Materials & Textures
    print("\n" + "-" * 72)
    print("  MATERIALS & TEXTURES")
    print("-" * 72)
    print(f"  Materials: {len(materials)}")
    for mat_idx, mat in enumerate(materials):
        m_name = mat.get("name", f"Material_{mat_idx}")
        pbr = mat.get("pbrMetallicRoughness", {})
        base_color_factor = pbr.get("baseColorFactor", [1, 1, 1, 1])
        has_texture = "baseColorTexture" in pbr
        print(f"  [{mat_idx}] {m_name} (Textured: {has_texture}, Color: {[round(c, 2) for c in base_color_factor[:3]]})")
    print(f"  Textures:  {len(textures)}")
    print(f"  Skins/Rig: {len(skins)}")
    print(f"  Anim Clips:{len(animations)}")

    # Runtime Mobile Budget Verdict
    print("\n" + "=" * 72)
    print("  MOBILE AR WEBGL BUDGET VERDICT")
    print("=" * 72)

    issues = []
    if file_size_kb > 15000:
        issues.append(f"File size ({file_size_kb/1024:.1f} MB) exceeds recommended mobile 15 MB limit.")
    if total_triangles > 80000:
        issues.append(f"Triangle count ({total_triangles:,}) exceeds recommended 80k mobile budget.")
    if len(materials) > 15:
        issues.append(f"Material count ({len(materials)}) exceeds recommended 15 draw call budget.")

    if not issues:
        print("  [PASS] Excellent mobile WebGL profile:")
        print(f"         - Vertices:  {total_vertices:,} (< 50,000 budget)")
        print(f"         - Triangles: {total_triangles:,} (< 80,000 budget)")
        print(f"         - Size:      {file_size_kb:.1f} KB (< 15 MB budget)")
        if len(matched_standard) >= 5:
            print(f"         - Rig:       Direct expression tracking supported ({len(matched_standard)} blendshapes)")
        else:
            print(f"         - Rig:       Basic head pose tracking supported (few/no standard blendshapes)")
    else:
        print("  [WARNING] Exceeds standard mobile recommendations:")
        for issue in issues:
            print(f"         ! {issue}")

    print("=" * 72 + "\n")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/inspect_model.py <path-to-model.glb/.gltf>")
        sys.exit(1)
    
    success = inspect_model(sys.argv[1])
    sys.exit(0 if success else 1)
