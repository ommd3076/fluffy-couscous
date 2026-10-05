import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PermissionPrompt } from './PermissionPrompt';

describe('PermissionPrompt & Camera Request Flow', () => {
  it('renders prominently on initial load with clear title and CTA buttons', () => {
    const html = renderToString(
      <PermissionPrompt
        onStartCamera={vi.fn()}
        onStartSimulation={vi.fn()}
        isLoading={false}
        errorMessage={null}
      />
    );

    // Title and Character Descriptions
    expect(html).toContain('Portal AR • Zootopia Morph');
    expect(html).toContain('Nick Wilde');
    expect(html).toContain('Judy Hopps');

    // Primary CTA Button for camera permission
    expect(html).toContain('Enable Camera &amp; Start AR');
    expect(html).toContain('background-color:#f59e0b'); // amber button inline style
    expect(html).toContain('color:#020617'); // dark text inline style

    // Secondary CTA Button for interactive simulation mode
    expect(html).toContain('Launch Interactive Demo Simulation');

    // Critical structural visibility styles guaranteed even if stylesheet fails
    expect(html).toContain('position:fixed');
    expect(html).toContain('z-index:50');
    expect(html).toContain('background-color:rgba(2, 6, 23, 0.95)');

    // Privacy notice
    expect(html).toContain('100% on-device processing');
  });

  it('renders loading state when camera is being requested and initialized', () => {
    const html = renderToString(
      <PermissionPrompt
        onStartCamera={vi.fn()}
        onStartSimulation={vi.fn()}
        isLoading={true}
        errorMessage={null}
      />
    );

    expect(html).toContain('Initializing Models &amp; Camera...');
    expect(html).toContain('disabled=""');
  });

  it('renders prominent error banner and highlighted simulation fallback on camera error', () => {
    const errorMessage = 'Camera permission was denied. Please allow camera access in your browser address bar.';
    const html = renderToString(
      <PermissionPrompt
        onStartCamera={vi.fn()}
        onStartSimulation={vi.fn()}
        isLoading={false}
        errorMessage={errorMessage}
      />
    );

    // Displays camera notice
    expect(html).toContain('Camera Notice');
    expect(html).toContain('Camera permission was denied');

    // Highlights fallback simulation mode
    expect(html).toContain('Launch Interactive Demo Simulation (No Camera Required)');
    expect(html).toContain('👉 Click &quot;Launch Interactive Simulation&quot; below to explore all AR features without a webcam!');
  });
});
