import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HapticManager } from './haptics';

describe('HapticManager', () => {
  let manager: HapticManager;
  let vibrateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    manager = new HapticManager();
    vibrateMock = vi.fn().mockReturnValue(true);
    try {
      Object.defineProperty(globalThis.navigator, 'vibrate', {
        value: vibrateMock,
        writable: true,
        configurable: true,
      });
    } catch {
      // fallback
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers vibration pattern for portalFormed', () => {
    const success = manager.trigger('portalFormed');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      expect(success).toBe(true);
      expect(vibrateMock).toHaveBeenCalledWith([25, 40, 25]);
    }
  });

  it('triggers vibration pattern for transformed', () => {
    const success = manager.trigger('transformed');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      expect(success).toBe(true);
      expect(vibrateMock).toHaveBeenCalledWith([40, 30, 80, 40, 120]);
    }
  });

  it('respects enabled state when disabled', () => {
    manager.setEnabled(false);
    const success = manager.trigger('light');
    expect(success).toBe(false);
  });
});
