import { useState, useRef, useCallback, useEffect } from 'react';
import {
  FilesetResolver,
  FaceLandmarker,
  HandLandmarker,
} from '@mediapipe/tasks-vision';
import { PortalState, Point2D } from '../types';
import {
  smoothPoint2D,
  smoothScalar,
  smoothAngle,
  OneEuroPoint2DFilter,
} from '../utils/smoothing';
import { RawFaceDetection, VideoDimensions } from './useSpatialFaceTracker';

export interface UseMediaPipeOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  isStreaming: boolean;
  smoothingFactor: number;
  onFaceDetections: (
    faces: RawFaceDetection[],
    portal: PortalState | null,
    videoDims?: VideoDimensions
  ) => void;
  onPortalUpdate: (portal: PortalState | null) => void;
  isSimulationMode: boolean;
  isHandTrackingReleased: boolean;
}

const LOCAL_WASM_PATH = '/mediapipe/wasm';
const CDN_WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
const LOCAL_HAND_MODEL = '/mediapipe/models/hand_landmarker.task';
const CDN_HAND_MODEL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const LOCAL_FACE_MODEL = '/mediapipe/models/face_landmarker.task';
const CDN_FACE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export function computeOrientedCorners(
  center: Point2D,
  width: number,
  height: number,
  angle: number
): Point2D[] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const hw = width * 0.5;
  const hh = height * 0.5;

  // Vector along portal width (tangent)
  const wx = cos * hw;
  const wy = sin * hw;
  // Vector along portal height (normal)
  const hx = -sin * hh;
  const hy = cos * hh;

  return [
    { x: center.x - wx + hx, y: center.y - wy + hy }, // Top-Left
    { x: center.x + wx + hx, y: center.y + wy + hy }, // Top-Right
    { x: center.x + wx - hx, y: center.y + wy - hy }, // Bottom-Right
    { x: center.x - wx - hx, y: center.y - wy - hy }, // Bottom-Left
  ];
}

export function useMediaPipe({
  videoRef,
  isStreaming,
  smoothingFactor,
  onFaceDetections,
  onPortalUpdate,
  isSimulationMode,
  isHandTrackingReleased,
}: UseMediaPipeOptions) {
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [handCount, setHandCount] = useState(0);

  const isReadyRef = useRef(false);
  const isModelLoadingRef = useRef(false);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  // Portal state tracking refs for smoothing
  const portalRef = useRef<PortalState | null>(null);
  const fingertipFiltersRef = useRef({
    first: new OneEuroPoint2DFilter(1.3, 0.025),
    second: new OneEuroPoint2DFilter(1.3, 0.025),
  });
  const animFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastTimestampRef = useRef<number>(0);

  // Initialize MediaPipe vision models with local files first, then CDN fallback
  const initModels = useCallback(async (): Promise<boolean> => {
    if (isReadyRef.current) return true;
    if (isModelLoadingRef.current) return false;
    isModelLoadingRef.current = true;
    setIsModelLoading(true);
    setModelError(null);

    // Clean up any existing instances first
    try {
      handLandmarkerRef.current?.close();
      handLandmarkerRef.current = null;
    } catch {}
    try {
      faceLandmarkerRef.current?.close();
      faceLandmarkerRef.current = null;
    } catch {}

    try {
      // 1. FilesetResolver: Attempt local WASM first, fallback to pinned CDN
      let vision: any;
      try {
        vision = await FilesetResolver.forVisionTasks(LOCAL_WASM_PATH);
      } catch (localWasmErr) {
        console.info('Local WASM files not reachable, falling back to CDN WASM:', localWasmErr);
        vision = await FilesetResolver.forVisionTasks(CDN_WASM_PATH);
      }

      // Helper to create HandLandmarker trying local model then CDN
      async function createHandLandmarker(delegate: 'GPU' | 'CPU') {
        try {
          return await HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: LOCAL_HAND_MODEL, delegate },
            runningMode: 'VIDEO',
            numHands: 4,
            minHandDetectionConfidence: 0.45,
            minHandPresenceConfidence: 0.45,
            minTrackingConfidence: 0.45,
          });
        } catch {
          return await HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: CDN_HAND_MODEL, delegate },
            runningMode: 'VIDEO',
            numHands: 4,
            minHandDetectionConfidence: 0.45,
            minHandPresenceConfidence: 0.45,
            minTrackingConfidence: 0.45,
          });
        }
      }

      // 2. Hand Landmarker (attempt GPU delegate, fallback to CPU)
      let handLandmarker: HandLandmarker;
      try {
        handLandmarker = await createHandLandmarker('GPU');
      } catch (gpuHandErr) {
        console.warn('HandLandmarker GPU delegate failed, attempting CPU fallback:', gpuHandErr);
        handLandmarker = await createHandLandmarker('CPU');
      }
      handLandmarkerRef.current = handLandmarker;

      // Helper to create FaceLandmarker trying local model then CDN
      async function createFaceLandmarker(delegate: 'GPU' | 'CPU') {
        try {
          return await FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: LOCAL_FACE_MODEL, delegate },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            runningMode: 'VIDEO',
            numFaces: 2,
            minFaceDetectionConfidence: 0.45,
            minFacePresenceConfidence: 0.45,
            minTrackingConfidence: 0.45,
          });
        } catch {
          return await FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: CDN_FACE_MODEL, delegate },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            runningMode: 'VIDEO',
            numFaces: 2,
            minFaceDetectionConfidence: 0.45,
            minFacePresenceConfidence: 0.45,
            minTrackingConfidence: 0.45,
          });
        }
      }

      // 3. Face Landmarker (attempt GPU delegate, fallback to CPU)
      let faceLandmarker: FaceLandmarker;
      try {
        faceLandmarker = await createFaceLandmarker('GPU');
      } catch (gpuFaceErr) {
        console.warn('FaceLandmarker GPU delegate failed, attempting CPU fallback:', gpuFaceErr);
        faceLandmarker = await createFaceLandmarker('CPU');
      }
      faceLandmarkerRef.current = faceLandmarker;

      isReadyRef.current = true;
      setIsReady(true);
      isModelLoadingRef.current = false;
      setIsModelLoading(false);
      return true;
    } catch (err: unknown) {
      console.warn('Failed to load MediaPipe models:', err);
      // Clean up on partial failure
      try {
        handLandmarkerRef.current?.close();
        handLandmarkerRef.current = null;
      } catch {}
      try {
        faceLandmarkerRef.current?.close();
        faceLandmarkerRef.current = null;
      } catch {}

      const msg =
        err instanceof Error ? err.message : 'Failed to initialize MediaPipe models';
      setModelError(msg);
      isModelLoadingRef.current = false;
      setIsModelLoading(false);
      return false;
    }
  }, []);

  // Main processing loop
  useEffect(() => {
    let active = true;

    const processFrame = () => {
      if (!active) return;

      // SIMULATION MODE
      if (isSimulationMode) {
        const time = Date.now() * 0.001;

        // Simulated Portal between two moving fingertips
        const f1: Point2D = {
          x: 0.35 + Math.sin(time * 0.8) * 0.08,
          y: 0.45 + Math.cos(time * 0.7) * 0.06,
        };
        const f2: Point2D = {
          x: 0.65 + Math.cos(time * 0.9) * 0.08,
          y: 0.55 + Math.sin(time * 0.6) * 0.06,
        };

        const simCenter: Point2D = {
          x: (f1.x + f2.x) / 2,
          y: (f1.y + f2.y) / 2,
        };
        const rawDist = Math.hypot(f2.x - f1.x, f2.y - f1.y);
        const simWidth = rawDist * 1.05;
        const simHeight = Math.max(rawDist * 0.58, 0.12);
        const simRadius = rawDist * 0.48;
        const simAngle = Math.atan2(f2.y - f1.y, f2.x - f1.x);

        const corners = computeOrientedCorners(simCenter, simWidth, simHeight, simAngle);

        const simPortal: PortalState = {
          center: simCenter,
          radius: simRadius,
          width: simWidth,
          height: simHeight,
          angle: simAngle,
          isActive: true,
          fingertip1: f1,
          fingertip2: f2,
          corners,
          mode: 'two-hands',
        };

        portalRef.current = simPortal;
        onPortalUpdate(simPortal);
        setHandCount((prev) => (prev === 2 ? prev : 2));

        // Smooth continuous cyclic motion across the portal (no teleportation jumps):
        // Moves from left (0.24, outside portal) smoothly through center (0.50, inside portal)
        // to right (0.76, transformed showcase), and reverses back smoothly.
        const face1X = 0.50 - 0.26 * Math.cos(time * 0.7);
        const face1Y = 0.50 + Math.sin(time * 0.5) * 0.03;
        const headYaw = Math.sin(time * 0.7) * 0.3; // subtle head turn matching motion direction

        // Jaw opening cycle and blink for expression demonstration
        const jawOpenVal = Math.max(0, Math.sin(time * 2.2) * 0.85);
        const blinkVal = Math.sin(time * 1.5) > 0.85 ? 1 : 0;
        const browVal = Math.sin(time * 0.8) > 0.2 ? 0.5 : 0;

        const buildFaceLandmarks = (cx: number, cy: number, yaw = 0) => {
          const lms = new Array(478).fill(null).map(() => ({ x: cx, y: cy, z: 0 }));
          const hw = 0.075;
          const hh = 0.10;
          lms[1] = { x: cx + yaw * 0.02, y: cy + 0.01, z: -0.04 }; // nose tip
          lms[168] = { x: cx, y: cy - 0.01, z: -0.02 }; // nose bridge
          lms[10] = { x: cx, y: cy - hh, z: 0 }; // forehead
          lms[152] = { x: cx, y: cy + hh, z: 0 }; // chin
          lms[33] = { x: cx - 0.045, y: cy - 0.025, z: 0 }; // left eye
          lms[263] = { x: cx + 0.045, y: cy - 0.025, z: 0 }; // right eye
          lms[234] = { x: cx - hw, y: cy + 0.01, z: 0 }; // left cheek
          lms[454] = { x: cx + hw, y: cy + 0.01, z: 0 }; // right cheek
          return lms;
        };

        const simFaces: RawFaceDetection[] = [
          {
            landmarks: buildFaceLandmarks(face1X, face1Y, headYaw),
            blendshapes: {
              jawOpen: jawOpenVal,
              eyeBlinkLeft: blinkVal,
              eyeBlinkRight: blinkVal,
              browInnerUp: browVal,
            },
          },
          {
            landmarks: buildFaceLandmarks(0.82, 0.45, 0),
            blendshapes: {
              jawOpen: 0,
              eyeBlinkLeft: 0,
              eyeBlinkRight: 0,
              browInnerUp: 0,
            },
          },
        ];

        onFaceDetections(simFaces, simPortal, { width: 1280, height: 720 });
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // REAL WEBCAM MODE
      const video = videoRef.current;
      if (
        isStreaming &&
        video &&
        video.readyState >= 2 &&
        handLandmarkerRef.current &&
        faceLandmarkerRef.current
      ) {
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          // Guarantee strictly monotonic timestamps required by MediaPipe Tasks Vision
          const now = performance.now();
          const timestamp = Math.max(now, (lastTimestampRef.current || 0) + 1);
          lastTimestampRef.current = timestamp;

          // 1. Process Hands. A released portal stays fixed while face tracking continues.
          if (isHandTrackingReleased) {
            const currentPortal = portalRef.current;
            const releasedPortal = currentPortal
              ? {
                  ...currentPortal,
                  isActive: false,
                  fingertip1: null,
                  fingertip2: null,
                  mode: 'locked' as const,
                }
              : null;
            portalRef.current = releasedPortal;
            setHandCount(0);
            onPortalUpdate(releasedPortal);
          } else {
          try {
            const handResult = handLandmarkerRef.current.detectForVideo(
              video,
              timestamp
            );
            const hands = handResult.landmarks;
            setHandCount((prev) => (prev === hands.length ? prev : hands.length));

            let detectedPortal: PortalState | null = null;

            if (hands.length >= 2) {
              // Select the two dominant hands forming the portal
              let selectedHands = hands;
              if (hands.length > 2) {
                if (portalRef.current && portalRef.current.fingertip1 && portalRef.current.fingertip2) {
                  const prev1 = portalRef.current.fingertip1;
                  const prev2 = portalRef.current.fingertip2;
                  const handsWithDist = hands.map((h) => {
                    const tip = h[8];
                    const d1 = Math.hypot(tip.x - prev1.x, tip.y - prev1.y);
                    const d2 = Math.hypot(tip.x - prev2.x, tip.y - prev2.y);
                    return { hand: h, minD: Math.min(d1, d2) };
                  });
                  handsWithDist.sort((a, b) => a.minD - b.minD);
                  selectedHands = [handsWithDist[0].hand, handsWithDist[1].hand];
                } else {
                  const handsWithCenterDist = hands.map((h) => {
                    const tip = h[8];
                    return { hand: h, d: Math.hypot(tip.x - 0.5, tip.y - 0.5) };
                  });
                  handsWithCenterDist.sort((a, b) => a.d - b.d);
                  selectedHands = [handsWithCenterDist[0].hand, handsWithCenterDist[1].hand];
                }
              }

              // Continuous tracking of fingertip 1 and 2 to eliminate 180° angular flips
              const tipA = selectedHands[0][8];
              const tipB = selectedHands[1][8];
              let p1: Point2D;
              let p2: Point2D;

              const prevF1 = portalRef.current?.fingertip1;
              const prevF2 = portalRef.current?.fingertip2;

              if (prevF1 && prevF2 && portalRef.current?.isActive) {
                // Match to previous fingertips minimizing total distance
                const distA1 = Math.hypot(tipA.x - prevF1.x, tipA.y - prevF1.y);
                const distB2 = Math.hypot(tipB.x - prevF2.x, tipB.y - prevF2.y);
                const distA2 = Math.hypot(tipA.x - prevF2.x, tipA.y - prevF2.y);
                const distB1 = Math.hypot(tipB.x - prevF1.x, tipB.y - prevF1.y);

                if (distA1 + distB2 <= distA2 + distB1) {
                  p1 = { x: tipA.x, y: tipA.y };
                  p2 = { x: tipB.x, y: tipB.y };
                } else {
                  p1 = { x: tipB.x, y: tipB.y };
                  p2 = { x: tipA.x, y: tipA.y };
                }
              } else {
                // Canonical initial ordering based on dominant separation axis
                if (Math.abs(tipA.x - tipB.x) >= Math.abs(tipA.y - tipB.y)) {
                  p1 = tipA.x <= tipB.x ? { x: tipA.x, y: tipA.y } : { x: tipB.x, y: tipB.y };
                  p2 = tipA.x <= tipB.x ? { x: tipB.x, y: tipB.y } : { x: tipA.x, y: tipA.y };
                } else {
                  p1 = tipA.y <= tipB.y ? { x: tipA.x, y: tipA.y } : { x: tipB.x, y: tipB.y };
                  p2 = tipA.y <= tipB.y ? { x: tipB.x, y: tipB.y } : { x: tipA.x, y: tipA.y };
                }
              }

              // Adaptive low-pass filtering reduces fingertip tremor while following
              // faster movements with less lag than a fixed EMA.
              p1 = fingertipFiltersRef.current.first.filter(p1, timestamp);
              p2 = fingertipFiltersRef.current.second.filter(p2, timestamp);

              const rawCenter: Point2D = {
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2,
              };
              const rawDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
              const rawAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
              const rawWidth = Math.min(Math.max(rawDistance * 1.05, 0.12), 0.95);
              const rawHeight = Math.min(Math.max(rawDistance * 0.58, 0.09), 0.65);
              const rawRadius = rawDistance * 0.48;

              // Derive portal geometry from filtered fingertips to avoid stacking
              // a second filter that would make the portal lag behind the hands.
              const smoothedCenter = rawCenter;
              const smoothedRadius = rawRadius;
              const smoothedWidth = rawWidth;
              const smoothedHeight = rawHeight;
              const smoothedAngle = rawAngle;

              const corners = computeOrientedCorners(
                smoothedCenter,
                smoothedWidth,
                smoothedHeight,
                smoothedAngle
              );

              detectedPortal = {
                center: smoothedCenter,
                radius: smoothedRadius,
                width: smoothedWidth,
                height: smoothedHeight,
                angle: smoothedAngle,
                isActive: true,
                fingertip1: { x: p1.x, y: p1.y },
                fingertip2: { x: p2.x, y: p2.y },
                corners,
                mode: 'two-hands',
              };

              portalRef.current = detectedPortal;
            } else if (hands.length === 1) {
              // One hand detected -> single-hand pinch between index (8) and thumb (4)
              const hand = hands[0];
              let thumb = hand[4];
              let index = hand[8];
              if (thumb.x > index.x) {
                const tmp = thumb;
                thumb = index;
                index = tmp;
              }

              const rawCenter: Point2D = {
                x: (thumb.x + index.x) / 2,
                y: (thumb.y + index.y) / 2,
              };
              const rawDistance = Math.hypot(index.x - thumb.x, index.y - thumb.y);
              const rawAngle = Math.atan2(index.y - thumb.y, index.x - thumb.x);
              const rawWidth = Math.min(Math.max(rawDistance * 1.8, 0.15), 0.7);
              const rawHeight = Math.min(Math.max(rawDistance * 1.1, 0.1), 0.5);
              const rawRadius = rawDistance * 0.9;

              let smoothedCenter = rawCenter;
              let smoothedRadius = rawRadius;
              let smoothedWidth = rawWidth;
              let smoothedHeight = rawHeight;
              let smoothedAngle = rawAngle;

              if (portalRef.current) {
                const prev = portalRef.current;
                smoothedCenter = smoothPoint2D(prev.center, rawCenter, smoothingFactor);
                smoothedRadius = smoothScalar(prev.radius, rawRadius, smoothingFactor);
                smoothedWidth = smoothScalar(prev.width, rawWidth, smoothingFactor);
                smoothedHeight = smoothScalar(prev.height, rawHeight, smoothingFactor);
                smoothedAngle = smoothAngle(prev.angle, rawAngle, smoothingFactor);
              }

              const corners = computeOrientedCorners(
                smoothedCenter,
                smoothedWidth,
                smoothedHeight,
                smoothedAngle
              );

              detectedPortal = {
                center: smoothedCenter,
                radius: smoothedRadius,
                width: smoothedWidth,
                height: smoothedHeight,
                angle: smoothedAngle,
                isActive: true,
                fingertip1: { x: thumb.x, y: thumb.y },
                fingertip2: { x: index.x, y: index.y },
                corners,
                mode: 'one-hand-pinch',
              };

              portalRef.current = detectedPortal;
            } else {
              // Hands lost: maintain previous portal position as 'locked' (inactive!)
              if (portalRef.current) {
                detectedPortal = {
                  ...portalRef.current,
                  isActive: false, // Inactive! No fingertips active
                  fingertip1: null,
                  fingertip2: null,
                  mode: 'locked',
                };
                portalRef.current = detectedPortal;
              }
            }

            onPortalUpdate(detectedPortal);
          } catch (handErr) {
            console.error('Hand tracking error:', handErr);
          }
          }

          // 2. Process Faces
          try {
            const faceResult = faceLandmarkerRef.current.detectForVideo(
              video,
              timestamp
            );
            const rawFaceDetections: RawFaceDetection[] = [];

            if (faceResult.faceLandmarks) {
              for (let i = 0; i < faceResult.faceLandmarks.length; i++) {
                const lms = faceResult.faceLandmarks[i];

                // Extract blendshapes map
                const blendshapeMap: Record<string, number> = {};
                if (faceResult.faceBlendshapes && faceResult.faceBlendshapes[i]) {
                  const categories = faceResult.faceBlendshapes[i].categories;
                  for (const cat of categories) {
                    blendshapeMap[cat.categoryName] = cat.score;
                  }
                }

                // Facial transformation matrix
                let matrixData: number[] | undefined;
                if (
                  faceResult.facialTransformationMatrixes &&
                  faceResult.facialTransformationMatrixes[i]
                ) {
                  matrixData = Array.from(
                    faceResult.facialTransformationMatrixes[i].data
                  );
                }

                rawFaceDetections.push({
                  landmarks: lms,
                  blendshapes: blendshapeMap,
                  matrix: matrixData,
                });
              }
            }

            onFaceDetections(rawFaceDetections, portalRef.current, {
              width: video.videoWidth || 1280,
              height: video.videoHeight || 720,
            });
          } catch (faceErr) {
            console.error('Face tracking error:', faceErr);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      active = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    isStreaming,
    videoRef,
    smoothingFactor,
    onFaceDetections,
    onPortalUpdate,
    isSimulationMode,
    isHandTrackingReleased,
  ]);

  // Clean up landmarkers and resources on unmount
  useEffect(() => {
    return () => {
      try {
        handLandmarkerRef.current?.close();
        handLandmarkerRef.current = null;
      } catch {}
      try {
        faceLandmarkerRef.current?.close();
        faceLandmarkerRef.current = null;
      } catch {}
      isReadyRef.current = false;
    };
  }, []);

  return {
    isModelLoading,
    modelError,
    isReady,
    handCount,
    initModels,
  };
}
