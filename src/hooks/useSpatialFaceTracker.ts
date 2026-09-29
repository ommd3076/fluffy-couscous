import { useState, useRef, useCallback } from 'react';
import { TrackedFace, CharacterRole, PortalState, Point2D } from '../types';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';

export interface RawFaceDetection {
  landmarks: Array<{ x: number; y: number; z: number }>;
  blendshapes?: Record<string, number>;
  matrix?: number[];
}

export interface VideoDimensions {
  width: number;
  height: number;
}

export function processRawFaceLandmarks(raw: RawFaceDetection) {
  const lms = raw.landmarks;
  if (!lms || lms.length === 0) return null;

  // Bounding box from landmarks
  let minX = 1,
    maxX = 0,
    minY = 1,
    maxY = 0;
  for (let i = 0; i < lms.length; i++) {
    const p = lms[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const width = Math.max(maxX - minX, 0.01);
  const height = Math.max(maxY - minY, 0.01);

  const nose = lms[1] || lms[0];
  const bridge = lms[168] || nose;
  const forehead = lms[10] || { x: minX, y: minY, z: 0 };
  const chin = lms[152] || { x: maxX, y: maxY, z: 0 };
  const leftCheek = lms[234] || { x: minX, y: bridge.y, z: 0 };
  const rightCheek = lms[454] || { x: maxX, y: bridge.y, z: 0 };
  const leftEye = lms[33] || bridge;
  const rightEye = lms[263] || bridge;

  // Pitch: vertical tilt between forehead and chin
  const pitch = Math.atan2(chin.z - forehead.z, chin.y - forehead.y) * 0.8;
  // Yaw: horizontal turn between cheeks and nose
  const yaw = Math.atan2(rightCheek.z - leftCheek.z, rightCheek.x - leftCheek.x) * 0.8;
  // Roll: head tilt between left and right eye
  const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

  // Apparent face scale (eye distance / box width)
  const eyeDist = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
  const scale = Math.max(width, eyeDist * 2.2);

  return {
    center: { x: bridge.x, y: bridge.y },
    box: { xMin: minX, yMin: minY, width, height },
    scale,
    rotation: { pitch, yaw, roll },
    blendshapes: raw.blendshapes || {},
    matrix: raw.matrix,
  };
}

/**
 * Checks whether an isotropic screen/video point is inside the active oriented portal rectangle.
 * Correctly accounts for real video aspect ratio, portal width, height, and rotation angle.
 */
export function isPointInsideOrientedPortal(
  point: Point2D,
  portal: PortalState,
  aspect: number
): boolean {
  if (!portal.isActive) return false;

  // Map to isotropic video coordinate space where 1 unit X has equal visual metric as 1 unit Y
  const ptX = point.x * aspect;
  const ptY = point.y;
  const centerX = portal.center.x * aspect;
  const centerY = portal.center.y;

  const dx = ptX - centerX;
  const dy = ptY - centerY;

  let angle = portal.angle;
  let halfW: number;
  let halfH: number;

  if (portal.fingertip1 && portal.fingertip2) {
    const tip1X = portal.fingertip1.x * aspect;
    const tip1Y = portal.fingertip1.y;
    const tip2X = portal.fingertip2.x * aspect;
    const tip2Y = portal.fingertip2.y;

    // Isotropic orientation angle and span between fingertips
    angle = Math.atan2(tip2Y - tip1Y, tip2X - tip1X);
    const dist = Math.hypot(tip2X - tip1X, tip2Y - tip1Y);
    halfW = (dist * 1.05) * 0.5;
    halfH = Math.max(dist * 0.58, 0.10) * 0.5;
  } else {
    const normW = portal.width || (portal.radius ? portal.radius * 2.1 : 0.35);
    const normH = portal.height || (portal.radius ? portal.radius * 1.3 : 0.22);
    halfW = (normW * aspect) * 0.5;
    halfH = normH * 0.5;
  }

  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);

  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  return Math.abs(localX) <= halfW && Math.abs(localY) <= halfH;
}

export function updateTrackedFaces(
  currentTracks: TrackedFace[],
  rawFaces: RawFaceDetection[],
  portal: PortalState | null,
  onTransform: (face: TrackedFace) => void,
  nextId: { current: number },
  now: number = Date.now(),
  videoDims: VideoDimensions = { width: 1280, height: 720 }
): TrackedFace[] {
  const processedDetections = rawFaces
    .map(processRawFaceLandmarks)
    .filter((d): d is NonNullable<typeof d> => d !== null);

  const aspect = Math.max(videoDims.width, 1) / Math.max(videoDims.height, 1);

  // Optimal Global Track Association using isotropic Euclidean distance
  const candidatePairs: { trackIdx: number; detIdx: number; dist: number }[] = [];

  for (let t = 0; t < currentTracks.length; t++) {
    for (let d = 0; d < processedDetections.length; d++) {
      const dx = (currentTracks[t].center.x - processedDetections[d].center.x) * aspect;
      const dy = currentTracks[t].center.y - processedDetections[d].center.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.5) { // Search gate
        candidatePairs.push({ trackIdx: t, detIdx: d, dist });
      }
    }
  }

  // Closest pairings matched first
  candidatePairs.sort((a, b) => a.dist - b.dist);

  const matchedTracks = new Set<number>();
  const matchedDets = new Set<number>();
  const updatedTracks: TrackedFace[] = [];

  for (const pair of candidatePairs) {
    if (matchedTracks.has(pair.trackIdx) || matchedDets.has(pair.detIdx)) continue;
    matchedTracks.add(pair.trackIdx);
    matchedDets.add(pair.detIdx);

    const track = currentTracks[pair.trackIdx];
    const det = processedDetections[pair.detIdx];

    track.center = det.center;
    track.box = det.box;
    track.scale = det.scale;
    track.rotation = det.rotation;
    track.blendshapes = det.blendshapes;
    track.matrix = det.matrix;
    track.lastSeenTime = now;
    track.missingFrames = 0;
    track.trackingStatus = 'tracking';

    // Check genuine portal crossing ONLY when assigned, NOT yet transformed, and portal is actively controlled
    if (portal && portal.isActive && track.assignedRole && !track.isTransformed) {
      const isInside = isPointInsideOrientedPortal(track.center, portal, aspect);
      const wasInside = track.wasInsidePortal === true;


      // Genuine crossing trigger: face transitions from outside to inside the portal
      if (!wasInside && isInside) {
        track.isTransformed = true;
        track.transformedAt = now;
        onTransform(track);
      }
      track.wasInsidePortal = isInside;
    } else {
      if (!portal || !portal.isActive) {
        track.wasInsidePortal = false;
      }
    }

    updatedTracks.push(track);
  }

  // Handle unmatched existing tracks (time-based grace period for brief dropouts/occlusions)
  const MISSING_TIMEOUT_MS = 1500; // 1.5s tolerance for blink / occlusion
  for (let t = 0; t < currentTracks.length; t++) {
    if (!matchedTracks.has(t)) {
      const track = currentTracks[t];
      track.missingFrames += 1;
      const timeSinceSeen = now - track.lastSeenTime;

      // Check if face completely left the camera frame
      const isOutOfFrame =
        track.center.x < -0.05 ||
        track.center.x > 1.05 ||
        track.center.y < -0.05 ||
        track.center.y > 1.05;

      if (!isOutOfFrame && timeSinceSeen <= MISSING_TIMEOUT_MS && track.missingFrames <= 30) {
        // Missing for 1-5 frames (~100ms): coasting; > 5 frames (~150-1000ms): lost warning!
        track.trackingStatus = track.missingFrames > 5 ? 'lost' : 'coasting';
        updatedTracks.push(track);
      }
      // If lost past timeout or completely out of frame, the track is pruned!
    }
  }

  // Add new detections (up to max 2 tracked faces total)
  for (let d = 0; d < processedDetections.length; d++) {
    if (!matchedDets.has(d) && updatedTracks.length < 2) {
      const det = processedDetections[d];
      const newTrack: TrackedFace = {
        id: `face-${nextId.current++}`,
        box: det.box,
        center: det.center,
        scale: det.scale,
        rotation: det.rotation,
        blendshapes: det.blendshapes,
        matrix: det.matrix,
        assignedRole: null, // initially unassigned!
        isTransformed: false,
        wasInsidePortal: false,
        lastSeenTime: now,
        missingFrames: 0,
        trackingStatus: 'tracking',
      };
      updatedTracks.push(newTrack);
    }
  }

  return updatedTracks;
}

export function useSpatialFaceTracker() {
  const [faces, setFaces] = useState<TrackedFace[]>([]);
  const trackedFacesRef = useRef<TrackedFace[]>([]);
  const nextIdRef = useRef<number>(1);
  const currentPortalRef = useRef<PortalState | null>(null);
  const currentDimsRef = useRef<VideoDimensions>({ width: 1280, height: 720 });

  const triggerTransformation = useCallback((face: TrackedFace) => {
    face.isTransformed = true;
    face.transformedAt = Date.now();

    // Trigger magical sound effect
    sound.playTransformChime();

    // Trigger particle confetti burst
    try {
      confetti({
        particleCount: 55,
        spread: 75,
        origin: {
          x: Math.min(Math.max(face.center.x, 0.1), 0.9),
          y: Math.min(Math.max(face.center.y, 0.1), 0.9),
        },
        colors:
          face.assignedRole === 'nick'
            ? ['#F97316', '#EA580C', '#FBBF24', '#ffffff']
            : ['#8B5CF6', '#C084FC', '#38BDF8', '#ffffff'],
      });
    } catch {
      // ignore in test or headless environment
    }
  }, []);

  const updateDetections = useCallback(
    (
      rawFaces: RawFaceDetection[],
      portal: PortalState | null,
      videoDims: VideoDimensions = { width: 1280, height: 720 }
    ): TrackedFace[] => {
      currentPortalRef.current = portal;
      currentDimsRef.current = videoDims;

      const updatedTracks = updateTrackedFaces(
        trackedFacesRef.current,
        rawFaces,
        portal,
        triggerTransformation,
        nextIdRef,
        Date.now(),
        videoDims
      );
      trackedFacesRef.current = updatedTracks;
      setFaces(updatedTracks);
      return updatedTracks;
    },
    [triggerTransformation]
  );

  const assignRole = useCallback((faceId: string, role: CharacterRole | null) => {
    sound.playTap();
    const portal = currentPortalRef.current;
    const dims = currentDimsRef.current;
    const aspect = Math.max(dims.width, 1) / Math.max(dims.height, 1);

    trackedFacesRef.current = trackedFacesRef.current.map((face) => {
      if (face.id === faceId) {
        const isCurrentlyInside =
          portal && portal.isActive
            ? isPointInsideOrientedPortal(face.center, portal, aspect)
            : false;

        return {
          ...face,
          assignedRole: role,
          isTransformed: false, // Reset transformation until they cross the portal!
          wasInsidePortal: isCurrentlyInside,
          transformedAt: undefined,
        };
      }
      // Keep assignments unique
      if (role && face.assignedRole === role) {
        return {
          ...face,
          assignedRole: null,
          isTransformed: false,
          wasInsidePortal: false,
        };
      }
      return face;
    });
    setFaces([...trackedFacesRef.current]);
  }, []);

  const resetAllAssignments = useCallback(() => {
    sound.playTap();
    trackedFacesRef.current = trackedFacesRef.current.map((face) => ({
      ...face,
      assignedRole: null,
      isTransformed: false,
      wasInsidePortal: false,
      transformedAt: undefined,
    }));
    setFaces([...trackedFacesRef.current]);
  }, []);

  return {
    faces,
    updateDetections,
    assignRole,
    resetAllAssignments,
  };
}
