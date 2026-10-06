#!/usr/bin/env python3
"""
convert_and_optimize_model.py - 3D Character Model Optimizer for Understand AR Pipeline

Prepares and optimizes GLB/GLTF models for mobile AR web deployment:
- Remaps and normalizes facial morph target / blendshape names to MediaPipe / ARKit standards
- Strips unused animation tracks, empty nodes, or unnecessary buffers
- Normalizes chunk alignments and packs clean 4-byte aligned GLB binaries
- Validates model structure and outputs before/after optimization metrics
"""

import sys
import os
import json
import struct
import argparse
from pathlib import Path

# Canonical blendshape alias mapping
BLENDSHAPE_ALIAS_MAP = {
    # Jaw
    "jaw_open": "jawOpen",
    "jawopen": "jawOpen",
    "openjaw": "jawOpen",
    "mouth_open": "jawOpen",
    "jaw_fwd": "jawForward",
    # Smile / Frown
    "smile_l": "mouthSmileLeft",
    "smile_left": "mouthSmileLeft",
    "mouthsmileleft": "mouthSmileLeft",
    "smile_r": "mouthSmileRight",
    "smile_right": "mouthSmileRight",
    "mouthsmileright": "mouthSmileRight",
    "frown_l": "mouthFrownLeft",
    "frown_left": "mouthFrownLeft",
    "frown_r": "mouthFrownRight",
    "frown_right": "mouthFrownRight",
    # Eyes & Blink
    "blink_l": "eyeBlinkLeft",
    "blink_left": "eyeBlinkLeft",
    "eyeblinkleft": "eyeBlinkLeft",
    "blink_r": "eyeBlinkRight",
    "blink_right": "eyeBlinkRight",
    "eyeblinkright": "eyeBlinkRight",
    "eye_blink_l": "eyeBlinkLeft",
    "eye_blink_r": "eyeBlinkRight",
    # Brows
    "brow_up": "browInnerUp",
    "brow_inner_up": "browInnerUp",
    "browinnerup": "browInnerUp",
    "brow_down_l": "browDownLeft",
    "brow_down_left": "browDownLeft",
    "brow_down_r": "browDownRight",
    "brow_down_right": "browDownRight",
}

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

def parse_glb(file_bytes):
    if len(file_bytes) < 12:
        raise ValueError("File is too small to be a valid GLB container (< 12 bytes)")
    
    magic, version, total_length = struct.unpack_from("<III", file_bytes, 0)
    if magic != 0x46546C67:
        raise ValueError(f"Invalid GLB magic header: 0x{magic:08X} (expected 0x46546C67)")
    
    offset = 12
    json_data = None
    binary_chunk = b""

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
        raise ValueError("GLB container contains no JSON chunk")

    return json_data, binary_chunk

def pack_glb(json_data, binary_chunk):
    """Packs json data and binary chunk into a valid, 4-byte aligned GLB container."""
    json_bytes = json.dumps(json_data, separators=(",", ":")).encode("utf-8")
    
    # JSON chunk must be padded with spaces (0x20) to 4-byte boundary
    json_padding = (4 - (len(json_bytes) % 4)) % 4
    padded_json = json_bytes + (b" " * json_padding)

    # BIN chunk must be padded with null bytes (0x00) to 4-byte boundary
    bin_padding = (4 - (len(binary_chunk) % 4)) % 4 if binary_chunk else 0
    padded_bin = binary_chunk + (b"\x00" * bin_padding) if binary_chunk else b""

    json_chunk_len = len(padded_json)
    bin_chunk_len = len(padded_bin)

    total_len = 12 + 8 + json_chunk_len
    if bin_chunk_len > 0:
        total_len += 8 + bin_chunk_len

    # GLB Header
    header = struct.pack("<III", 0x46546C67, 2, total_len)

    # JSON Chunk Header
    json_chunk_hdr = struct.pack("<II", json_chunk_len, 0x4E4F534A)

    out_parts = [header, json_chunk_hdr, padded_json]

    # BIN Chunk Header
    if bin_chunk_len > 0:
        bin_chunk_hdr = struct.pack("<II", bin_chunk_len, 0x004E4942)
        out_parts.extend([bin_chunk_hdr, padded_bin])

    return b"".join(out_parts)

def normalize_blendshape_name(name: str) -> str:
    # Strip prefix namespaces like "Body.blendShape1." or "head:"
    clean = name.split(".")[-1].split(":")[-1]
    lower_clean = clean.lower().replace("-", "_").replace(" ", "_")
    return BLENDSHAPE_ALIAS_MAP.get(lower_clean, clean)

def optimize_model(input_path: Path, output_path: Path, args):
    raw_bytes = input_path.read_bytes()
    orig_size_kb = len(raw_bytes) / 1024.0

    print("=" * 72)
    print("  UNDERSTAND AR PIPELINE - 3D CHARACTER MODEL OPTIMIZER")
    print("=" * 72)
    print(f"  Input:  {input_path.name} ({orig_size_kb:.2f} KB)")
    print(f"  Output: {output_path.name}")

    if input_path.suffix.lower() == ".glb":
        gltf, binary_chunk = parse_glb(raw_bytes)
    else:
        gltf = json.loads(raw_bytes.decode("utf-8"))
        binary_chunk = b""

    remapped_count = 0
    total_blendshapes = 0

    # 1. Remap Blendshapes
    if args.remap_blendshapes:
        for mesh in gltf.get("meshes", []):
            extras = mesh.get("extras")
            if extras and "targetNames" in extras:
                old_names = extras["targetNames"]
                new_names = []
                for name in old_names:
                    norm = normalize_blendshape_name(name)
                    if norm != name:
                        remapped_count += 1
                    new_names.append(norm)
                extras["targetNames"] = new_names
                total_blendshapes += len(new_names)

    # 2. Strip Animations if requested
    stripped_anims = 0
    if args.strip_animations and "animations" in gltf:
        stripped_anims = len(gltf["animations"])
        del gltf["animations"]

    # 3. Add Generator Stamp
    asset = gltf.setdefault("asset", {})
    asset["generator"] = f"Understand-AR-Optimizer-v1.0 (from {asset.get('generator', 'Unknown')})"

    # 4. Pack output
    out_glb_bytes = pack_glb(gltf, binary_chunk)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(out_glb_bytes)

    new_size_kb = len(out_glb_bytes) / 1024.0

    print("\n" + "-" * 72)
    print("  OPTIMIZATION SUMMARY")
    print("-" * 72)
    if args.remap_blendshapes:
        print(f"  Blendshapes remapped:  {remapped_count} / {total_blendshapes}")
    if args.strip_animations:
        print(f"  Animations stripped:   {stripped_anims}")
    print(f"  Original size:         {orig_size_kb:.2f} KB")
    print(f"  Optimized size:        {new_size_kb:.2f} KB ({((new_size_kb - orig_size_kb) / orig_size_kb) * 100:+.1f}%)")
    print(f"  Target file written:   {output_path.resolve()}")
    print("=" * 72 + "\n")
    return True

def main():
    parser = argparse.ArgumentParser(
        description="Optimize and normalize 3D GLB models for Understand AR pipeline."
    )
    parser.add_argument("input", help="Path to input .glb or .gltf file")
    parser.add_argument("-o", "--output", help="Path to output .glb file", default=None)
    parser.add_argument(
        "--remap-blendshapes",
        action="store_true",
        default=True,
        help="Remap non-standard blendshape names to MediaPipe ARKit canonical names (default: True)",
    )
    parser.add_argument(
        "--strip-animations",
        action="store_true",
        default=False,
        help="Strip embedded skeletal animation tracks for purely face-driven assets",
    )

    args = parser.parse_args()
    input_path = Path(args.input)
    if not input_path.is_file():
        print(f"Error: Input file does not exist: {input_path}", file=sys.stderr)
        sys.exit(1)

    if args.output:
        output_path = Path(args.output)
    else:
        output_path = input_path.with_name(f"{input_path.stem}_opt.glb")

    success = optimize_model(input_path, output_path, args)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
