import React, { useRef } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Sliders,
  Smartphone,
  Box,
  Upload,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { CameraSettings, CharacterRole } from '../types';
import { getModelAssetInfo } from '../three/characterModels';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CameraSettings;
  onUpdateSettings: (newSettings: Partial<CameraSettings>) => void;
  onResetRoles: () => void;
  onUploadModel?: (role: CharacterRole, file: File) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetRoles,
  onUploadModel,
}) => {
  const nickInputRef = useRef<HTMLInputElement>(null);
  const judyInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const nickInfo = getModelAssetInfo('nick');
  const judyInfo = getModelAssetInfo('judy');

  const handleFileChange = (role: CharacterRole, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadModel) {
      onUploadModel(role, file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none overflow-y-auto">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-slate-200 my-auto">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Experience Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-[0.96]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Resolution Selection */}
          <div>
            <label className="block font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Camera Resolution (Inference Load)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['480p', '720p', '1080p'] as const).map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => onUpdateSettings({ resolution: res })}
                  className={`py-2 px-3 rounded-xl border font-medium transition active:scale-[0.96] ${
                    settings.resolution === res
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Recommended: 720p for standard phones, 480p for battery saving.
            </p>
          </div>

          {/* Smoothing Factor */}
          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1.5">
              <span>Portal & Pose Jitter Filter</span>
              <span className="text-cyan-400">
                {Math.round(settings.smoothingFactor * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.3"
              max="0.92"
              step="0.05"
              value={settings.smoothingFactor}
              onChange={(e) =>
                onUpdateSettings({
                  smoothingFactor: parseFloat(e.target.value),
                })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>Fastest response</span>
              <span>Maximum stability</span>
            </div>
          </div>

          {/* Audio toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              <span className="font-semibold text-slate-300">
                Audio Chimes & Sound FX
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({ soundEnabled: !settings.soundEnabled })
              }
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                settings.soundEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 3D Character Model Manager & Asset Gate */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-cyan-400" />
                <span>3D Model Engine & Asset Gate</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                Asset Gate Active
              </span>
            </div>

            <p className="text-[10.5px] text-slate-400 leading-relaxed">
              Official Disney models require authorization and cannot be redistributed.
              You can provide your own cleared <code className="text-cyan-300">.glb</code> files:
            </p>

            {/* Model slots */}
            <div className="space-y-2 pt-1">
              {/* Nick Wilde */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-base">🦊</span>
                  <div>
                    <div className="font-bold text-white text-[11px]">Nick Wilde</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      {nickInfo.status === 'error' ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span className="text-rose-300">Load Error: {nickInfo.error || 'Failed to load'}</span>
                        </>
                      ) : nickInfo.isCustomUpload ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-300">Custom GLB</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span className="text-amber-300/90">Candidate GLB</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <input
                  ref={nickInputRef}
                  type="file"
                  accept=".glb,.gltf"
                  className="hidden"
                  onChange={(e) => handleFileChange('nick', e)}
                />
                <button
                  type="button"
                  onClick={() => nickInputRef.current?.click()}
                  className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition flex items-center gap-1 active:scale-[0.96] cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload GLB</span>
                </button>
              </div>

              {/* Judy Hopps */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-base">🐰</span>
                  <div>
                    <div className="font-bold text-white text-[11px]">Judy Hopps</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      {judyInfo.status === 'error' ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span className="text-rose-300">Load Error: {judyInfo.error || 'Failed to load'}</span>
                        </>
                      ) : judyInfo.isCustomUpload ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-300">Custom GLB</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 text-purple-400" />
                          <span className="text-purple-300/90">Candidate GLB</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <input
                  ref={judyInputRef}
                  type="file"
                  accept=".glb,.gltf"
                  className="hidden"
                  onChange={(e) => handleFileChange('judy', e)}
                />
                <button
                  type="button"
                  onClick={() => judyInputRef.current?.click()}
                  className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition flex items-center gap-1 active:scale-[0.96] cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload GLB</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reset roles */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onResetRoles();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-semibold transition active:scale-[0.96] text-center cursor-pointer"
            >
              Reset Face Roles & Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
