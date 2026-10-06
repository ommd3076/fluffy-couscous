import { describe, it, expect } from 'vitest';
import { getLightingPreset, LIGHTING_PRESETS } from './lightingPresets';

describe('lightingPresets', () => {
  it('returns valid studio preset by default', () => {
    const preset = getLightingPreset('studio');
    expect(preset.ambientIntensity).toBe(0.9);
    expect(preset.dirPosition).toEqual([2, 4, 3]);
  });

  it('provides all 4 predefined presets', () => {
    expect(LIGHTING_PRESETS.studio).toBeDefined();
    expect(LIGHTING_PRESETS.sunset).toBeDefined();
    expect(LIGHTING_PRESETS['cyber-neon']).toBeDefined();
    expect(LIGHTING_PRESETS.midnight).toBeDefined();
  });
});
