# AR Portal • On-Device Hand Gestures & Character Morph

A production-hardened, single-camera in-browser Augmented Reality web application built with **React 19**, **Three.js (WebGL)**, and **MediaPipe Tasks Vision**. Runs 100% on-device with zero webcam streaming to any external server. Recreates the holographic portal aperture and character transformation seen in the reference clip (`1-VID-20261005-WA0006.mp4`).

---

## 🌟 Key Architecture & Capabilities

### 1. Oriented Rectangular Holographic Aperture (Reference Video Fidelity)
- **Reference Match**: Matches the cyber holographic aperture between fingertips seen in the reference clip:
  - Oriented rectangle spanning between the two index fingertips (landmark 8) or single-hand pinch.
  - Animated 3D perspective scanner grid with depth lines and scrolling holographic scanlines.
  - Corner HUD bracket reticles, dynamic status tags (`APERTURE ACTIVE // 60 FPS`), and glowing fingertip anchor pins.
  - Calculates true isotropic bounding box using dynamic camera aspect ratio (`videoDims.width / videoDims.height`).

### 2. Dual-Face Tracking, Role Assignment & Crossing Latch
- **Tracking & Assignment**: Simultaneously tracks up to 2 faces with persistent Euclidean spatial tracking.
- **Privacy First**: Interactive holographic reticles allow tapping a detected face to assign **🦊 Nick Wilde** or **🐰 Judy Hopps**. No automated facial recognition or biometric database storage.
- **Crossing Latch**: Assigned faces remain untouched in their normal video feed until their facial center physically crosses into the active holographic portal aperture (`!wasInside && isInside`). Faces already inside upon assignment must transition through the boundary.
- **Dropout & Tracking-Lost Tolerance**: Includes a 1,500ms grace window for temporary occlusions or rapid head turns. Transitions through `coasting` (frames 1–5) to `lost` (frames 6–30) with an interactive guidance alert before pruning.
- **Isotropic Coordinate Math & 180° Flip Prevention**: Calculates portal orientation and containment in isotropic Euclidean space, accounting for sensor aspect ratio and matching fingertips through temporal nearest-neighbor sorting to prevent 180° angular flips when hands are vertical or diagonal.
- **Honest Model Error Gate**: Rejects silent fallbacks to toy placeholders if a 3D model fails to load, surfacing explicit error statuses in the HUD and Settings modal.

### 3. Three.js Character Rigging & Depth Occlusion Mask
- **Transformation Matrix Conversion**: Converts MediaPipe 4x4 facial transformation matrices to Three.js camera basis and slerp-smoothed Quaternions.
- **Depth Occluder Mesh**: Invisible face mesh (`renderOrder: 0`, `colorWrite: false, depthWrite: true`) rendered directly behind the 3D head model to cleanly occlude background pixels and prevent user face clipping.
- **Real-Time Facial Blendshapes**: Drives jaw articulation (`jawOpen`), bilateral eyelid blinking (`eyeBlinkLeft`, `eyeBlinkRight`), and brow expressions (`browInnerUp`).

### 4. Pinned Local MediaPipe Serving & Main-Thread Performance Profile
- **Pinned Local Assets**: MediaPipe `@mediapipe/tasks-vision@0.10.18` served locally from `public/mediapipe/`:
  - `public/mediapipe/models/hand_landmarker.task` (7.8 MB)
  - `public/mediapipe/models/face_landmarker.task` (3.7 MB)
  - `public/mediapipe/wasm/` (6 WASM and JS engine binaries)
  - Automatic fallback to Google Storage CDN if local assets encounter network issues.
- **Main-Thread vs Web Worker Feasibility**:
  - Web Workers with `OffscreenCanvas` on mobile browsers (especially iOS Safari) suffer from severe canvas context loss and high `createImageBitmap` transfer overhead.
  - Our architecture runs MediaPipe vision on the main thread gated strictly by camera frame updates (`video.currentTime !== lastVideoTime`). Vision inference runs only when a new camera frame arrives (~30 FPS), while Three.js WebGL renders at 60 FPS, ensuring minimal thermal load and stable frame rates.

### 5. Double-Buffered Smoothing
- Double-buffered time-aware exponential filters and **1-Euro Filter** (`OneEuroFilter`, `OneEuroPoint2DFilter`) eliminate high-frequency hand tremor during portal calibration while maintaining snappy responsiveness during fast movements.

### 6. Asset Gate Resolution & In-App Custom Model Upload
- In compliance with intellectual property standards, production Disney assets cannot be redistributed.
- The project documents evaluated community candidates in `ASSETS.md` and provides:
  - High-quality temporary stylized GLB models (`nick_candidate.glb`, `judy_candidate.glb`)
  - Instant zero-latency procedural fallbacks
  - **In-App Custom Model Upload**: Users can upload their own `.glb` character files via **Settings (`Sliders` icon)** -> **3D Model Engine & Asset Gate** with immediate in-memory hot reloading.

---

## 🛠️ Python & Node.js Tooling

The repository provides standalone tools for inspecting and optimizing 3D character models:

### Python 3D Model Inspector
Inspects GLB binary headers, polygons, materials, and MediaPipe blendshape compatibility:
```bash
python scripts/inspect_model.py public/models/nick_candidate.glb
python scripts/inspect_model.py public/models/judy_candidate.glb
```

### Python 3D Model Optimizer
Remaps blendshapes to canonical MediaPipe names and packs clean 4-byte aligned GLBs:
```bash
python scripts/convert_and_optimize_model.py input_model.glb -o output_opt.glb --remap-blendshapes --strip-animations
```

### Automated Headless Browser & Unit Testing
```bash
# Run unit and integration tests (Vitest)
npm test

# Run headless Chromium camera pipeline verification
node scripts/test_real_camera.mjs
```

---

## 🚀 Getting Started

### Local Development
```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev
# Opens http://localhost:3000

# Build production bundle
npm run build
```

### Demo Simulation Mode
No webcam? Visit `http://localhost:3000/?demo=1` or click the **Sparkles** icon in the top HUD to enter the fully interactive synthetic simulation mode.

---

## ☁️ Deploying to Vercel

The application is fully pre-configured for one-click deployment on Vercel:
1. Push repository to GitHub or GitLab.
2. Import project into Vercel Dashboard.
3. Default Vite build settings (`npm run build` -> `dist`) are used.
4. `vercel.json` ensures required permissions policies (`Permissions-Policy: camera=*`) and routing.

---

## 📄 License & Intellectual Property
- **Source Code**: MIT License.
- **Character IP**: Nick Wilde, Judy Hopps, and *Zootopia* are copyrighted intellectual property of **Disney Enterprises, Inc.** See `ASSETS.md` for complete legal audit and candidate register.
