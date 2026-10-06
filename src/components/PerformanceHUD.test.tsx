import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PerformanceHUD } from './PerformanceHUD';

describe('PerformanceHUD', () => {
  it('renders FPS and inference metrics when visible', () => {
    const html = renderToString(<PerformanceHUD visible={true} />);
    expect(html).toContain('performance-hud');
    expect(html).toContain('FPS');
    expect(html).toContain('infer');
  });

  it('renders nothing when visible is false', () => {
    const html = renderToString(<PerformanceHUD visible={false} />);
    expect(html).toBe('');
  });
});
