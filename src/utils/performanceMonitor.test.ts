import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceMonitor } from './performanceMonitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  it('calculates 60 FPS default when not enough samples', () => {
    expect(monitor.calculateFps()).toBe(60);
    monitor.recordFrame(1000);
    expect(monitor.calculateFps()).toBe(60);
  });

  it('calculates FPS from recorded frame timestamps', () => {
    monitor.recordFrame(0);
    monitor.recordFrame(16.6);
    monitor.recordFrame(33.3);
    monitor.recordFrame(50.0);
    const fps = monitor.calculateFps();
    expect(fps).toBeGreaterThanOrEqual(58);
    expect(fps).toBeLessThanOrEqual(62);
  });

  it('averages inference durations and categorizes quality tier', () => {
    monitor.recordInferenceTime(15);
    monitor.recordInferenceTime(20);
    monitor.recordInferenceTime(25);
    expect(monitor.getAverageInferenceTime()).toBe(20);

    const metrics = monitor.getMetrics();
    expect(metrics.qualityTier).toBe('high');
    expect(metrics.inferenceTimeMs).toBe(20);
  });

  it('resets timestamps cleanly', () => {
    monitor.recordFrame(100);
    monitor.recordFrame(200);
    monitor.reset();
    expect(monitor.calculateFps()).toBe(60);
  });
});
