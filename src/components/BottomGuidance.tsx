import React from 'react';
import { TrackedFace, PortalState } from '../types';
import { Sparkles, RotateCcw, Hand, UserCheck, AlertCircle } from 'lucide-react';

interface BottomGuidanceProps {
  faces: TrackedFace[];
  portal: PortalState | null;
  handCount: number;
  isStreaming?: boolean;
  isHandTrackingReleased?: boolean;
  onToggleHandTracking?: () => void;
  onResetRoles: () => void;
}

export const BottomGuidance: React.FC<BottomGuidanceProps> = ({
  faces,
  portal,
  handCount,
  isStreaming = true,
  isHandTrackingReleased = false,
  onToggleHandTracking,
  onResetRoles,
}) => {
  const nickFace = faces.find((f) => f.assignedRole === 'nick');
  const judyFace = faces.find((f) => f.assignedRole === 'judy');
  const anyAssigned = !!(nickFace || judyFace);
  const anyTransformed = !!(
    (nickFace && nickFace.isTransformed) ||
    (judyFace && judyFace.isTransformed)
  );
  const assignedLost = faces.some(
    (f) => f.assignedRole && f.trackingStatus === 'lost'
  );

  // Determine current contextual guidance step
  let instruction = 'Hold up 2 index fingers to open portal';
  let instructionIcon = <Hand className="w-4 h-4 text-cyan-400 shrink-0" />;

  if (assignedLost) {
    instruction = 'Face tracking lost — look toward camera';
    instructionIcon = <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />;
  } else if (portal && portal.isActive) {
    if (faces.length === 0) {
      instruction = 'No face detected — position face in camera view';
      instructionIcon = <AlertCircle className="w-4 h-4 text-cyan-300 shrink-0" />;
    } else if (!anyAssigned) {
      instruction = 'Tap a face to assign Nick or Judy';
      instructionIcon = <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />;
    } else if (anyAssigned && !anyTransformed) {
      instruction = 'Move your face through the portal to transform!';
      instructionIcon = <Sparkles className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />;
    } else {
      instruction = 'Transformation active! 3D head tracks your expressions';
      instructionIcon = <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />;
    }
  } else if (!portal || !portal.isActive) {
    if (faces.length === 0 && handCount === 0) {
      instruction = 'Hold up 2 index fingers & look at camera';
      instructionIcon = <Hand className="w-4 h-4 text-slate-400 shrink-0" />;
    } else if (handCount === 1) {
      instruction = 'Raise second index finger to frame portal';
      instructionIcon = <Hand className="w-4 h-4 text-cyan-300 shrink-0" />;
    } else if (handCount === 0) {
      instruction = 'Hold up 2 index fingers to open portal';
      instructionIcon = <Hand className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  }

  return (
    <footer className="bottom-guidance absolute bottom-0 left-0 right-0 z-30 p-4 pb-[calc(env(safe-area-inset-bottom,16px)+12px)] flex items-center justify-center pointer-events-none select-none">
      {/* Single Sleek Glassmorphic Contextual Hint Pill */}
      <div className="pointer-events-auto flex items-center gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-950/70 border border-white/10 rounded-full shadow-2xl backdrop-blur-xl text-xs sm:text-sm font-medium text-slate-100 max-w-2xl mx-auto transition-all duration-300 animate-fade-in">
        {instructionIcon}
        <span className="truncate">{instruction}</span>

        {portal && isStreaming && (
          <button
            type="button"
            onClick={onToggleHandTracking}
            aria-pressed={isHandTrackingReleased}
            aria-label={
              isHandTrackingReleased
                ? 'Resume hand tracking'
                : 'Release portal from hand tracking'
            }
            title={
              isHandTrackingReleased
                ? 'Resume hand tracking'
                : 'Release portal from hand tracking'
            }
            className="ml-1 shrink-0 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/90 hover:bg-white/10 active:scale-[0.97] transition"
          >
            <Hand className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isHandTrackingReleased ? 'Resume hands' : 'Release portal'}</span>
          </button>
        )}

        {/* Unobtrusive Reset Button (only shown when roles are assigned) */}
        {anyAssigned && (
          <button
            type="button"
            onClick={onResetRoles}
            title="Reset character assignments"
            aria-label="Reset character assignments"
            className="ml-1 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-[0.96] cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </footer>
  );
};
