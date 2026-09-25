import { describe, it, expect } from 'vitest';
import {
  computeViewportTransform,
  normToScreen,
  screenToNorm,
  screenToWorld3D,
  screenDistanceToWorld,
} from './coordinateMapping';

describe('coordinate mapping', () => {
  it('correctly scales and centers a 16:9 video in a 9:16 mobile container (cover mode)', () => {
    const video = { videoWidth: 1280, videoHeight: 720 };
    const containerWidth = 360;
    const containerHeight = 800;

    const transform = computeViewportTransform(
      video,
      containerWidth,
      containerHeight,
      true
    );

    // Cover mode should fit the height (scale = 800 / 720)
    expect(transform.scale).toBeCloseTo(800 / 720, 3);
    // Offset X should center the cropped wide video
    expect(transform.offsetX).toBeLessThan(0);
    expect(transform.offsetY).toBe(0);
  });

  it('mirrors X axis correctly when isMirrored is true (selfie camera)', () => {
    const video = { videoWidth: 640, videoHeight: 480 };
    const transform = computeViewportTransform(video, 640, 480, true);

    const normPoint = { x: 0.2, y: 0.5 };
    const screenPoint = normToScreen(normPoint, transform);

    // Because mirrored, x: 0.2 in video should map to 0.8 in screen
    expect(screenPoint.x).toBeCloseTo(640 * 0.8, 1);
    expect(screenPoint.y).toBeCloseTo(480 * 0.5, 1);
  });

  it('performs round-trip normToScreen and screenToNorm faithfully', () => {
    const video = { videoWidth: 1280, videoHeight: 720 };
    const transform = computeViewportTransform(video, 800, 600, false);

    const originalNorm = { x: 0.35, y: 0.65 };
    const screen = normToScreen(originalNorm, transform);
    const convertedNorm = screenToNorm(screen, transform);

    expect(convertedNorm.x).toBeCloseTo(originalNorm.x, 3);
    expect(convertedNorm.y).toBeCloseTo(originalNorm.y, 3);
  });

  it('projects screen coordinates to 3D world space faithfully', () => {
    const containerWidth = 390; // iPhone portrait screen
    const containerHeight = 844;
    const fov = 45;
    const cameraZ = 5.0;
    const targetZ = 0.2;

    // Test center
    const centerScreen = { x: 390 / 2, y: 844 / 2 };
    const centerWorld = screenToWorld3D(
      centerScreen,
      containerWidth,
      containerHeight,
      fov,
      cameraZ,
      targetZ
    );

    expect(centerWorld.x).toBeCloseTo(0, 4);
    expect(centerWorld.y).toBeCloseTo(0, 4);
    expect(centerWorld.z).toBeCloseTo(0.2, 4);

    // Test round-trip projection for an arbitrary screen pixel
    const arbitraryScreen = { x: 120, y: 550 };
    const world = screenToWorld3D(
      arbitraryScreen,
      containerWidth,
      containerHeight,
      fov,
      cameraZ,
      targetZ
    );

    const dist = cameraZ - targetZ;
    const vFovRad = (fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(vFovRad / 2) * dist;
    const visibleWidth = visibleHeight * (containerWidth / containerHeight);

    const reprojectedX = (world.x / visibleWidth + 0.5) * containerWidth;
    const reprojectedY = (0.5 - world.y / visibleHeight) * containerHeight;

    expect(reprojectedX).toBeCloseTo(arbitraryScreen.x, 3);
    expect(reprojectedY).toBeCloseTo(arbitraryScreen.y, 3);
  });

  it('converts screen distance to world units accurately', () => {
    const containerHeight = 800;
    const fov = 45;
    const cameraZ = 5.0;
    const targetZ = 0.0;

    const screenPixels = 400; // Half screen height
    const worldUnits = screenDistanceToWorld(
      screenPixels,
      containerHeight,
      fov,
      cameraZ,
      targetZ
    );

    const totalVisibleHeight = 2 * Math.tan((45 * Math.PI) / 360) * 5.0;
    expect(worldUnits).toBeCloseTo(totalVisibleHeight / 2, 4);
  });
});
