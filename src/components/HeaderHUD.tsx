import React from 'react';
import {
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Camera,
  HelpCircle,
  AlertCircle,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { TrackedFace } from '../types';

export interface HeaderHUDProps {
  handCount?: number;
  faces?: TrackedFace[];
  isStreaming: boolean;
  isSimulationMode: boolean;
  facingMode: 'user' | 'environment';
  soundEnabled?: boolean;
  modelError?: string | null;
  onToggleFacingMode: () => void;
  onToggleSimulation: () => void;
  onToggleSound?: () => void;
  onStopCamera: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  isStreaming,
  isSimulationMode,
  modelError,
  soundEnabled = true,
  onToggleFacingMode,
  onToggleSimulation,
  onToggleSound,
  onStopCamera,
  onOpenSettings,
  onOpenHelp,
}) => {
  return (
    <header className="header-hud absolute top-0 left-0 right-0 z-30 px-3 sm:px-4 py-3 pt-[calc(env(safe-area-inset-top,12px)+6px)] flex items-center justify-between pointer-events-none select-none">
      {/* Left: Subtle Minimal Glass Capsule */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-white/10 rounded-full shadow-lg backdrop-blur-xl text-white">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSimulationMode
                  ? 'bg-purple-400'
                  : isStreaming
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isSimulationMode
                  ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]'
                  : isStreaming
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
              }`}
            />
          </span>
          <span className="text-xs font-semibold tracking-wide text-white/90">
            {isSimulationMode ? 'Portal AR • Demo' : 'Portal AR'}
          </span>

          {modelError && (
            <span
              title={`Vision warning: ${modelError}`}
              className="text-amber-400 hover:text-amber-300 transition-colors ml-0.5"
            >
              <AlertCircle className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Right: Sleek Floating Glassmorphic Icon Toolbar */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        {/* Flip Camera (Live Mode Only) */}
        {!isSimulationMode && (
          <button
            type="button"
            onClick={onToggleFacingMode}
            title="Switch front / rear camera"
            aria-label="Switch front / rear camera"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-white/20 text-slate-200 hover:text-white backdrop-blur-xl shadow-lg transition-all duration-150 active:scale-[0.96] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Demo / Live Toggle */}
        <button
          type="button"
          onClick={onToggleSimulation}
          title={isSimulationMode ? 'Switch to live camera' : 'Switch to demo simulation'}
          aria-label={isSimulationMode ? 'Switch to live camera' : 'Switch to demo simulation'}
          className={`w-9 h-9 rounded-full flex items-center justify-center border backdrop-blur-xl shadow-lg transition-all duration-150 active:scale-[0.96] cursor-pointer ${
            isSimulationMode
              ? 'bg-purple-600/30 border-purple-500/60 text-purple-200 hover:bg-purple-600/40'
              : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/10 hover:border-white/20 text-slate-200 hover:text-white'
          }`}
        >
          {isSimulationMode ? (
            <Camera className="w-4 h-4 text-purple-300" />
          ) : (
            <Sparkles className="w-4 h-4 text-cyan-300" />
          )}
        </button>

        {/* Sound Toggle */}
        {onToggleSound && (
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-white/20 text-slate-200 hover:text-white backdrop-blur-xl shadow-lg transition-all duration-150 active:scale-[0.96] cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}

        {/* Help & Guide */}
        <button
          type="button"
          onClick={onOpenHelp}
          title="Guide & Information"
          aria-label="Guide & Information"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-white/20 text-slate-200 hover:text-white backdrop-blur-xl shadow-lg transition-all duration-150 active:scale-[0.96] cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings & Calibration"
          aria-label="Settings & Calibration"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-white/20 text-slate-200 hover:text-white backdrop-blur-xl shadow-lg transition-all duration-150 active:scale-[0.96] cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Close / Stop Experience Button */}
        <button
          type="button"
          onClick={onStopCamera}
          title="Exit AR camera"
          aria-label="Exit AR camera"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-900/60 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-slate-200 hover:text-rose-300 backdrop-blur-xl shadow-lg transition-all duration-150 active:scale-[0.96] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
