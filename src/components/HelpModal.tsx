import React from 'react';
import { X, Hand, UserCheck, Sparkles, Shield, Cpu } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-slate-200 my-auto">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-white">How Portal AR Works</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs leading-relaxed">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Hand className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white mb-0.5">
                1. Dual-Fingertip Portal
              </div>
              <p className="text-slate-400">
                Hold up both hands. Your two index fingertips establish the
                center, size, and rotation angle of the glowing dimensional
                portal. On mobile with one hand free, pinch your thumb and index
                finger.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white mb-0.5">
                2. Tap Face to Assign
              </div>
              <p className="text-slate-400">
                Up to two faces are tracked in the frame. Tap any detected face
                reticle to assign <strong>🦊 Nick Wilde</strong> (fox) or{' '}
                <strong>🐰 Judy Hopps</strong> (bunny). No automated facial
                recognition is used.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white mb-0.5">
                3. Enter the Portal & Transform
              </div>
              <p className="text-slate-400">
                Once assigned, physically move your head into the glowing portal!
                Upon crossing, your face transforms into a 3D character head that
                follows your head rotation, depth, jaw opening, and blinking.
              </p>
            </div>
          </div>

          {/* Character Model Sourcing & Licensing Credits */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">
                  Character Model Architecture & Credits:
                </span>
                <p className="mt-1 leading-relaxed">
                  Nick Wilde and Judy Hopps are copyright and trademarks of{' '}
                  <strong className="text-slate-300">Disney Enterprises, Inc.</strong>{' '}
                  Production-ready models cannot be redistributed without Disney authorization;
                  clearly identified temporary stylized prototypes are active for face tracking.
                </p>
              </div>
            </div>
            <div className="pl-6 space-y-1.5 text-[10.5px] border-l-2 border-slate-800 ml-2">
              <div>
                <span className="text-cyan-300 font-medium">• Temporary GLTF 2.0 Prototype:</span>{' '}
                Directly loads binary <code className="text-cyan-300">.glb</code> models with
                verified MediaPipe morph targets (<code className="text-slate-300">jawOpen</code>,{' '}
                <code className="text-slate-300">eyeBlinkLeft/Right</code>,{' '}
                <code className="text-slate-300">browInnerUp</code>).
              </div>
              <div>
                <span className="text-amber-300 font-medium">• Failsafe Procedural Rigs:</span>{' '}
                Custom articulated Three.js fox & bunny head rigs provide instant 0ms fallback
                if external files are absent or offline.
              </div>
              <div>
                <span className="text-slate-300 font-medium">• Asset Audit & Legal Disclosure:</span>{' '}
                See <code className="text-cyan-300">ASSETS.md</code> in project root for full
                dossier on external candidates (Sketchfab, BlendSwap, game extractions, paywalls).
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-emerald-200">
                Local In-Browser Privacy:
              </span>{' '}
              All computer vision (MediaPipe) and 3D rendering (Three.js) run
              entirely on your device GPU/CPU. No video or biometric face data is
              uploaded, recorded, or persisted.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition active:scale-95 text-center shadow-lg cursor-pointer"
        >
          Got It, Let's Play!
        </button>
      </div>
    </div>
  );
};
