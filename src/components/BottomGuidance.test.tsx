import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { BottomGuidance } from './BottomGuidance';
import { TrackedFace, PortalState } from '../types';

describe('BottomGuidance Single Contextual Hint Pill', () => {
  it('renders single sleek contextual hint without stacked character card deck', () => {
    // Both face and hands missing: prompt both
    const htmlNoFace = renderToString(
      <BottomGuidance
        faces={[]}
        portal={null}
        handCount={0}
        onResetRoles={vi.fn()}
      />
    );
    expect(htmlNoFace).toContain('Hold up 2 index fingers &amp; look at camera');

    // Face present but no hands: prompt hands to open portal
    const htmlWithFace = renderToString(
      <BottomGuidance
        faces={[
          {
            id: 'face-1',
            box: { xMin: 0.1, yMin: 0.1, width: 0.2, height: 0.2 },
            center: { x: 0.2, y: 0.2 },
            scale: 0.2,
            rotation: { pitch: 0, yaw: 0, roll: 0 },
            blendshapes: {},
            assignedRole: null,
            isTransformed: false,
            lastSeenTime: 1000,
            missingFrames: 0,
          },
        ]}
        portal={null}
        handCount={0}
        onResetRoles={vi.fn()}
      />
    );
    expect(htmlWithFace).toContain('Hold up 2 index fingers to open portal');

    // Should NOT contain previous bloated card deck clutter
    expect(htmlNoFace).not.toContain('Nick</span>');
    expect(htmlNoFace).not.toContain('Judy</span>');
    expect(htmlNoFace).not.toContain('Unassigned');
    expect(htmlNoFace).not.toContain('Awaiting Portal');
  });

  it('updates hint to assign character when portal is active but faces are unassigned', () => {
    const portal: PortalState = {
      center: { x: 0.5, y: 0.5 },
      radius: 0.2,
      width: 0.35,
      height: 0.22,
      angle: 0,
      isActive: true,
      fingertip1: null,
      fingertip2: null,
      mode: 'two-hands',
    };

    const unassignedFace: TrackedFace = {
      id: 'face-1',
      box: { xMin: 0.1, yMin: 0.1, width: 0.2, height: 0.2 },
      center: { x: 0.2, y: 0.2 },
      scale: 0.2,
      rotation: { pitch: 0, yaw: 0, roll: 0 },
      blendshapes: {},
      assignedRole: null,
      isTransformed: false,
      lastSeenTime: 1000,
      missingFrames: 0,
    };

    const html = renderToString(
      <BottomGuidance
        faces={[unassignedFace]}
        portal={portal}
        handCount={2}
        onResetRoles={vi.fn()}
      />
    );

    expect(html).toContain('Tap a face to assign Nick or Judy');
  });

  it('updates hint to warn no face detected when portal is active but no face is in frame', () => {
    const portal: PortalState = {
      center: { x: 0.5, y: 0.5 },
      radius: 0.2,
      width: 0.35,
      height: 0.22,
      angle: 0,
      isActive: true,
      fingertip1: null,
      fingertip2: null,
      mode: 'two-hands',
    };

    const html = renderToString(
      <BottomGuidance
        faces={[]}
        portal={portal}
        handCount={2}
        onResetRoles={vi.fn()}
      />
    );

    expect(html).toContain('No face detected — position face in camera view');
  });

  it('updates hint when single index finger is detected', () => {
    const html = renderToString(
      <BottomGuidance
        faces={[]}
        portal={null}
        handCount={1}
        onResetRoles={vi.fn()}
      />
    );

    expect(html).toContain('Raise second index finger to frame portal');
  });

  it('updates hint when assigned face tracking is lost', () => {
    const lostFace: TrackedFace = {
      id: 'face-1',
      box: { xMin: 0.1, yMin: 0.1, width: 0.2, height: 0.2 },
      center: { x: 0.2, y: 0.2 },
      scale: 0.2,
      rotation: { pitch: 0, yaw: 0, roll: 0 },
      blendshapes: {},
      assignedRole: 'nick',
      isTransformed: true,
      lastSeenTime: 1000,
      missingFrames: 8,
      trackingStatus: 'lost',
    };

    const html = renderToString(
      <BottomGuidance
        faces={[lostFace]}
        portal={null}
        handCount={0}
        onResetRoles={vi.fn()}
      />
    );

    expect(html).toContain('Face tracking lost — look toward camera');
  });

  it('updates hint to transform when face is assigned but not yet transformed', () => {
    const portal: PortalState = {
      center: { x: 0.5, y: 0.5 },
      radius: 0.2,
      width: 0.35,
      height: 0.22,
      angle: 0,
      isActive: true,
      fingertip1: null,
      fingertip2: null,
      mode: 'two-hands',
    };

    const face: TrackedFace = {
      id: 'face-1',
      box: { xMin: 0.1, yMin: 0.1, width: 0.2, height: 0.2 },
      center: { x: 0.2, y: 0.2 },
      scale: 0.2,
      rotation: { pitch: 0, yaw: 0, roll: 0 },
      blendshapes: {},
      assignedRole: 'nick',
      isTransformed: false,
      lastSeenTime: 1000,
      missingFrames: 0,
    };

    const html = renderToString(
      <BottomGuidance
        faces={[face]}
        portal={portal}
        handCount={2}
        onResetRoles={vi.fn()}
      />
    );

    expect(html).toContain('Move your face through the portal to transform!');
    // Inline reset button is shown when any role is assigned
    expect(html).toContain('Reset character assignments');
  });

  it('updates hint when face is transformed', () => {
    const portal: PortalState = {
      center: { x: 0.5, y: 0.5 },
      radius: 0.2,
      width: 0.35,
      height: 0.22,
      angle: 0,
      isActive: true,
      fingertip1: null,
      fingertip2: null,
      mode: 'two-hands',
    };

    const face: TrackedFace = {
      id: 'face-1',
      box: { xMin: 0.45, yMin: 0.45, width: 0.2, height: 0.2 },
      center: { x: 0.5, y: 0.5 },
      scale: 0.2,
      rotation: { pitch: 0, yaw: 0, roll: 0 },
      blendshapes: {},
      assignedRole: 'judy',
      isTransformed: true,
      lastSeenTime: 1000,
      missingFrames: 0,
    };

    const html = renderToString(
      <BottomGuidance
        faces={[face]}
        portal={portal}
        handCount={2}
        onResetRoles={vi.fn()}
      />
    );

    expect(html).toContain('Transformation active! 3D head tracks your expressions');
  });
});
