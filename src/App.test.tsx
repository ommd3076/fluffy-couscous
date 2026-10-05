import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { App } from './App';

describe('App Root Component & Permission Screen Mounting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without throwing uncaught exceptions on initial mount', () => {
    // In node/SSR environment, verify that App renders the permission screen
    const html = renderToString(<App />);

    // Must render permission screen prominently
    expect(html).toContain('permission-screen');
    expect(html).toContain('Portal AR • Zootopia Morph');
    expect(html).toContain('Enable Camera &amp; Start AR');
    expect(html).toContain('Launch Interactive Demo Simulation');

    // Must render AR Canvas viewport
    expect(html).toContain('ar-viewport');
    expect(html).toContain('three-canvas-container');
  });

  it('contains accessible buttons for both Camera and Simulation paths', () => {
    const html = renderToString(<App />);

    // Check for Start Camera button
    expect(html).toMatch(/Enable Camera &amp; Start AR/);

    // Check for Simulation fallback button
    expect(html).toMatch(/Launch Interactive Demo Simulation/);

    // Verify Nick & Judy references
    expect(html).toContain('Nick Wilde');
    expect(html).toContain('Judy Hopps');
  });
});
