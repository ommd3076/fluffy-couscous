import React from 'react';
import { Compass } from 'lucide-react';

interface HeadTelemetryProps {
  rotationEuler?: { x: number; y: number; z: number };
  visible?: boolean;
}

export const HeadTelemetryWidget: React.FC<HeadTelemetryProps> = ({
  rotationEuler,
  visible = true,
}) => {
  if (!visible || !rotationEuler) return null;

  // Convert radians to degrees
  const pitch = Math.round((rotationEuler.x * 180) / Math.PI);
  const yaw = Math.round((rotationEuler.y * 180) / Math.PI);
  const roll = Math.round((rotationEuler.z * 180) / Math.PI);

  return (
    <div className="head-telemetry-widget absolute top-16 right-4 z-20 pointer-events-none select-none">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/70 border border-white/10 rounded-full shadow-lg backdrop-blur-md text-[11px] font-mono text-slate-300">
        <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>{`P:${pitch}°`}</span>
        <span className="text-white/20">•</span>
        <span>{`Y:${yaw}°`}</span>
        <span className="text-white/20">•</span>
        <span>{`R:${roll}°`}</span>
      </div>
    </div>
  );
};
