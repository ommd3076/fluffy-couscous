import React, { useRef, useEffect } from 'react';
import { PortalState, Point2D } from '../types';
import { ViewportTransform, normToScreen } from '../utils/coordinateMapping';

interface PortalVisualizerProps {
  portal: PortalState | null;
  transform: ViewportTransform;
}

export const PortalVisualizer: React.FC<PortalVisualizerProps> = ({
  portal,
  transform,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.035;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (portal && (portal.radius > 0 || (portal.width && portal.width > 0))) {
        // Map normalized center to screen pixels
        const screenCenter = normToScreen(portal.center, transform);

        // Screen dimensions based on actual video scaling
        const renderedWidth = transform.videoWidth * transform.scale;
        const renderedHeight = transform.videoHeight * transform.scale;

        const screenW = Math.max(
          (portal.width || portal.radius * 2.1) * renderedWidth,
          100
        );
        const screenH = Math.max(
          (portal.height || portal.radius * 1.3) * renderedHeight,
          65
        );

        // Compute screen angle aligning with the visible fingertip vector
        let screenAngle = portal.angle;
        if (portal.fingertip1 && portal.fingertip2) {
          const pt1 = normToScreen(portal.fingertip1, transform);
          const pt2 = normToScreen(portal.fingertip2, transform);
          screenAngle = Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x);
        } else if (transform.isMirrored) {
          screenAngle = -portal.angle;
        }

        ctx.save();
        ctx.translate(screenCenter.x, screenCenter.y);
        ctx.rotate(screenAngle);

        const halfW = screenW * 0.5;
        const halfH = screenH * 0.5;

        // 1. Outer Diffuse Glow around the rectangular aperture
        const glowGrad = ctx.createRadialGradient(
          0,
          0,
          Math.min(halfW, halfH) * 0.5,
          0,
          0,
          Math.max(halfW, halfH) * 1.3
        );
        glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
        glowGrad.addColorStop(0.6, portal.isActive ? 'rgba(6, 182, 212, 0.12)' : 'rgba(6, 182, 212, 0.04)');
        glowGrad.addColorStop(0.9, portal.isActive ? 'rgba(249, 115, 22, 0.22)' : 'rgba(249, 115, 22, 0.08)');
        glowGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');

        ctx.fillStyle = glowGrad;
        ctx.fillRect(-halfW * 1.25, -halfH * 1.3, halfW * 2.5, halfH * 2.6);

        // 2. Sci-Fi Holographic Scanner Grid (matches reference clip wireframe)
        ctx.save();
        ctx.beginPath();
        // Clip to the rectangular portal window
        ctx.rect(-halfW, -halfH, screenW, screenH);
        ctx.clip();

        // Subtle shaded portal background tint
        const bgGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
        bgGrad.addColorStop(0, 'rgba(6, 182, 212, 0.07)');
        bgGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.09)');
        bgGrad.addColorStop(1, 'rgba(249, 115, 22, 0.07)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(-halfW, -halfH, screenW, screenH);

        // Grid lines with moving cyber phase
        ctx.lineWidth = 1;
        ctx.strokeStyle = portal.isActive ? 'rgba(6, 182, 212, 0.28)' : 'rgba(6, 182, 212, 0.12)';

        // Vertical grid lines
        const gridStepX = Math.max(screenW / 10, 16);
        for (let x = -halfW; x <= halfW; x += gridStepX) {
          ctx.beginPath();
          ctx.moveTo(x, -halfH);
          ctx.lineTo(x, halfH);
          ctx.stroke();
        }

        // Horizontal moving scanlines
        const gridStepY = Math.max(screenH / 6, 14);
        const yOffset = (time * 24) % gridStepY;
        for (let y = -halfH + yOffset; y <= halfH; y += gridStepY) {
          ctx.beginPath();
          ctx.moveTo(-halfW, y);
          ctx.lineTo(halfW, y);
          ctx.stroke();
        }

        // High-speed energetic sweep scanline
        const sweepY = -halfH + ((time * 80) % screenH);
        const sweepGrad = ctx.createLinearGradient(0, sweepY - 8, 0, sweepY + 8);
        sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        sweepGrad.addColorStop(0.5, portal.isActive ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.15)');
        sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = sweepGrad;
        ctx.fillRect(-halfW, sweepY - 8, screenW, 16);

        ctx.restore();

        // 3. Rectangular Outer Glowing Perimeter Frame
        ctx.lineWidth = portal.isActive ? 2.5 : 1.5;
        ctx.strokeStyle = portal.isActive ? 'rgba(6, 182, 212, 0.85)' : 'rgba(6, 182, 212, 0.4)';
        ctx.shadowColor = '#06B6D4';
        ctx.shadowBlur = portal.isActive ? 14 : 6;

        ctx.strokeRect(-halfW, -halfH, screenW, screenH);

        // 4. Cyber Corner Brackets (HUD style)
        const bracketLen = Math.min(Math.min(halfW, halfH) * 0.4, 28);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#F97316';
        ctx.shadowColor = '#F97316';
        ctx.shadowBlur = portal.isActive ? 12 : 5;

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(-halfW + bracketLen, -halfH);
        ctx.lineTo(-halfW, -halfH);
        ctx.lineTo(-halfW, -halfH + bracketLen);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(halfW - bracketLen, -halfH);
        ctx.lineTo(halfW, -halfH);
        ctx.lineTo(halfW, -halfH + bracketLen);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(halfW - bracketLen, halfH);
        ctx.lineTo(halfW, halfH);
        ctx.lineTo(halfW, halfH - bracketLen);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(-halfW + bracketLen, halfH);
        ctx.lineTo(-halfW, halfH);
        ctx.lineTo(-halfW, halfH - bracketLen);
        ctx.stroke();

        // Center reticle crosshair
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        const chSize = 7;
        ctx.beginPath();
        ctx.moveTo(-chSize, 0);
        ctx.lineTo(chSize, 0);
        ctx.moveTo(0, -chSize);
        ctx.lineTo(0, chSize);
        ctx.stroke();

        ctx.restore();

        // 5. Fingertip Pins and Interactive Guidance Laser Beams
        if (portal.fingertip1 && portal.fingertip2 && portal.isActive) {
          const pt1 = normToScreen(portal.fingertip1, transform);
          const pt2 = normToScreen(portal.fingertip2, transform);

          // Animated dashed laser connection beam
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([7, 6]);
          ctx.lineDashOffset = -time * 18;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();
          ctx.restore();

          // Render glowing fingertip pins
          const drawFingertipPin = (pt: Point2D, label: string) => {
            ctx.save();
            ctx.shadowColor = '#06B6D4';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#06B6D4';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Label pill
            ctx.font = '600 11px system-ui, sans-serif';
            ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
            const textWidth = ctx.measureText(label).width;
            ctx.fillRect(pt.x - textWidth / 2 - 6, pt.y - 25, textWidth + 12, 19);

            ctx.fillStyle = '#38BDF8';
            ctx.textAlign = 'center';
            ctx.fillText(label, pt.x, pt.y - 11);
            ctx.restore();
          };

          drawFingertipPin(
            pt1,
            portal.mode === 'two-hands' ? 'Index L' : 'Thumb'
          );
          drawFingertipPin(
            pt2,
            portal.mode === 'two-hands' ? 'Index R' : 'Index'
          );
        }
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [portal, transform]);

  return (
    <canvas
      ref={canvasRef}
      width={transform.containerWidth}
      height={transform.containerHeight}
      className="portal-canvas pointer-events-none absolute inset-0 z-10"
    />
  );
};
