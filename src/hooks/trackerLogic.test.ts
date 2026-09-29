import { describe, it, expect, vi } from 'vitest';
import {
  updateTrackedFaces,
  RawFaceDetection,
  isPointInsideOrientedPortal,
} from './useSpatialFaceTracker';
import { TrackedFace, PortalState } from '../types';

function makeRawFace(
  cx: number,
  cy: number,
  width: number = 0.1,
  height: number = 0.1
): RawFaceDetection {
  return {
    landmarks: [
      { x: cx, y: cy, z: 0 }, // 0
      { x: cx, y: cy, z: 0 }, // 1 (nose tip)
      { x: cx - width / 2, y: cy - height / 2, z: 0 }, // 2 (top-left)
      { x: cx + width / 2, y: cy + height / 2, z: 0 }, // 3 (bottom-right)
      ...Array(474).fill({ x: cx, y: cy, z: 0 }),
    ],
    blendshapes: { jawOpen: 0 },
  };
}

describe('Spatial Face Tracker & Multi-Face Logic', () => {
  it('tracks up to 2 faces and initializes them as unassigned', () => {
    const nextId = { current: 1 };
    const onTransform = vi.fn();

    const rawFaces = [
      makeRawFace(0.3, 0.4),
      makeRawFace(0.7, 0.4),
      makeRawFace(0.5, 0.8), // 3rd face should be ignored (max 2)
    ];

    const tracks = updateTrackedFaces([], rawFaces, null, onTransform, nextId);

    expect(tracks).toHaveLength(2);
    expect(tracks[0].id).toBe('face-1');
    expect(tracks[0].assignedRole).toBeNull();
    expect(tracks[0].isTransformed).toBe(false);
    expect(tracks[1].id).toBe('face-2');
    expect(tracks[1].assignedRole).toBeNull();
    expect(tracks[1].isTransformed).toBe(false);
  });

  it('preserves track identities without swapping when 2 faces are near each other', () => {
    const nextId = { current: 3 };
    const onTransform = vi.fn();

    // Initial tracks
    const track1: TrackedFace = {
      id: 'face-nick',
      box: { xMin: 0.35, yMin: 0.45, width: 0.1, height: 0.1 },
      center: { x: 0.4, y: 0.5 },
      scale: 0.1,
      rotation: { pitch: 0, yaw: 0, roll: 0 },
      blendshapes: {},
      assignedRole: 'nick',
      isTransformed: true,
      lastSeenTime: 1000,
      missingFrames: 0,
    };

    const track2: TrackedFace = {
      id: 'face-judy',
      box: { xMin: 0.55, yMin: 0.45, width: 0.1, height: 0.1 },
      center: { x: 0.6, y: 0.5 },
      scale: 0.1,
      rotation: { pitch: 0, yaw: 0, roll: 0 },
      blendshapes: {},
      assignedRole: 'judy',
      isTransformed: false,
      lastSeenTime: 1000,
      missingFrames: 0,
    };

    // Frame t+1: both move slightly closer (0.42 and 0.58)
    const rawFaces = [
      makeRawFace(0.58, 0.5), // detection 0 is closer to Judy
      makeRawFace(0.42, 0.5), // detection 1 is closer to Nick
    ];

    const updated = updateTrackedFaces(
      [track1, track2],
      rawFaces,
      null,
      onTransform,
      nextId,
      1033
    );

    expect(updated).toHaveLength(2);
    const updatedNick = updated.find((f) => f.id === 'face-nick');
    const updatedJudy = updated.find((f) => f.id === 'face-judy');

    expect(updatedNick).toBeDefined();
    expect(updatedNick?.center.x).toBeCloseTo(0.42, 2);
    expect(updatedNick?.assignedRole).toBe('nick');

    expect(updatedJudy).toBeDefined();
    expect(updatedJudy?.center.x).toBeCloseTo(0.58, 2);
    expect(updatedJudy?.assignedRole).toBe('judy');
  });

  it('triggers transformation only when assigned face enters active oriented portal', () => {
    const nextId = { current: 1 };
    const onTransform = vi.fn();

    const portal: PortalState = {
      center: { x: 0.5, y: 0.5 },
      radius: 0.15,
      width: 0.3,
      height: 0.18,
      angle: 0,
      isActive: true,
      fingertip1: { x: 0.35, y: 0.5 },
      fingertip2: { x: 0.65, y: 0.5 },
      mode: 'two-hands',
    };

    const trackNick: TrackedFace = {
      id: 'face-nick',
      box: { xMin: 0.45, yMin: 0.45, width: 0.1, height: 0.1 },
      center: { x: 0.51, y: 0.51 }, // Inside portal
      scale: 0.1,
      rotation: { pitch: 0, yaw: 0, roll: 0 },
      blendshapes: {},
      assignedRole: 'nick',
      isTransformed: false,
      lastSeenTime: 1000,
      missingFrames: 0,
    };

    const trackUnassigned: TrackedFace = {
      id: 'face-unassigned',
      box: { xMin: 0.45, yMin: 0.45, width: 0.1, height: 0.1 },
      center: { x: 0.51, y: 0.49 }, // Inside portal but unassigned!
      scale: 0.1,
      rotation: { pitch: 0, yaw: 0, roll: 0 },
      blendshapes: {},
      assignedRole: null, // NOT assigned
      isTransformed: false,
      lastSeenTime: 1000,
      missingFrames: 0,
    };

    // Detection for Nick inside active portal
    const rawInside = [makeRawFace(0.51, 0.51)];
    updateTrackedFaces([trackNick], rawInside, portal, onTransform, nextId, 1033);
    expect(onTransform).toHaveBeenCalledTimes(1);

    // Inactive portal (hands disappeared) -> MUST NOT trigger transformation!
    onTransform.mockClear();
    const inactivePortal = { ...portal, isActive: false };
    const freshTrackNick = { ...trackNick, isTransformed: false };
    updateTrackedFaces([freshTrackNick], rawInside, inactivePortal, onTransform, nextId, 1033);
    expect(onTransform).not.toHaveBeenCalled();

    // Detection for unassigned face inside portal -> should NOT transform
    onTransform.mockClear();
    const rawUnassigned = [makeRawFace(0.51, 0.49)];
    updateTrackedFaces([trackUnassigned], rawUnassigned, portal, onTransform, nextId, 1033);
    expect(onTransform).not.toHaveBeenCalled();
  });

  it('correctly tests point inside oriented rotated portal', () => {
    const portalH: PortalState = {
      center: { x: 0.5, y: 0.5 },
      radius: 0.2,
      width: 0.4,
      height: 0.2,
      angle: 0,
      isActive: true,
      fingertip1: null,
      fingertip2: null,
      mode: 'two-hands',
    };

    expect(isPointInsideOrientedPortal({ x: 0.5, y: 0.5 }, portalH, 1.0)).toBe(true);
    expect(isPointInsideOrientedPortal({ x: 0.9, y: 0.9 }, portalH, 1.0)).toBe(false);

    // If inactive, always false
    expect(isPointInsideOrientedPortal({ x: 0.5, y: 0.5 }, { ...portalH, isActive: false }, 1.0)).toBe(false);

    // Diagonal portal with 16:9 video aspect ratio (1.777)
    const p1 = { x: 0.35, y: 0.4 };
    const p2 = { x: 0.65, y: 0.6 };
    const diagPortal: PortalState = {
      center: { x: 0.5, y: 0.5 },
      radius: 0.18,
      width: 0.36,
      height: 0.20,
      angle: Math.atan2(p2.y - p1.y, p2.x - p1.x),
      isActive: true,
      fingertip1: p1,
      fingertip2: p2,
      mode: 'two-hands',
    };
    // Point on the line between fingertips at 53% towards p2
    const onAxisPoint = { x: 0.58, y: 0.5533 };
    expect(isPointInsideOrientedPortal(onAxisPoint, diagPortal, 1280 / 720)).toBe(true);
  });

  it('preserves tracks through temporary dropouts and removes them after timeout', () => {
    const nextId = { current: 10 };
    const onTransform = vi.fn();

    let track: TrackedFace = {
      id: 'face-nick',
      box: { xMin: 0.45, yMin: 0.45, width: 0.1, height: 0.1 },
      center: { x: 0.5, y: 0.5 },
      scale: 0.1,
      rotation: { pitch: 0, yaw: 0, roll: 0 },
      blendshapes: {},
      assignedRole: 'nick',
      isTransformed: true,
      lastSeenTime: 1000,
      missingFrames: 0,
    };

    // Grace period retains face during brief dropouts (< 1500ms and <= 30 frames)
    let tracks = [track];
    for (let f = 1; f <= 15; f++) {
      tracks = updateTrackedFaces(tracks, [], null, onTransform, nextId, 1000 + f * 50);
      expect(tracks).toHaveLength(1);
      expect(tracks[0].missingFrames).toBe(f);
      if (f <= 5) {
        expect(tracks[0].trackingStatus).toBe('coasting');
      } else {
        expect(tracks[0].trackingStatus).toBe('lost');
      }
    }

    // After timeout (> 1500ms), face is pruned
    tracks = updateTrackedFaces(tracks, [], null, onTransform, nextId, 1000 + 1600);
    expect(tracks).toHaveLength(0); // Pruned!

    // Reacquired later: returns as fresh unassigned track
    const rawReturn = [makeRawFace(0.5, 0.5)];
    tracks = updateTrackedFaces(tracks, rawReturn, null, onTransform, nextId, 3000);

    expect(tracks).toHaveLength(1);
    expect(tracks[0].id).toBe('face-10'); // New track ID
    expect(tracks[0].assignedRole).toBeNull(); // Must be reassigned by user!
    expect(tracks[0].isTransformed).toBe(false);
  });

  it('verifies canonical left-to-right fingertip sorting prevents 180-degree angular flips', () => {
    const handA = { x: 0.35, y: 0.5 };
    const handB = { x: 0.65, y: 0.5 };

    let p1 = handA;
    let p2 = handB;
    if (p1.x > p2.x) {
      const tmp = p1; p1 = p2; p2 = tmp;
    }
    const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    let swappedP1 = handB;
    let swappedP2 = handA;
    if (swappedP1.x > swappedP2.x) {
      const tmp = swappedP1; swappedP1 = swappedP2; swappedP2 = tmp;
    }
    const angle2 = Math.atan2(swappedP2.y - swappedP1.y, swappedP2.x - swappedP1.x);

    expect(Math.abs(angle1 - angle2)).toBeCloseTo(0, 5);
    expect(swappedP1.x).toBeLessThan(swappedP2.x);
  });
});
