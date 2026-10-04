import React, { useRef, useEffect, useState, useMemo } from 'react';
import { TrackedFace, PortalState, CharacterRole } from '../types';
import {
  computeViewportTransform,
  ViewportTransform,
} from '../utils/coordinateMapping';
import { ThreeSceneManager } from '../three/sceneManager';
import { PortalVisualizer } from './PortalVisualizer';
import { FaceAssignOverlay } from './FaceAssignOverlay';

interface ARCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isStreaming: boolean;
  faces: TrackedFace[];
  portal: PortalState | null;
  onAssignRole: (faceId: string, role: CharacterRole | null) => void;
  isMirrored?: boolean;
  isSimulationMode?: boolean;
}

export const ARCanvas: React.FC<ARCanvasProps> = ({
  videoRef,
  isStreaming,
  faces,
  portal,
  onAssignRole,
  isMirrored = true,
  isSimulationMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<ThreeSceneManager | null>(null);

  const [containerSize, setContainerSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  });

  // Track container dimensions with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
        if (sceneManagerRef.current) {
          sceneManagerRef.current.handleResize();
        }
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Compute transform between normalized coordinates and screen
  const viewportTransform = useMemo<ViewportTransform>(() => {
    const video = videoRef.current;
    const vWidth = video?.videoWidth || 1280;
    const vHeight = video?.videoHeight || 720;

    return computeViewportTransform(
      { videoWidth: vWidth, videoHeight: vHeight },
      containerSize.width,
      containerSize.height,
      isMirrored
    );
  }, [videoRef, containerSize, isMirrored]);

  // Initialize Three.js scene manager
  useEffect(() => {
    const container = threeContainerRef.current;
    if (!container) return;

    try {
      const manager = new ThreeSceneManager(container);
      sceneManagerRef.current = manager;
    } catch (err) {
      console.warn('[ARCanvas] Failed to initialize ThreeSceneManager:', err);
    }

    return () => {
      try {
        sceneManagerRef.current?.dispose();
      } catch (err) {
        console.warn('[ARCanvas] Error disposing ThreeSceneManager:', err);
      }
      sceneManagerRef.current = null;
    };
  }, []);

  // Sync 3D Heads and 3D Portal with Three.js scene
  useEffect(() => {
    if (!sceneManagerRef.current) return;

    try {
      // Update 3D heads for transformed faces with exact viewport transformation
      sceneManagerRef.current.updateFaces(faces, viewportTransform);

      // Update 3D portal
      sceneManagerRef.current.updatePortal(portal, viewportTransform);
    } catch (err) {
      console.warn('[ARCanvas] Error updating 3D scene:', err);
    }
  }, [faces, portal, viewportTransform]);

  return (
    <div
      ref={containerRef}
      className="ar-viewport relative w-full h-full overflow-hidden bg-slate-950 select-none touch-none"
      style={{ minHeight: '100dvh' }}
    >
      {/* 1. Underlying Webcam Video */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          transform: isMirrored ? 'scaleX(-1)' : 'none',
          opacity: isStreaming ? 1 : (isSimulationMode ? 0.35 : 1),
        }}
      />

      {/* Ambient background grid for simulation demo mode when camera is off */}
      {isSimulationMode && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.15) 0%, transparent 70%), radial-gradient(rgba(148, 163, 184, 0.25) 1px, transparent 1px)',
            backgroundSize: '100% 100%, 28px 28px',
          }}
        />
      )}

      {/* 2. WebGL 3D Layer (Three.js Character Heads & Lighting) */}
      <div
        ref={threeContainerRef}
        className="three-canvas-container pointer-events-none absolute inset-0 z-10"
      />

      {/* 3. 2D Portal Glow & Interactive Fingertip Overlay */}
      <PortalVisualizer portal={portal} transform={viewportTransform} />

      {/* 4. Interactive Face Target Reticles & Assignment Menus */}
      <FaceAssignOverlay
        faces={faces}
        portal={portal}
        transform={viewportTransform}
        onAssignRole={onAssignRole}
      />
    </div>
  );
};
