import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCamera, formatCameraError, getCameraConstraints, UseCameraReturn } from './useCamera';
import { renderToString } from 'react-dom/server';

describe('useCamera hook & camera constraints tests', () => {
  const originalNavigator = typeof globalThis.navigator !== 'undefined' ? globalThis.navigator : undefined;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalNavigator) {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
    }
  });

  it('generates correct camera constraints for 720p, 480p, and 1080p', () => {
    const c720 = getCameraConstraints('user', '720p');
    expect(c720.video.facingMode).toBe('user');
    expect(c720.video.width.ideal).toBe(1280);
    expect(c720.video.height.ideal).toBe(720);

    const c480 = getCameraConstraints('environment', '480p');
    expect(c480.video.facingMode).toBe('environment');
    expect(c480.video.width.ideal).toBe(640);
    expect(c480.video.height.ideal).toBe(480);

    const c1080 = getCameraConstraints('user', '1080p');
    expect(c1080.video.width.ideal).toBe(1920);
    expect(c1080.video.height.ideal).toBe(1080);
  });

  it('formats camera errors with actionable user guidance', () => {
    const notAllowed = new Error('Permission denied');
    notAllowed.name = 'NotAllowedError';
    expect(formatCameraError(notAllowed)).toContain('Camera permission was denied');

    const notFound = new Error('No device');
    notFound.name = 'NotFoundError';
    expect(formatCameraError(notFound)).toContain('No webcam device found');

    const inUse = new Error('In use');
    inUse.name = 'NotReadableError';
    expect(formatCameraError(inUse)).toContain('Camera is already in use');

    const overconstrained = new Error('Overconstrained');
    overconstrained.name = 'OverconstrainedError';
    expect(formatCameraError(overconstrained)).toContain('does not support requested resolution');

    const generic = new Error('Random camera failure');
    expect(formatCameraError(generic)).toBe('Random camera failure');

    expect(formatCameraError(null)).toBe('Failed to access camera.');
  });

  it('initializes in idle non-streaming state and handles missing mediaDevices without crash', () => {
    let capturedHookReturn: UseCameraReturn | null = null;

    function TestComp() {
      const camera = useCamera();
      capturedHookReturn = camera;
      return null;
    }

    renderToString(<TestComp />);

    expect(capturedHookReturn).not.toBeNull();
    const camera = capturedHookReturn as unknown as UseCameraReturn;
    expect(camera.isStreaming).toBe(false);
    expect(camera.cameraReady).toBe(false);
    expect(camera.cameraError).toBeNull();
    expect(camera.facingMode).toBe('user');
  });

  it('returns false and sets cameraError when startCamera is called without mediaDevices', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      writable: true,
      configurable: true,
    });

    let hookResult: UseCameraReturn | null = null;
    function TestComp() {
      hookResult = useCamera();
      return null;
    }

    renderToString(<TestComp />);
    const camera = hookResult as unknown as UseCameraReturn;
    const success = await camera.startCamera();
    expect(success).toBe(false);
  });
});
