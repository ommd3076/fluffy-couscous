# Technical Architecture • AR Portal

Comprehensive architectural specifications, data flow pipelines, coordinate systems, and component hierarchies for the **Understand AR Portal** engine.

---

## 1. High-Level Data Flow

```mermaid
flowchart TD
    Camera["Webcam Video Stream\n(navigator.mediaDevices)"] --> Video["HTMLVideoElement\n(object-fit: cover)"]
    Video --> MP["MediaPipe Vision Pipeline\n(@mediapipe/tasks-vision)"]
    
    subgraph Vision Pipeline
        MP --> HL["HandLandmarker\n(2 Index Fingertips)"]
        MP --> FL["FaceLandmarker\n(478 Landmarks + 52 Blendshapes)"]
    end
    
    HL --> Spatial["Spatial Face Tracker\n(Isotropic Euclidean Math)"]
    FL --> Spatial
    
    Spatial --> Crossing{"Aperture Boundary\nCrossing Check\n(!wasInside && isInside)"}
    Crossing -- Trigger --> Latch["Latch Transformed Role\n(Nick / Judy)"]
    
    Latch --> Three["Three.js WebGL Scene\n(PerspectiveCamera + Occluder)"]
    FL --> Three
    Three --> Render["Real-Time 60 FPS Render\n(Canvas Overlay)"]
```

---

## 2. Spatial Coordinate System & Projection Pipeline

1. **Normalized Space $[0, 1] \times [0, 1]$**:
   - MediaPipe outputs $(x, y)$ in normalized video texture space.
2. **Aspect-Corrected Isotropic Space**:
   - $\text{aspect} = \frac{W_{\text{video}}}{H_{\text{video}}}$.
   - $x_{\text{iso}} = x \cdot \text{aspect}$, $y_{\text{iso}} = y$.
   - Prevents anamorphic distortion when calculating distances, fingertip angles, and aperture containment.
3. **Screen Pixel Space**:
   - Mapped according to CSS `object-fit: cover` with letterboxing/cropping offsets:
   - $\text{scale} = \max(\frac{W_{\text{container}}}{W_{\text{video}}}, \frac{H_{\text{container}}}{H_{\text{video}}})$.
4. **Three.js World Frustum Space**:
   - Projected to Three.js camera coordinate frame at face depth plane $Z_{\text{depth}}$:
   - $X_{\text{world}} = (2 \frac{X_{\text{screen}}}{W} - 1) \cdot \frac{W_{\text{frustum}}}{2}$.
   - $Y_{\text{world}} = -(2 \frac{Y_{\text{screen}}}{H} - 1) \cdot \frac{H_{\text{frustum}}}{2}$.

---

## 3. State Machine & Dropout Coasting Grace Periods

```mermaid
stateDiagram-v2
    [*] --> Idle: Mount
    Idle --> RequestingCamera: User clicks Enable Camera
    RequestingCamera --> CameraError: Permission Denied
    RequestingCamera --> LoadingModels: Permission Granted
    LoadingModels --> Tracking: WASM & Tasks Loaded
    
    state Tracking {
        [*] --> Unassigned: Face Detected
        Unassigned --> Assigned: User Taps Face Reticle
        Assigned --> Coasting: Face Momentarily Dropped (1-5 frames)
        Coasting --> Assigned: Reacquired
        Coasting --> Lost: Missing 6-30 frames
        Lost --> Pruned: Exceeds 30 frames
        
        Assigned --> Transformed: Crosses Holographic Boundary
        Transformed --> Transformed: Attached to Person
    }
```

---

## 4. Key Performance Optimizations

* **Zero Memory Leak Lifecycle**: Explicit disposal of Three.js geometries, materials, textures, and MediaPipe landmarkers on unmount.
* **Gated Frame Processing**: MediaPipe inference runs strictly when `video.currentTime !== lastVideoTime` (~30 FPS), decoupled from the 60 FPS WebGL rendering loop.
* **Monotonic Clamping**: Timestamps clamped to strictly increasing values to eliminate browser timer clamping exceptions.
* **Double-Buffered Filtering**: Adaptive 1-Euro and Exponential Moving Average (EMA) filters suppress sensor jitter while eliminating tracking lag.
