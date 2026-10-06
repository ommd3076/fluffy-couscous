# Changelog • AR Portal

All notable changes to the **AR Portal** augmented reality project are documented here.

---

## [1.0.0] - 2026-10-06

### 🚀 Features & Core Capabilities
- **On-Device Gesture Tracking**: Dual index fingertip portal aperture creation with dynamic orientation and isotropic math.
- **Crossing Latch State Engine**: True boundary crossing detection (`!wasInside && isInside`) for character transformations.
- **Real-Time Facial Expression Mapping**: 4x4 facial transformation matrix to Three.js camera basis conversion with real-time blendshape articulation (`jawOpen`, `eyeBlinkLeft`, `eyeBlinkRight`, `browInnerUp`).
- **Depth Occlusion Mask**: Invisible face mesh occluder preventing user face clipping behind character heads.
- **Glassmorphic AR Lens UI**: Minimalist floating controls adhering to `better-ui` and `frontend-design` standards.
- **Telemetry HUDs**: Real-time FPS / latency performance counter and Euler head orientation angle telemetry widget.
- **Mobile Haptics & Snapshots**: Vibration patterns on mobile devices and full-canvas AR photo capture.
- **Local MediaPipe Serving**: Pinned `@mediapipe/tasks-vision` WASM and task models served locally with CDN fallback.

### 🧪 Quality Assurance & CI/CD
- 11 comprehensive Vitest test suites (54+ passing tests).
- Playwright end-to-end smoke test configuration across desktop and mobile devices.
- GitHub Actions continuous integration workflow.
- Automated Python/Node inspection and optimization scripts for 3D GLB assets.
