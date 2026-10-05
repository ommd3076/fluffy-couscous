import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { HeaderHUD } from './HeaderHUD';

describe('HeaderHUD Minimalist AR Lens Header', () => {
  it('renders sleek floating glassmorphic toolbar without excessive cluttered pills', () => {
    const html = renderToString(
      <HeaderHUD
        isStreaming={true}
        isSimulationMode={false}
        facingMode="user"
        soundEnabled={true}
        onToggleFacingMode={vi.fn()}
        onToggleSimulation={vi.fn()}
        onToggleSound={vi.fn()}
        onStopCamera={vi.fn()}
        onOpenSettings={vi.fn()}
        onOpenHelp={vi.fn()}
      />
    );

    // Title indicator
    expect(html).toContain('Portal AR');

    // Should NOT contain noisy clutter pills from previous bloated design
    expect(html).not.toContain('Hands:');
    expect(html).not.toContain('Faces:');
    expect(html).not.toContain('Stop Camera</span>'); // No big red Stop Camera text badge

    // Accessible buttons in icon toolbar
    expect(html).toContain('Switch front / rear camera');
    expect(html).toContain('Switch to demo simulation');
    expect(html).toContain('Mute sound effects');
    expect(html).toContain('Guide &amp; Information');
    expect(html).toContain('Settings &amp; Calibration');
    expect(html).toContain('Exit AR camera');
  });

  it('renders demo simulation status when in demo mode', () => {
    const html = renderToString(
      <HeaderHUD
        isStreaming={false}
        isSimulationMode={true}
        facingMode="user"
        soundEnabled={false}
        onToggleFacingMode={vi.fn()}
        onToggleSimulation={vi.fn()}
        onToggleSound={vi.fn()}
        onStopCamera={vi.fn()}
        onOpenSettings={vi.fn()}
        onOpenHelp={vi.fn()}
      />
    );

    expect(html).toContain('Portal AR • Demo');
    expect(html).toContain('Switch to live camera');
    expect(html).toContain('Unmute sound effects');
    // Camera flip button is hidden in simulation mode
    expect(html).not.toContain('Switch front / rear camera');
  });
});
