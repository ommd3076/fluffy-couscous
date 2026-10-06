import { describe, it, expect, vi } from 'vitest';
import { captureARSnapshot } from './screenshotCapture';

describe('captureARSnapshot', () => {
  it('returns null when elements are null', async () => {
    const res = await captureARSnapshot(null, null);
    expect(res).toBeNull();
  });

  it('composites canvas when mock document exists', async () => {
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
    };

    const mockCanvas = {
      width: 640,
      height: 480,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mocked'),
    };

    (globalThis as any).document = {
      createElement: vi.fn().mockReturnValue(mockCanvas),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    };

    const inputCanvas: any = { width: 640, height: 480 };
    const res = await captureARSnapshot(null, inputCanvas, { watermarkText: 'TEST' });
    expect(res).toBe('data:image/png;base64,mocked');
  });
});
