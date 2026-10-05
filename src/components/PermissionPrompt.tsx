import React from 'react';
import { Camera, Sparkles, ShieldCheck, AlertCircle, Play } from 'lucide-react';

interface PermissionPromptProps {
  onStartCamera: () => void;
  onStartSimulation: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export const PermissionPrompt: React.FC<PermissionPromptProps> = ({
  onStartCamera,
  onStartSimulation,
  isLoading,
  errorMessage,
}) => {
  return (
    <div
      className="permission-screen fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl text-slate-100 select-none overflow-y-auto"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(2, 6, 23, 0.95)',
        minHeight: '100vh',
      }}
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div
        className="relative max-w-md w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center my-auto"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '28rem',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderRadius: '1.5rem',
          border: '1px solid rgba(51, 65, 85, 0.6)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Portal Emblem */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500/40 via-cyan-500/40 to-purple-600/40 p-[2px] animate-spin-slow">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          {/* Character floating emoji chips */}
          <span className="absolute -top-1 -left-2 text-2xl drop-shadow-md select-none">
            🦊
          </span>
          <span className="absolute -bottom-1 -right-2 text-2xl drop-shadow-md select-none">
            🐰
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 font-display">
          Portal AR • Zootopia Morph
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed mb-6 max-w-sm">
          Form a glowing portal with your fingertips. When your face passes
          through, transform in real-time into{' '}
          <strong className="text-amber-400 font-semibold">Nick Wilde</strong> or{' '}
          <strong className="text-purple-300 font-semibold">Judy Hopps</strong>.
        </p>

        {/* Camera Error Alert if any */}
        {errorMessage && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-left flex items-start gap-3 text-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold text-rose-300 mb-0.5">
                Camera Notice
              </div>
              <div className="text-rose-200/90 leading-relaxed">{errorMessage}</div>
              <div className="mt-2 text-amber-200/90 font-medium">
                👉 Click "Launch Interactive Simulation" below to explore all AR features without a webcam!
              </div>
            </div>
          </div>
        )}

        {/* How it works summary */}
        <div className="w-full grid grid-cols-3 gap-2.5 mb-6 text-left">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
            <span className="text-xs font-bold text-cyan-400">1. Hands</span>
            <span className="text-[11px] text-slate-400 mt-1 leading-snug">
              Index fingertips create & resize portal
            </span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
            <span className="text-xs font-bold text-amber-400">2. Tap Face</span>
            <span className="text-[11px] text-slate-400 mt-1 leading-snug">
              Assign Fox or Bunny to detected faces
            </span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
            <span className="text-xs font-bold text-purple-400">3. Morph</span>
            <span className="text-[11px] text-slate-400 mt-1 leading-snug">
              Pass through portal to activate 3D head
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onStartCamera}
            className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-950/40 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ring-2 ring-amber-400/50"
            style={{
              cursor: isLoading ? 'wait' : 'pointer',
              minHeight: '48px',
              backgroundColor: '#f59e0b',
              color: '#020617',
              fontWeight: 700,
              borderRadius: '1rem',
              border: 'none',
              boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)',
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                Initializing Models & Camera...
              </span>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Enable Camera & Start AR</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onStartSimulation}
            className={`w-full min-h-[44px] py-3 px-6 rounded-2xl font-semibold text-xs transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
              errorMessage
                ? 'bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/60 text-purple-200 ring-2 ring-purple-500/40 shadow-lg shadow-purple-950/50'
                : 'bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white'
            }`}
            style={{
              cursor: 'pointer',
              minHeight: '44px',
              backgroundColor: errorMessage ? 'rgba(147, 51, 234, 0.3)' : 'rgba(30, 41, 59, 0.9)',
              color: errorMessage ? '#e9d5ff' : '#cbd5e1',
              borderRadius: '1rem',
              border: errorMessage ? '1px solid rgba(168, 85, 247, 0.6)' : '1px solid rgba(51, 65, 85, 0.8)',
              fontWeight: 600,
            }}
          >
            <Play className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>
              {errorMessage
                ? 'Launch Interactive Demo Simulation (No Camera Required)'
                : 'Launch Interactive Demo Simulation'}
            </span>
          </button>
        </div>

        {/* Privacy Note */}
        <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-400 text-left">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            100% on-device processing. No video or biometric data is ever stored
            or uploaded.
          </span>
        </div>
      </div>
    </div>
  );
};
