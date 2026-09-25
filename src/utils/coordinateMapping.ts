import { Point2D } from '../types';

export interface ViewportTransform {
  videoWidth: number;
  videoHeight: number;
  containerWidth: number;
  containerHeight: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  isMirrored: boolean;
}

export function computeViewportTransform(
  video: HTMLVideoElement | { videoWidth: number; videoHeight: number },
  containerWidth: number,
  containerHeight: number,
  isMirrored: boolean = true
): ViewportTransform {
  const videoWidth = video.videoWidth || 640;
  const videoHeight = video.videoHeight || 480;

  const scale = Math.max(containerWidth / videoWidth, containerHeight / videoHeight);
  const renderedWidth = videoWidth * scale;
  const renderedHeight = videoHeight * scale;

  const offsetX = (containerWidth - renderedWidth) / 2;
  const offsetY = (containerHeight - renderedHeight) / 2;

  return {
    videoWidth,
    videoHeight,
    containerWidth,
    containerHeight,
    scale,
    offsetX,
    offsetY,
    isMirrored,
  };
}

export function normToScreen(
  normPoint: Point2D,
  transform: ViewportTransform
): Point2D {
  const normX = transform.isMirrored ? (1 - normPoint.x) : normPoint.x;
  const renderedWidth = transform.videoWidth * transform.scale;
  const renderedHeight = transform.videoHeight * transform.scale;

  return {
    x: transform.offsetX + normX * renderedWidth,
    y: transform.offsetY + normPoint.y * renderedHeight,
  };
}

export function screenToNorm(
  screenPoint: Point2D,
  transform: ViewportTransform
): Point2D {
  const renderedWidth = transform.videoWidth * transform.scale;
  const renderedHeight = transform.videoHeight * transform.scale;

  let normX = (screenPoint.x - transform.offsetX) / renderedWidth;
  if (transform.isMirrored) {
    normX = 1 - normX;
  }
  const normY = (screenPoint.y - transform.offsetY) / renderedHeight;

  return {
    x: Math.min(Math.max(normX, 0), 1),
    y: Math.min(Math.max(normY, 0), 1),
  };
}

/**
 * Projects a screen pixel coordinate into 3D world space at targetZ for a Three.js perspective camera.
 * Guarantees exact visual alignment between WebGL 3D elements and underlying HTML/video elements.
 */
export function screenToWorld3D(
  screenPoint: Point2D,
  containerWidth: number,
  containerHeight: number,
  cameraFov: number,
  cameraZ: number,
  targetZ: number = 0
): { x: number; y: number; z: number } {
  const dist = cameraZ - targetZ;
  const vFovRad = (cameraFov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(vFovRad / 2) * dist;
  const aspect = containerWidth / (containerHeight || 1);
  const visibleWidth = visibleHeight * aspect;

  const worldX = (screenPoint.x / (containerWidth || 1) - 0.5) * visibleWidth;
  const worldY = (0.5 - screenPoint.y / (containerHeight || 1)) * visibleHeight;

  return { x: worldX, y: worldY, z: targetZ };
}

/**
 * Converts a screen pixel distance to Three.js world units at depth targetZ.
 */
export function screenDistanceToWorld(
  screenPixels: number,
  containerHeight: number,
  cameraFov: number,
  cameraZ: number,
  targetZ: number = 0
): number {
  const dist = cameraZ - targetZ;
  const vFovRad = (cameraFov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(vFovRad / 2) * dist;
  return (screenPixels / (containerHeight || 1)) * visibleHeight;
}
