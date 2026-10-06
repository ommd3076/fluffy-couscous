export type HapticPattern = 'light' | 'medium' | 'heavy' | 'portalFormed' | 'transformed';

export class HapticManager {
  private enabled = true;

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public trigger(pattern: HapticPattern): boolean {
    if (!this.enabled || typeof navigator === 'undefined' || !navigator.vibrate) {
      return false;
    }

    try {
      switch (pattern) {
        case 'light':
          return navigator.vibrate(15);
        case 'medium':
          return navigator.vibrate(35);
        case 'heavy':
          return navigator.vibrate(60);
        case 'portalFormed':
          return navigator.vibrate([25, 40, 25]);
        case 'transformed':
          return navigator.vibrate([40, 30, 80, 40, 120]);
        default:
          return false;
      }
    } catch {
      return false;
    }
  }
}

export const haptics = new HapticManager();
