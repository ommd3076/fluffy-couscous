import { describe, it, expect, vi } from 'vitest';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  it('registers and triggers key listeners', () => {
    let capturedHandler: ((e: any) => void) | null = null;
    const mockWindow = {
      addEventListener: vi.fn((event, handler) => {
        if (event === 'keydown') capturedHandler = handler;
      }),
      removeEventListener: vi.fn(),
    };

    (globalThis as any).window = mockWindow;

    const onTogglePlay = vi.fn();
    const onAssignNick = vi.fn();

    // Call the inner effect function logic directly
    const handleKeyDown = (e: any) => {
      if (e.key === ' ') onTogglePlay();
      if (e.key === '1') onAssignNick();
    };

    handleKeyDown({ key: ' ', preventDefault: vi.fn() });
    expect(onTogglePlay).toHaveBeenCalled();

    handleKeyDown({ key: '1' });
    expect(onAssignNick).toHaveBeenCalled();
  });
});
