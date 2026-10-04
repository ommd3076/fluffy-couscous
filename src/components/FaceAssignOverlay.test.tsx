import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FaceAssignOverlay } from './FaceAssignOverlay';
import { TrackedFace } from '../types';
import { ViewportTransform } from '../utils/coordinateMapping';

describe('FaceAssignOverlay Reticles & Assignment Popover', () => {
  const dummyTransform: ViewportTransform = {
    videoWidth: 1280,
    videoHeight: 720,
    containerWidth: 1280,
    containerHeight: 720,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isMirrored: true,
  };

  const dummyFace: TrackedFace = {
    id: 'face-1',
    box: { xMin: 0.3, yMin: 0.3, width: 0.2, height: 0.2 },
    center: { x: 0.4, y: 0.4 },
    scale: 0.2,
    rotation: { pitch: 0, yaw: 0, roll: 0 },
    blendshapes: {},
    assignedRole: null,
    isTransformed: false,
    lastSeenTime: 1000,
    missingFrames: 0,
  };

  it('renders holographic reticle with corner brackets for detected faces', () => {
    const html = renderToString(
      <FaceAssignOverlay
        faces={[dummyFace]}
        portal={null}
        transform={dummyTransform}
        onAssignRole={vi.fn()}
      />
    );

    expect(html).toContain('face-overlay');
    expect(html).toContain('Assign Role');
    // Four corner brackets
    expect(html).toContain('border-t-2 border-l-2');
    expect(html).toContain('border-t-2 border-r-2');
    expect(html).toContain('border-b-2 border-l-2');
    expect(html).toContain('border-b-2 border-r-2');
  });

  it('displays assigned Nick role indicator on assigned face', () => {
    const nickFace: TrackedFace = {
      ...dummyFace,
      assignedRole: 'nick',
    };

    const html = renderToString(
      <FaceAssignOverlay
        faces={[nickFace]}
        portal={null}
        transform={dummyTransform}
        onAssignRole={vi.fn()}
      />
    );

    expect(html).toContain('Nick');
    expect(html).toContain('🦊');
    expect(html).toContain('Enter portal →');
  });

  it('displays assigned Judy role indicator on assigned face', () => {
    const judyFace: TrackedFace = {
      ...dummyFace,
      assignedRole: 'judy',
    };

    const html = renderToString(
      <FaceAssignOverlay
        faces={[judyFace]}
        portal={null}
        transform={dummyTransform}
        onAssignRole={vi.fn()}
      />
    );

    expect(html).toContain('Judy');
    expect(html).toContain('🐰');
    expect(html).toContain('Enter portal →');
  });

  it('subdues reticle opacity when face is actively transformed into 3D head', () => {
    const transformedFace: TrackedFace = {
      ...dummyFace,
      assignedRole: 'nick',
      isTransformed: true,
    };

    const html = renderToString(
      <FaceAssignOverlay
        faces={[transformedFace]}
        portal={null}
        transform={dummyTransform}
        onAssignRole={vi.fn()}
      />
    );

    expect(html).toContain('opacity-20');
  });
});
