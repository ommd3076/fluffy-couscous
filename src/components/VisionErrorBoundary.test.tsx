import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { VisionErrorBoundary } from './VisionErrorBoundary';

describe('VisionErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    const html = renderToString(
      <VisionErrorBoundary>
        <div id="child-content">Normal Content</div>
      </VisionErrorBoundary>
    );
    expect(html).toContain('Normal Content');
  });

  it('renders fallback error message when in error state', () => {
    const boundary = new VisionErrorBoundary({ children: null, fallbackMessage: 'Custom Error Notice' });
    boundary.state = { hasError: true, errorMessage: 'Boom' };
    const html = renderToString(boundary.render() as React.ReactElement);
    expect(html).toContain('vision-error-boundary');
    expect(html).toContain('Custom Error Notice');
    expect(html).toContain('Retry Pipeline');
  });
});
