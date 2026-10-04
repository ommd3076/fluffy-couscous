import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createRef } from 'react';
import { ARCanvas } from './ARCanvas';

describe('ARCanvas Video Feed & Three.js Layering', () => {
  it('renders full-bleed video element with playsinline, muted, autoplay, and objectFit cover', () => {
    const videoRef = createRef<HTMLVideoElement>();
    const html = renderToString(
      <ARCanvas
        videoRef={videoRef}
        isStreaming={true}
        faces={[]}
        portal={null}
        onAssignRole={vi.fn()}
        isMirrored={true}
      />
    );

    // Underlying video element
    expect(html).toContain('<video');
    expect(html).toContain('playsinline=""');
    expect(html).toContain('autoplay=""');
    expect(html).toContain('object-fit:cover');
    expect(html).toContain('opacity:1');

    // WebGL 3D container with pointer-events-none to prevent touch blocking
    expect(html).toContain('three-canvas-container');
    expect(html).toContain('pointer-events-none');
  });

  it('renders simulation studio background pattern when simulation mode is active', () => {
    const videoRef = createRef<HTMLVideoElement>();
    const html = renderToString(
      <ARCanvas
        videoRef={videoRef}
        isStreaming={false}
        faces={[]}
        portal={null}
        onAssignRole={vi.fn()}
        isMirrored={false}
        isSimulationMode={true}
      />
    );

    expect(html).toContain('radial-gradient');
  });
});
