import { useEffect } from 'react';

export interface ShortcutHandlers {
  onTogglePlay?: () => void;
  onAssignNick?: () => void;
  onAssignJudy?: () => void;
  onToggleSound?: () => void;
  onFlipCamera?: () => void;
  onCloseModals?: () => void;
  onTakeSnapshot?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled = true): void {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when typing inside inputs or textareas
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlers.onTogglePlay?.();
          break;
        case '1':
          handlers.onAssignNick?.();
          break;
        case '2':
          handlers.onAssignJudy?.();
          break;
        case 'm':
        case 'M':
          handlers.onToggleSound?.();
          break;
        case 'f':
        case 'F':
          handlers.onFlipCamera?.();
          break;
        case 'Escape':
          handlers.onCloseModals?.();
          break;
        case 's':
        case 'S':
          handlers.onTakeSnapshot?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, enabled]);
}
