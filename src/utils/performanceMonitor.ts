export interface PerformanceMetrics {
  fps: number;
  frameTimeMs: number;
  inferenceTimeMs: number;
  memoryMb?: number;
  qualityTier: 'high' | 'medium' | 'low';
}

export class PerformanceMonitor {
  private frameTimestamps: number[] = [];
  private lastInferenceTimes: number[] = [];
  private maxSampleCount = 30;

  public recordFrame(now = performance.now()): number {
    this.frameTimestamps.push(now);
    if (this.frameTimestamps.length > this.maxSampleCount) {
      this.frameTimestamps.shift();
    }
    return this.calculateFps();
  }

  public recordInferenceTime(durationMs: number): void {
    this.lastInferenceTimes.push(durationMs);
    if (this.lastInferenceTimes.length > this.maxSampleCount) {
      this.lastInferenceTimes.shift();
    }
  }

  public calculateFps(): number {
    if (this.frameTimestamps.length < 2) return 60;
    const oldest = this.frameTimestamps[0];
    const newest = this.frameTimestamps[this.frameTimestamps.length - 1];
    const elapsed = newest - oldest;
    if (elapsed <= 0) return 60;
    const fps = ((this.frameTimestamps.length - 1) / elapsed) * 1000;
    return Math.round(Math.min(Math.max(fps, 0), 120));
  }

  public getAverageInferenceTime(): number {
    if (this.lastInferenceTimes.length === 0) return 0;
    const sum = this.lastInferenceTimes.reduce((a, b) => a + b, 0);
    return Math.round((sum / this.lastInferenceTimes.length) * 10) / 10;
  }

  public getMetrics(): PerformanceMetrics {
    const fps = this.calculateFps();
    const frameTimeMs = fps > 0 ? Math.round((1000 / fps) * 10) / 10 : 0;
    const inferenceTimeMs = this.getAverageInferenceTime();

    let memoryMb: number | undefined;
    if (typeof performance !== 'undefined' && (performance as any).memory?.usedJSHeapSize) {
      memoryMb = Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024));
    }

    let qualityTier: 'high' | 'medium' | 'low' = 'high';
    if (fps < 24 || inferenceTimeMs > 45) {
      qualityTier = 'low';
    } else if (fps < 45 || inferenceTimeMs > 28) {
      qualityTier = 'medium';
    }

    return {
      fps,
      frameTimeMs,
      inferenceTimeMs,
      memoryMb,
      qualityTier,
    };
  }

  public reset(): void {
    this.frameTimestamps = [];
    this.lastInferenceTimes = [];
  }
}

export const perfMonitor = new PerformanceMonitor();
