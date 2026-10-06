export type LightingMood = 'studio' | 'sunset' | 'cyber-neon' | 'midnight';

export interface LightConfig {
  ambientColor: number;
  ambientIntensity: number;
  dirColor: number;
  dirIntensity: number;
  dirPosition: [number, number, number];
  accentColor: number;
  accentIntensity: number;
}

export const LIGHTING_PRESETS: Record<LightingMood, LightConfig> = {
  studio: {
    ambientColor: 0xffffff,
    ambientIntensity: 0.9,
    dirColor: 0xfff5ea,
    dirIntensity: 1.4,
    dirPosition: [2, 4, 3],
    accentColor: 0x38bdf8,
    accentIntensity: 0.5,
  },
  sunset: {
    ambientColor: 0xf97316,
    ambientIntensity: 0.7,
    dirColor: 0xfbbf24,
    dirIntensity: 1.8,
    dirPosition: [4, 2, 2],
    accentColor: 0xc084fc,
    accentIntensity: 0.8,
  },
  'cyber-neon': {
    ambientColor: 0x06b6d4,
    ambientIntensity: 0.5,
    dirColor: 0xa855f7,
    dirIntensity: 1.6,
    dirPosition: [-2, 3, 2],
    accentColor: 0x22c55e,
    accentIntensity: 1.0,
  },
  midnight: {
    ambientColor: 0x1e1b4b,
    ambientIntensity: 0.4,
    dirColor: 0x6366f1,
    dirIntensity: 0.9,
    dirPosition: [0, 5, 2],
    accentColor: 0x38bdf8,
    accentIntensity: 0.4,
  },
};

export function getLightingPreset(mood: LightingMood): LightConfig {
  return LIGHTING_PRESETS[mood] || LIGHTING_PRESETS.studio;
}
