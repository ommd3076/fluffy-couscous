import React, { useState, useEffect } from 'react';
import { perfMonitor, PerformanceMetrics } from '../utils/performanceMonitor';
import { Activity } from 'lucide-react';

interface PerformanceHUDProps {
  visible?: boolean;
}

export const PerformanceHUD: React.FC<PerformanceHUDProps> = ({ visible = true }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(perfMonitor.getMetrics());

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setMetrics(perfMonitor.getMetrics());
    }, 500);
    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  const fpsColor =
    metrics.fps >= 45
      ? 'text-emerald-400'
      : metrics.fps >= 25
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className="performance-hud absolute top-16 left-4 z-20 pointer-events-none select-none">
      <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-950/70 border border-white/10 rounded-full shadow-lg backdrop-blur-md text-[11px] font-mono text-slate-300">
        <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className={`font-bold ${fpsColor}`}>{metrics.fps} FPS</span>
        <span className="text-white/20">•</span>
        <span>{metrics.inferenceTimeMs}ms infer</span>
        {metrics.memoryMb && (
          <>
            <span className="text-white/20">•</span>
            <span>{metrics.memoryMb}MB</span>
          </>
        )}
      </div>
    </div>
  );
};
