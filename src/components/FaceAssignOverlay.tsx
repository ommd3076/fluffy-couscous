import React, { useState } from 'react';
import { TrackedFace, CharacterRole, PortalState } from '../types';
import { ViewportTransform, normToScreen } from '../utils/coordinateMapping';
import { Sparkles, X, Check } from 'lucide-react';

interface FaceAssignOverlayProps {
  faces: TrackedFace[];
  portal: PortalState | null;
  transform: ViewportTransform;
  onAssignRole: (faceId: string, role: CharacterRole | null) => void;
}

export const FaceAssignOverlay: React.FC<FaceAssignOverlayProps> = ({
  faces,
  portal: _portal,
  transform,
  onAssignRole,
}) => {
  const [activeMenuFaceId, setActiveMenuFaceId] = useState<string | null>(null);

  // Close assignment menu when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setActiveMenuFaceId(null);
    }
  };

  return (
    <div
      className="face-overlay absolute inset-0 z-20 overflow-hidden"
      onClick={handleBackdropClick}
    >
      {faces.map((face) => {
        const screenPos = normToScreen(face.center, transform);
        const boxWidth = Math.max(
          face.box.width * transform.videoWidth * transform.scale,
          90
        );
        const boxHeight = Math.max(
          face.box.height * transform.videoHeight * transform.scale,
          110
        );

        const isMenuOpen = activeMenuFaceId === face.id;
        const isNick = face.assignedRole === 'nick';
        const isJudy = face.assignedRole === 'judy';
        const isTransformed = face.isTransformed;

        // Theme colors based on assigned role
        let themeBorder = 'rgba(56, 189, 248, 0.6)';
        let glowColor = 'rgba(56, 189, 248, 0.25)';
        if (isNick) {
          themeBorder = 'rgba(245, 158, 11, 0.85)';
          glowColor = 'rgba(245, 158, 11, 0.35)';
        } else if (isJudy) {
          themeBorder = 'rgba(168, 85, 247, 0.85)';
          glowColor = 'rgba(168, 85, 247, 0.35)';
        }

        const isNearBottom = screenPos.y > transform.containerHeight * 0.62;

        return (
          <div
            key={face.id}
            className="absolute pointer-events-auto transition-transform duration-75"
            style={{
              left: `${screenPos.x}px`,
              top: `${screenPos.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Holographic AR Corner Reticle */}
            <button
              type="button"
              onClick={() => setActiveMenuFaceId(isMenuOpen ? null : face.id)}
              aria-label={
                face.assignedRole
                  ? `Face assigned to ${face.assignedRole === 'nick' ? 'Nick Wilde' : 'Judy Hopps'}. Tap to change role.`
                  : 'Detected face. Tap to assign character role.'
              }
              className={`group relative flex flex-col items-center justify-center rounded-2xl transition-all duration-200 focus:outline-none cursor-pointer ${
                isTransformed ? 'opacity-20 hover:opacity-80' : 'opacity-100'
              }`}
              style={{
                width: `${boxWidth}px`,
                height: `${boxHeight}px`,
              }}
            >
              {/* Corner brackets with rounded edges */}
              <div
                className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 rounded-tl-md transition-colors duration-200"
                style={{ borderColor: themeBorder }}
              />
              <div
                className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 rounded-tr-md transition-colors duration-200"
                style={{ borderColor: themeBorder }}
              />
              <div
                className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 rounded-bl-md transition-colors duration-200"
                style={{ borderColor: themeBorder }}
              />
              <div
                className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 rounded-br-md transition-colors duration-200"
                style={{ borderColor: themeBorder }}
              />

              {/* Gentle hover highlight */}
              <div
                className="absolute inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                style={{
                  backgroundColor: glowColor,
                  filter: 'blur(6px)',
                }}
              />
            </button>

            {/* Subtle Role Indicator / Tap Target Pill below reticle */}
            <div className="flex flex-col items-center mt-1.5 pointer-events-auto">
              <button
                type="button"
                onClick={() => setActiveMenuFaceId(isMenuOpen ? null : face.id)}
                className={`group relative flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold backdrop-blur-xl transition-transform duration-100 active:scale-[0.96] shadow-lg border cursor-pointer ${
                  isTransformed ? 'opacity-70 hover:opacity-100' : 'opacity-100'
                }`}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  borderColor: themeBorder,
                  boxShadow: `0 0 12px ${glowColor}`,
                }}
              >
                {!face.assignedRole && (
                  <>
                    <Sparkles className="w-3 h-3 text-cyan-300 animate-pulse" />
                    <span className="text-white/90 tracking-wide">Assign Role</span>
                  </>
                )}

                {isNick && (
                  <>
                    <span className="text-xs">🦊</span>
                    <span className="text-amber-400 font-semibold">Nick</span>
                    {!isTransformed && (
                      <span className="text-[10px] text-amber-200/80 font-normal">
                        Enter portal →
                      </span>
                    )}
                  </>
                )}

                {isJudy && (
                  <>
                    <span className="text-xs">🐰</span>
                    <span className="text-purple-300 font-semibold">Judy</span>
                    {!isTransformed && (
                      <span className="text-[10px] text-purple-200/80 font-normal">
                        Enter portal →
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>

            {/* Glassmorphic Tap-to-Assign Popover */}
            {isMenuOpen && (
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-60 p-2.5 bg-slate-950/90 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-2xl z-50 animate-fade-in ${
                  isNearBottom ? 'bottom-full mb-3' : 'top-full mt-2.5'
                }`}
                style={{
                  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 15px rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Assign Character
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveMenuFaceId(null)}
                    aria-label="Close menu"
                    className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {/* Option 1: Nick Wilde */}
                  <button
                    type="button"
                    onClick={() => {
                      onAssignRole(face.id, 'nick');
                      setActiveMenuFaceId(null);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl border transition-all duration-150 text-left active:scale-[0.96] cursor-pointer ${
                      isNick
                        ? 'bg-amber-500/20 border-amber-500/70 text-amber-200'
                        : 'bg-slate-900/70 border-white/10 hover:bg-slate-800/80 hover:border-amber-500/40 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🦊</span>
                      <div>
                        <div className="text-xs font-bold text-white leading-tight">
                          Nick Wilde
                        </div>
                        <div className="text-[10px] text-amber-300/70">
                          Sly Fox
                        </div>
                      </div>
                    </div>
                    {isNick && <Check className="w-4 h-4 text-amber-400" />}
                  </button>

                  {/* Option 2: Judy Hopps */}
                  <button
                    type="button"
                    onClick={() => {
                      onAssignRole(face.id, 'judy');
                      setActiveMenuFaceId(null);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl border transition-all duration-150 text-left active:scale-[0.96] cursor-pointer ${
                      isJudy
                        ? 'bg-purple-500/20 border-purple-500/70 text-purple-200'
                        : 'bg-slate-900/70 border-white/10 hover:bg-slate-800/80 hover:border-purple-500/40 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🐰</span>
                      <div>
                        <div className="text-xs font-bold text-white leading-tight">
                          Judy Hopps
                        </div>
                        <div className="text-[10px] text-purple-300/70">
                          Energetic Bunny
                        </div>
                      </div>
                    </div>
                    {isJudy && <Check className="w-4 h-4 text-purple-400" />}
                  </button>

                  {/* Option 3: Remove Role */}
                  {face.assignedRole && (
                    <button
                      type="button"
                      onClick={() => {
                        onAssignRole(face.id, null);
                        setActiveMenuFaceId(null);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 mt-1 text-[11px] font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      <span>Remove Role</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
