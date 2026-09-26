import { Point2D } from '../types';

/**
 * Exponential Moving Average for 2D points (frame-rate independent if factor adjusted)
 */
export function smoothPoint2D(
  current: Point2D,
  target: Point2D,
  factor: number
): Point2D {
  // factor between 0 (instant) and 1 (frozen). Default ~0.7
  const alpha = 1 - Math.min(Math.max(factor, 0.05), 0.95);
  return {
    x: current.x + (target.x - current.x) * alpha,
    y: current.y + (target.y - current.y) * alpha,
  };
}

/**
 * Exponential Moving Average for scalar values
 */
export function smoothScalar(
  current: number,
  target: number,
  factor: number
): number {
  const alpha = 1 - Math.min(Math.max(factor, 0.05), 0.95);
  return current + (target - current) * alpha;
}

/**
 * Smooth angle accounting for circular wrapping [-PI, PI]
 */
export function smoothAngle(
  currentAngle: number,
  targetAngle: number,
  factor: number
): number {
  const alpha = 1 - Math.min(Math.max(factor, 0.05), 0.95);
  // Shortest angular difference
  let diff = (targetAngle - currentAngle) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return currentAngle + diff * alpha;
}

/**
 * Time-aware exponential smoothing filter.
 * Computes alpha from elapsed delta-time (in seconds) and cutoff frequency (Hz).
 * Independent of variable frame-rates (e.g., 20fps vs 60fps on mobile).
 */
export function computeAlpha(dtSeconds: number, cutoffHz: number): number {
  const safeDt = Math.max(dtSeconds, 0.001);
  const tau = 1.0 / (2 * Math.PI * Math.max(cutoffHz, 0.1));
  return 1.0 / (1.0 + tau / safeDt);
}

export function smoothScalarTimeAware(
  current: number,
  target: number,
  dtSeconds: number,
  cutoffHz = 5.0
): number {
  const alpha = computeAlpha(dtSeconds, cutoffHz);
  return current + (target - current) * alpha;
}

export function smoothPoint2DTimeAware(
  current: Point2D,
  target: Point2D,
  dtSeconds: number,
  cutoffHz = 6.0
): Point2D {
  const alpha = computeAlpha(dtSeconds, cutoffHz);
  return {
    x: current.x + (target.x - current.x) * alpha,
    y: current.y + (target.y - current.y) * alpha,
  };
}

export function smoothAngleTimeAware(
  currentAngle: number,
  targetAngle: number,
  dtSeconds: number,
  cutoffHz = 4.0
): number {
  const alpha = computeAlpha(dtSeconds, cutoffHz);
  let diff = (targetAngle - currentAngle) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return currentAngle + diff * alpha;
}

/**
 * 1€ Filter (One Euro Filter)
 * Industry standard adaptive low-pass filter for real-time jitter reduction.
 * At low speeds, applies heavy smoothing (removes hand tremor).
 * At high speeds, dynamically increases cutoff frequency to eliminate lag.
 */
export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xPrev: number | null = null;
  private dxPrev = 0;
  private tPrev: number | null = null;

  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  public filter(x: number, timestampMs: number): number {
    if (this.tPrev === null || this.xPrev === null) {
      this.xPrev = x;
      this.dxPrev = 0;
      this.tPrev = timestampMs;
      return x;
    }

    const dt = Math.max((timestampMs - this.tPrev) * 0.001, 0.001);
    this.tPrev = timestampMs;

    // Filter derivative to compute current speed
    const dx = (x - this.xPrev) / dt;
    const aD = computeAlpha(dt, this.dCutoff);
    const dxHat = this.dxPrev + (dx - this.dxPrev) * aD;
    this.dxPrev = dxHat;

    // Adaptive cutoff frequency based on velocity
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const aX = computeAlpha(dt, cutoff);
    const xHat = this.xPrev + (x - this.xPrev) * aX;
    this.xPrev = xHat;

    return xHat;
  }

  public reset(): void {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }
}

export class OneEuroPoint2DFilter {
  private filterX: OneEuroFilter;
  private filterY: OneEuroFilter;

  constructor(minCutoff = 1.2, beta = 0.008, dCutoff = 1.0) {
    this.filterX = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.filterY = new OneEuroFilter(minCutoff, beta, dCutoff);
  }

  public filter(pt: Point2D, timestampMs: number): Point2D {
    return {
      x: this.filterX.filter(pt.x, timestampMs),
      y: this.filterY.filter(pt.y, timestampMs),
    };
  }

  public reset(): void {
    this.filterX.reset();
    this.filterY.reset();
  }
}
