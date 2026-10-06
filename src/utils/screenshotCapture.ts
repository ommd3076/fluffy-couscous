export interface CaptureOptions {
  watermarkText?: string;
  isMirrored?: boolean;
}

export async function captureARSnapshot(
  videoElement: HTMLVideoElement | null,
  canvasElement: HTMLCanvasElement | null,
  options: CaptureOptions = {}
): Promise<string | null> {
  if (!videoElement && !canvasElement) return null;

  const width = videoElement?.videoWidth || canvasElement?.width || 1280;
  const height = videoElement?.videoHeight || canvasElement?.height || 720;

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return null;

  ctx.save();
  if (options.isMirrored) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }

  // 1. Draw video background
  if (videoElement && videoElement.readyState >= 2) {
    ctx.drawImage(videoElement, 0, 0, width, height);
  } else {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Composite Three.js WebGL canvas on top
  if (canvasElement) {
    ctx.drawImage(canvasElement, 0, 0, width, height);
  }
  ctx.restore();

  // 3. Draw subtle cinematic watermark stamp
  const watermark = options.watermarkText || 'PORTAL AR • ZOOTOPIA MORPH';
  ctx.save();
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 6;
  ctx.fillText(watermark, 24, height - 24);
  ctx.restore();

  try {
    return offscreen.toDataURL('image/png');
  } catch {
    return null;
  }
}

export function downloadSnapshot(dataUrl: string, filename = 'ar_portal_snapshot.png'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
