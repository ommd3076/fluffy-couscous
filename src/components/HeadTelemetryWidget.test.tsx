import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { HeadTelemetryWidget } from './HeadTelemetryWidget';

describe('HeadTelemetryWidget', () => {
  it('renders converted degree angles from radians', () => {
    const html = renderToString(
      <HeadTelemetryWidget
        rotationEuler={{ x: 0.1, y: 0.2, z: -0.1 }}
        visible={true}
      />
    );
    expect(html).toContain('head-telemetry-widget');
    expect(html).toContain('P:6°');
    expect(html).toContain('Y:11°');
    expect(html).toContain('R:-6°');
  });

  it('renders null when not visible or rotation is undefined', () => {
    const html1 = renderToString(<HeadTelemetryWidget visible={false} />);
    expect(html1).toBe('');

    const html2 = renderToString(<HeadTelemetryWidget visible={true} />);
    expect(html2).toBe('');
  });
});
