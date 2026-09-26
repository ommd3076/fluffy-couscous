import { describe, it, expect } from 'vitest';
import {
  smoothPoint2D,
  smoothScalar,
  smoothAngle,
  computeAlpha,
  smoothScalarTimeAware,
  smoothPoint2DTimeAware,
  OneEuroFilter,
  OneEuroPoint2DFilter,
} from './smoothing';

describe('smoothing utilities', () => {
  it('smooths 2D points towards target without overshoot', () => {
    const current = { x: 0, y: 0 };
    const target = { x: 10, y: 20 };
    const factor = 0.5;

    const smoothed = smoothPoint2D(current, target, factor);
    expect(smoothed.x).toBeGreaterThan(0);
    expect(smoothed.x).toBeLessThan(10);
    expect(smoothed.y).toBeGreaterThan(0);
    expect(smoothed.y).toBeLessThan(20);
  });

  it('smooths scalar numbers towards target', () => {
    const current = 100;
    const target = 200;
    const smoothed = smoothScalar(current, target, 0.7);

    expect(smoothed).toBeGreaterThan(100);
    expect(smoothed).toBeLessThan(200);
  });

  it('handles angular wrap-around seamlessly across +PI and -PI boundaries', () => {
    const currentAngle = Math.PI - 0.05;
    const targetAngle = -Math.PI + 0.05;

    const smoothed = smoothAngle(currentAngle, targetAngle, 0.5);
    expect(Math.abs(smoothed - currentAngle)).toBeLessThan(0.5);
  });

  it('computes valid alpha for time-aware filters across variable dt', () => {
    const alphaFast = computeAlpha(0.016, 5.0); // 60fps dt
    const alphaSlow = computeAlpha(0.05, 5.0);  // 20fps dt

    expect(alphaFast).toBeGreaterThan(0);
    expect(alphaFast).toBeLessThan(1);
    expect(alphaSlow).toBeGreaterThan(alphaFast); // larger dt yields larger alpha
  });

  it('smooths scalars and points time-aware', () => {
    const s = smoothScalarTimeAware(10, 20, 0.033, 4.0);
    expect(s).toBeGreaterThan(10);
    expect(s).toBeLessThan(20);

    const pt = smoothPoint2DTimeAware({ x: 0, y: 0 }, { x: 1, y: 1 }, 0.033, 4.0);
    expect(pt.x).toBeGreaterThan(0);
    expect(pt.x).toBeLessThan(1);
  });

  it('filters jitter with OneEuroFilter dynamically adapting to velocity', () => {
    const filter = new OneEuroFilter(1.0, 0.01);
    let val = 0;
    let t = 0;

    // Small stationary jitter
    for (let i = 0; i < 10; i++) {
      t += 33;
      val = filter.filter(10 + (i % 2 === 0 ? 0.2 : -0.2), t);
    }
    expect(val).toBeCloseTo(10, 0);

    // Fast movement step
    t += 33;
    const moved = filter.filter(50, t);
    expect(moved).toBeGreaterThan(15); // adapted quickly to fast movement
  });

  it('filters 2D points with OneEuroPoint2DFilter', () => {
    const ptFilter = new OneEuroPoint2DFilter(1.0, 0.01);
    const p1 = ptFilter.filter({ x: 0.5, y: 0.5 }, 0);
    expect(p1.x).toBeCloseTo(0.5, 4);
    expect(p1.y).toBeCloseTo(0.5, 4);

    const p2 = ptFilter.filter({ x: 0.52, y: 0.48 }, 33);
    expect(p2.x).toBeGreaterThan(0.5);
    expect(p2.y).toBeLessThan(0.5);
  });
});
