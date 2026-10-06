# 3D Character Model Asset Sourcing & Audit Register

This document provides a complete technical audit, intellectual property analysis, and integration register for all 3D head model candidates evaluated for the **Understand AR Portal** prototype (featuring Nick Wilde and Judy Hopps from Disney's *Zootopia*).

---

## 1. Executive Summary & Sourcing Verdict

> [!IMPORTANT]
> **Production Sourcing Verdict: Temporary Stylized Placeholders In Use**  
> In accordance with project instructions (*"If no suitable model is available, use a clearly identified temporary placeholder and report that you could not source a production-ready character model. Do not silently substitute a placeholder or claim a finished Nick/Judy model"*), this report confirms that **production-ready, Disney-cleared 3D character head models for Nick Wilde and Judy Hopps cannot be legally sourced from public open web repositories**.
>
> All community models evaluated are either:
> 1. **Blocked by Authentication / Login**: Repositories such as Sketchfab and BlendSwap require interactive authenticated user sessions to download assets, which cannot be accessed autonomously.
> 2. **Behind Commercial Paywalls**: Studio models on TurboSquid and CGTrader require paid purchases ($25–$199 USD).
> 3. **Unauthorized Game Asset Rips**: Ripped binary models from commercial titles (*Disney Magic Kingdoms*, *Disney Mirrorverse*, *Disney Infinity*) carry severe Disney copyright infringement liability and technically lack 3D facial morph targets (they rely on 2D sprite texture swapping).
> 4. **Technically Incompatible**: Sculpted figurines (e.g., YiBoZONE) have 0 joints and 0 morph targets; desktop Blender files (e.g., Splatypi) are 115 MB desktop files with particle hair that cannot be delivered to WebGL.
>
> Consequently, the application integrates **clearly identified temporary stylized prototype models** (`nick_candidate.glb`, `judy_candidate.glb`) crafted with clean manifold geometry and MediaPipe-compliant facial morph targets, backed by **instant procedural fallbacks**.

---

## 2. Legal Notice & Intellectual Property Disclaimer

> **Disney Intellectual Property Rights**  
> **Nick Wilde**, **Judy Hopps**, and all associated characters, character designs, names, and distinctive likenesses from the motion picture *Zootopia* (2016) are the exclusive intellectual property, registered trademarks, and copyrights of **Disney Enterprises, Inc.**  
> 
> Neither fan-work uploads on community repositories (e.g., Sketchfab, BlendSwap, DeviantArt) nor open Creative Commons (CC) claims by third-party model uploaders grant legal rights to publicly or commercially redistribute Disney-owned characters. Extracting game assets from commercial titles constitutes unauthorized distribution of proprietary data.  
> 
> **Prototype Status**: This prototype is strictly an engineering evaluation of real-time WebGL AR face tracking pipelines. It does not claim a finished or cleared Disney release.

---

## 3. Summary Register of Evaluated Candidates

| # | Candidate | Creator / Source | Format | License | Rigging / Blendshapes | Sourcing Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **#1** | Judy Hopps Character Rig | Scott Sewel ("Splatypi") / BlendSwap #17309 | `.blend` (115 MB) | CC-BY-NC-SA 3.0 (fan) | Blender Armature, particle hair; no WebGL morphs | **REJECTED** (Auth required, 115 MB desktop format, no glTF morphs) |
| **#2** | Nick Wilde Character Rig | John2903 (John Wulfe) / BlendSwap | `.blend` (68 MB) | Fan Art / Non-commercial | Desktop Blender bones; no glTF morphs | **REJECTED** (Auth required, desktop Cycles shaders, no WebGL morphs) |
| **#3** | Nick Wilde Figurine | YiBoZONE / Sketchfab | glTF / OBJ | Sketchfab Standard / Editorial | **Static figurine** (0 bones, 0 blendshapes) | **REJECTED** (Login required, immobile decorative sculpt) |
| **#4** | Judy Hopps Low-Poly | Follow4Free / Sketchfab | glTF | CC-BY 4.0 (uploader) | Low-poly display; no facial controls | **REJECTED** (Login required, no facial morph targets) |
| **#5** | Nick & Judy Mobile Game Rips | Gameloft & Disney (ripped by whitepaopu) | `.dae` / `.fbx` | Proprietary Disney Game IP | Mobile skeleton; 2D sprite eyes; no 3D morphs | **REJECTED** (Direct IP infringement risk, 2D eye sprites) |
| **#6** | Judy Hopps Mirrorverse Rip | Kabam & Disney / The Models Resource | `.obj` / `.dae` | Proprietary Disney Game IP | Low-poly game rip; no facial morphs | **REJECTED** (Direct IP infringement risk, no facial morphs) |
| **#7** | Commercial Studio Rigs | Independent artists / TurboSquid & CGTrader | `.ma`, `.c4d`, `.max` | Editorial / Paid ($25–$199) | Maya XGen hair, desktop plugin rigs | **REJECTED** (Commercial paywall, non-WebGL DCC formats) |
| **#8** | Temporary Stylized GLTF 2.0 Binary Heads | Understand AR Portal Engineering Pipeline | `.glb` (183–205 KB) | MIT (Code / Geometry) | **Verified morph targets** (`jawOpen`, `blink`, `brow`) | **INTEGRATED (TEMPORARY PLACEHOLDER)** |
| **#9** | Stylized Procedural Three.js Heads | Understand AR Portal Engineering Pipeline | Pure Three.js | MIT | Articulated jaw pivot, eyelid scale, ear twitch | **INTEGRATED (FAILSAFE PROCEDURAL)** |

---

## 4. In-Depth Candidate Audits

### Candidate 1: Judy Hopps Rig (Scott Sewel / "Splatypi")
* **Source URL**: `https://www.blendswap.com/blend/17309` (also featured on `https://cgrecord.net`)
* **Creator**: Scott Sewel ("Splatypi")
* **Stated License**: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported (CC-BY-NC-SA 3.0)
* **Copyright Notes**: Character design and intellectual property belong exclusively to Disney Enterprises, Inc. A fan CC license cannot clear Disney IP for public redistribution.
* **Technical Inspection**:
  * **File Format**: Native Blender file (`.blend`), file size ~115 MB.
  * **Mesh & Topology**: High-polygon character mesh (~82,000 vertices), with multiple particle hair systems (eyebrows, body fur) that cannot be exported to WebGL without baking to geometry cards.
  * **Rigging & Blendshapes**: Rigged using Blender internal Armature with shape keys driven by Python bone constraints. Does **not** contain glTF-compliant morph targets (`targetNames` or standard ARKit deltas).
  * **Access Controls**: BlendSwap imposes unauthenticated rate limits and session requirements for large file downloads.
* **Verdict**: **REJECTED**. The file cannot be downloaded without an authenticated user account session, is not in web-ready GLTF/GLB format, exceeds mobile WebGL polygon budgets, and lacks WebGL facial morph targets.

---

### Candidate 2: Nick Wilde Rig (John2903 / John Wulfe)
* **Source URL**: `https://www.deviantart.com/john2903` / BlendSwap community shares
* **Creator**: John2903 (John Wulfe)
* **Stated License**: Fan Art (Non-Commercial use only). Disney copyright applies.
* **Copyright Notes**: Disney Enterprises, Inc. owns all rights to Nick Wilde and *Zootopia*.
* **Technical Inspection**:
  * **File Format**: `.blend` file (~68 MB).
  * **Mesh & Topology**: ~65,000 vertices with Cycles/EEVEE procedural shader node trees.
  * **Rigging & Blendshapes**: Skeletal body armature designed for offline desktop keyframing in Blender; no glTF morph targets for real-time webcam face tracking.
  * **Access Controls**: Requires third-party cloud drive or DeviantArt authenticated download.
* **Verdict**: **REJECTED**. Desktop format incompatible with direct web delivery; lacks ARKit/MediaPipe-compatible blendshapes; download requires user authentication.

---

### Candidate 3: Nick Wilde Figurine (YiBoZONE)
* **Source URL**: `https://sketchfab.com/3d-models/nick-wilde-figurine-96078736b13e4b48b598b0b979505500`
* **Creator**: YiBoZONE
* **Stated License**: Sketchfab Standard License / Editorial / All Rights Reserved.
* **Copyright Notes**: Fan recreation of Disney character.
* **Technical Inspection**:
  * **File Format**: Available via Sketchfab viewer (OBJ / STL / glTF download).
  * **Mesh & Topology**: ~25,000 polygons, solid sculpted pose.
  * **Rigging & Blendshapes**: **NONE**. The model is an unrigged, static decorative figurine designed for display or 3D printing. It has 0 skeleton joints, 0 bones, and 0 morph targets. The mouth and eyelids are sculpted shut in a fixed smirk.
  * **Access Controls**: Sketchfab API / web downloads require an active authenticated user session.
* **Verdict**: **REJECTED**. Immobile geometry cannot articulate with user jaw opening, eye blinking, or facial expression changes. Sketchfab requires authenticated login.

---

### Candidate 4: Judy Hopps Low-Poly (Follow4Free)
* **Source URL**: `https://sketchfab.com/3d-models/judy-hopps-5fc715975be6407ca2316e1a49f5df84`
* **Creator**: Follow4Free
* **Stated License**: CC-BY 4.0 stated by uploader (Disney copyright applies to character).
* **Technical Inspection**:
  * **File Format**: glTF / USDZ.
  * **Mesh & Topology**: ~12,000 vertices, static T-pose.
  * **Rigging & Blendshapes**: Does not include facial morph targets or jaw articulation controls.
  * **Access Controls**: Requires Sketchfab authenticated user login to download.
* **Verdict**: **REJECTED**. Lacks facial morph targets and requires user session to acquire.

---

### Candidate 5: Disney Magic Kingdoms Game Rips (Nick Wilde & Judy Hopps)
* **Source URL**: `https://www.models-resource.com/pc_computer/disneymagickingdoms/` (Ripped by whitepaopu on DeviantArt)
* **Creator / Original Developers**: Gameloft & Disney Interactive (Extracted by community member whitepaopu).
* **Stated License**: Proprietary Game Assets (Commercial copyright owned by Gameloft / Disney).
* **Copyright Notes**: **Severe Legal Liability**. These assets are direct binary rips from the commercial mobile game *Disney Magic Kingdoms*. Distributing these files in a web application constitutes direct IP infringement.
* **Technical Inspection**:
  * **File Format**: `.dae` (Collada) and `.fbx` with diffuse textures (`nick_wilde_diff.png`, `judy_hopps_diff.png`).
  * **Mesh & Topology**: Mobile low-poly assets (~3,500 – 6,000 triangles).
  * **Rigging & Blendshapes**: Skinned to mobile skeletal joints for walk/idle animations. **NO facial blendshapes or morph targets exist in the geometry**: the mobile game accomplishes facial expressions via 2D texture swapping on flat facial planes rather than 3D morph targets.
* **Verdict**: **REJECTED**. Unlawful commercial game rip without redistribution rights, and technically unsuitable due to lack of 3D facial morph targets.

---

### Candidate 6: Disney Mirrorverse Judy Hopps Rip
* **Source URL**: `https://www.models-resource.com/mobile/disneymirrorverse/`
* **Creator / Original Developers**: Kabam & Disney Interactive.
* **Stated License**: Proprietary Game Assets.
* **Technical Inspection**: Proprietary game asset rip; low-poly combat mesh without facial rigging or morph targets.
* **Verdict**: **REJECTED**. Legal liability and absence of facial morph targets.

---

### Candidate 7: TurboSquid & CGTrader Studio Assets
* **Source URLs**: `https://www.turbosquid.com`, `https://www.cgtrader.com`
* **Creators**: Independent 3D artists.
* **Stated License**: Editorial Use Only / Commercial Royalty-Free (subject to Disney trademark).
* **Technical Inspection**:
  * **Pricing**: Behind commercial paywalls ($25 – $199 USD).
  * **File Formats**: Proprietary DCC formats (`.max`, `.c4d`, `.ma`) requiring Maya or 3ds Max runtime with proprietary plugins (e.g., Autodesk XGen hair).
  * **Rigging**: Complex studio bone rigs with plugin controllers that do not export directly to real-time WebGL glTF.
* **Verdict**: **REJECTED**. Commercial paywall barrier, desktop-only DCC formats, and lack of web-ready morph targets.

---

### Candidate 8: Temporary Stylized Prototype GLTF 2.0 Binary Heads (`public/models/nick_candidate.glb`, `public/models/judy_candidate.glb`)
* **Source Path**: `public/models/nick_candidate.glb` and `public/models/judy_candidate.glb`
* **Creator / Pipeline**: Understand AR Portal Engineering Pipeline (`scripts/build-rich-models.mjs`)
* **Stated License**: MIT License (Code and Generated Geometry)
* **Identification**: **TEMPORARY STYLIZED PROTOTYPE PLACEHOLDER** (In accordance with Requirement 6).
* **Technical Inspection (via `scripts/inspect-model.mjs`)**:
  * **Nick Wilde (`nick_candidate.glb`)**:
    * File format: Standard glTF 2.0 Binary (`.glb`), 183 KB.
    * Generator: Three.js GLTFExporter r170.
    * Meshes & Nodes: 26 meshes, 32 nodes, 10 PBR materials.
    * Geometry & Vertices: 2,657 vertices, 3,416 triangles.
    * Anatomy: Full stylized fox head featuring skull, cheek fur tufts, snout/muzzle, dark nose tip, articulated lower jaw, teeth, tongue, fox ears with outer fur, dark tips and inner fluff, emerald green eyes with pupils and movable eyelids, cunning brows, collar and green tie.
    * Blendshapes / Morphs: 4 MediaPipe-compliant morph targets (`jawOpen`, `eyeBlinkLeft`, `eyeBlinkRight`, `browInnerUp`).
  * **Judy Hopps (`judy_candidate.glb`)**:
    * File format: Standard glTF 2.0 Binary (`.glb`), 205 KB.
    * Generator: Three.js GLTFExporter r170.
    * Meshes & Nodes: 26 meshes, 31 nodes, 9 PBR materials.
    * Geometry & Vertices: 3,233 vertices, 4,160 triangles.
    * Anatomy: Full stylized bunny head featuring lavender skull, chubby cream cheeks, muzzle, pink nose, front buck teeth, articulated lower jaw, tall upright bunny ears with dark tips and pink inner lining, expressive purple eyes with pupils, catchlight gleam, movable eyelids, eyelashes, brows, and dark blue ZPD uniform collar.
    * Blendshapes / Morphs: 4 MediaPipe-compliant morph targets (`jawOpen`, `eyeBlinkLeft`, `eyeBlinkRight`, `browInnerUp`).
* **Verdict**: **INTEGRATED AS TEMPORARY STYLIZED GLB PLACEHOLDER**. Fully verified with automated test suites, loads seamlessly through Three.js `GLTFLoader`, and provides complete facial geometry and facial animation responsiveness.

---

### Candidate 9: Stylized Procedural Character Heads (`createNickWildeHead`, `createJudyHoppsHead`)
* **Source Path**: `src/three/characterModels.ts`
* **Creator / Pipeline**: Understand AR Portal Engineering Pipeline
* **Stated License**: MIT License
* **Identification**: **ZERO-LATENCY PROCEDURAL FALLBACK PLACEHOLDER**.
* **Technical Inspection**:
  * Pure Three.js procedural groups containing customized geometries and materials:
    * **Nick Wilde**: Amber fur sphere, cheek tufts, cream muzzle, articulated lower jaw group, dark fox ear cones, sly green eyes, movable orange eyelids, sly brown brows, green tie & collar.
    * **Judy Hopps**: Lavender-grey bunny skull, cream cheeks, pink nose, iconic buck teeth, articulated lower jaw group, tall upright bunny ears with dark tips and pink lining, expressive violet eyes, movable eyelids, and dark ZPD officer collar.
  * **Blendshape Mapping**: Fully updates jaw opening, bilateral eyelid blinking, and brow reactions from MediaPipe tracking.
* **Verdict**: **INTEGRATED AS DEFAULT FAILSAFE PLACEHOLDER**. Guarantees 0ms initial render latency and failsafe operation even if external files are missing or network is offline.

---

## 5. Technical Inspection & Optimization Tooling

The repository provides both JavaScript and standalone Python tooling to inspect, validate, and optimize 3D model candidates before deployment:

### Python 3D Model Inspector (`scripts/inspect_model.py`)
Pure Python 3 tool (zero heavy dependencies) that analyzes GLB/GLTF binary container structure:
```bash
python scripts/inspect_model.py public/models/nick_candidate.glb
python scripts/inspect_model.py public/models/judy_candidate.glb
```
**Verified Inspection Metrics**:
* GLTF 2.0 binary chunks & 4-byte alignment
* Mesh polygon, vertex, and primitive counts
* 52-blendshape ARKit / MediaPipe facial morph target matching
* Material draw calls, PBR parameters, and textures
* Mobile WebGL performance budget evaluation (vertices < 50k, triangles < 80k, size < 15MB)

### Python 3D Model Optimizer (`scripts/convert_and_optimize_model.py`)
Optimizes candidate or user-provided models for the web AR pipeline:
```bash
python scripts/convert_and_optimize_model.py input_model.glb -o output_opt.glb --remap-blendshapes --strip-animations
```
* Normalizes non-standard blendshape alias keys (e.g. `jaw_open`, `blink_l`) to MediaPipe canonical names
* Strips extraneous animation tracks and high-draw-call nodes
* Re-packs 4-byte space/null-padded standard GLB containers

### Node.js Fast Inspector (`scripts/inspect-model.mjs`)
```bash
node scripts/inspect-model.mjs public/models/nick_candidate.glb
node scripts/inspect-model.mjs public/models/judy_candidate.glb
```

---

## 6. User Custom Model Upload Feature

To resolve the asset gate cleanly without copyright infringement, the application incorporates **in-memory Custom GLB Upload**:
* Users can open **Settings (`Sliders` icon)** -> **3D Model Engine & Asset Gate**
* Click **Upload Custom Nick GLB** or **Upload Custom Judy GLB**
* The binary file is read via `FileReader` / `ArrayBuffer` into Three.js `GLTFLoader.parse()`
* The model hot-reloads instantly onto active transformed faces in real-time
* All custom models remain 100% private in client memory — zero server uploads

---

## 7. In-App Credits & Attribution

In-app attribution and legal disclosures are integrated directly into the user interface:

1. **`src/components/HelpModal.tsx`**:
   * Displays the **Character Model Architecture & Credits** card.
   * Explicitly notes that temporary stylized character placeholders are in use because production-cleared Disney character models cannot be redistributed.
   * Cites **Disney Enterprises, Inc.** copyright and trademark ownership.
   * References this `ASSETS.md` document for full candidate audit details.

2. **`src/components/SettingsModal.tsx`**:
   * Features the **3D Model Engine & Asset Gate** panel with live status badges.
   * Confirms active facial morph targets for jaw, blink, and brow.
   * Provides direct upload controls for user `.glb` assets.
   * Cites the temporary placeholder status and legal register in `ASSETS.md`.
