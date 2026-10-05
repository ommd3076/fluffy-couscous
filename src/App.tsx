import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  CameraSettings,
  AppTrackingState,
  PortalState,
  CharacterRole,
} from './types';
import { useCamera } from './hooks/useCamera';
import { useMediaPipe } from './hooks/useMediaPipe';
import { useSpatialFaceTracker, RawFaceDetection } from './hooks/useSpatialFaceTracker';
import { ARCanvas } from './components/ARCanvas';
import { HeaderHUD } from './components/HeaderHUD';
import { BottomGuidance } from './components/BottomGuidance';
import { PermissionPrompt } from './components/PermissionPrompt';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { sound } from './utils/audio';
import { setUserCustomModel } from './three/characterModels';

export const App: React.FC = () => {
  // Application State
  const [appState, setAppState] = useState<AppTrackingState>('idle');
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);
  const [portal, setPortal] = useState<PortalState | null>(null);
  const [isHandTrackingReleased, setIsHandTrackingReleased] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // User Settings
  const [settings, setSettings] = useState<CameraSettings>({
    facingMode: 'user',
    resolution: '720p',
    smoothingFactor: 0.72,
    soundEnabled: true,
    showLandmarkOverlay: false,
  });

  // Sound sync
  useEffect(() => {
    sound.setMuted(!settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Spatial Face Tracker hook
  const { faces, updateDetections, assignRole, resetAllAssignments } =
    useSpatialFaceTracker();

  // Camera hook
  const {
    videoRef,
    cameraError,
    isStreaming,
    facingMode,
    startCamera,
    stopCamera,
    toggleFacingMode,
    changeResolution,
  } = useCamera({
    facingMode: settings.facingMode,
    resolution: settings.resolution,
  });

  // Callbacks for MediaPipe detections
  const handleFaceDetections = useCallback(
    (rawFaces: RawFaceDetection[], currentPortal: PortalState | null) => {
      const v = videoRef.current;
      const dims =
        v && v.videoWidth > 0 && v.videoHeight > 0
          ? { width: v.videoWidth, height: v.videoHeight }
          : { width: 1280, height: 720 };
      updateDetections(rawFaces, currentPortal, dims);
    },
    [updateDetections, videoRef]
  );

  const handlePortalUpdate = useCallback((newPortal: PortalState | null) => {
    setPortal(newPortal);
  }, []);

  // MediaPipe Vision hook
  const { isModelLoading, modelError, handCount, initModels } =
    useMediaPipe({
      videoRef,
      isStreaming: isStreaming || isSimulationMode,
      smoothingFactor: settings.smoothingFactor,
      onFaceDetections: handleFaceDetections,
      onPortalUpdate: handlePortalUpdate,
      isSimulationMode,
      isHandTrackingReleased,
    });

  const startingRef = useRef(false);

  // Start Real Camera Flow
  const handleStartCamera = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    sound.resume();
    setIsSimulationMode(false);
    setIsHandTrackingReleased(false);
    setAppState('requesting-camera');

    try {
      const success = await startCamera();
      if (!success) {
        setAppState('camera-error');
        startingRef.current = false;
        return;
      }

      setAppState('loading-models');
      const modelsReady = await initModels();
      if (!modelsReady) {
        setAppState('camera-error');
        startingRef.current = false;
        return;
      }
      setAppState('tracking');
    } catch (err) {
      console.warn('[App] Error starting camera or models:', err);
      setAppState('camera-error');
    } finally {
      startingRef.current = false;
    }
  }, [startCamera, initModels]);

  // Start Simulation / Demo Mode Flow
  const handleStartSimulation = useCallback(() => {
    startingRef.current = false;
    sound.resume();
    stopCamera();
    setIsSimulationMode(true);
    setAppState('simulation');
  }, [stopCamera]);

  // Check on mount for existing permission or URL search params
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('sim') === '1' || params.get('demo') === '1') {
      handleStartSimulation();
      return;
    }
    if (params.get('cam') === '1' || params.get('auto') === '1') {
      handleStartCamera();
      return;
    }

    let permissionStatus: PermissionStatus | null = null;
    const onPermissionChange = () => {
      if (permissionStatus?.state === 'granted') {
        handleStartCamera();
      }
    };

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((status) => {
          permissionStatus = status;
          if (status.state === 'granted') {
            handleStartCamera();
          }
          status.addEventListener('change', onPermissionChange);
        })
        .catch(() => {});
    }

    return () => {
      if (permissionStatus) {
        permissionStatus.removeEventListener('change', onPermissionChange);
      }
    };
  }, []); // Run once on mount

  // Stop Camera & Return to Idle
  const handleStopExperience = useCallback(() => {
    startingRef.current = false;
    stopCamera();
    setIsSimulationMode(false);
    setIsHandTrackingReleased(false);
    setPortal(null);
    resetAllAssignments();
    setAppState('idle');
  }, [stopCamera, resetAllAssignments]);

  // Toggle between Simulation & Live Camera
  const handleToggleSimulation = () => {
    if (isSimulationMode) {
      handleStartCamera();
    } else {
      handleStartSimulation();
    }
  };

  const handleUpdateSettings = (newSettings: Partial<CameraSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.resolution && newSettings.resolution !== prev.resolution) {
        changeResolution(newSettings.resolution);
      }
      return updated;
    });
  };

  const handleToggleSound = useCallback(() => {
    setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const handleToggleHandTracking = useCallback(() => {
    setIsHandTrackingReleased((released) => !released);
  }, []);

  const handleAssignRoleCallback = (
    faceId: string,
    role: CharacterRole | null
  ) => {
    assignRole(faceId, role);
  };

  const handleUploadModel = useCallback(
    async (role: CharacterRole, file: File) => {
      try {
        const buffer = await file.arrayBuffer();
        await setUserCustomModel(role, buffer, file.name);
        sound.playTransformChime();
      } catch (err) {
        console.error(`[App] Failed to load custom model for ${role}:`, err);
        sound.playTap();
      }
    },
    []
  );

  const showPermissionScreen =
    appState === 'idle' ||
    appState === 'camera-error' ||
    appState === 'requesting-camera';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* 1. Underlying AR Canvas (Video + WebGL 3D + 2D Portal) */}
      <ARCanvas
        videoRef={videoRef}
        isStreaming={isStreaming}
        faces={faces}
        portal={portal}
        onAssignRole={handleAssignRoleCallback}
        isMirrored={facingMode === 'user' || isSimulationMode}
        isSimulationMode={isSimulationMode}
      />

      {/* 2. Top Header HUD Controls */}
      {!showPermissionScreen && (
        <HeaderHUD
          handCount={handCount}
          faces={faces}
          isStreaming={isStreaming}
          isSimulationMode={isSimulationMode}
          facingMode={facingMode}
          soundEnabled={settings.soundEnabled}
          modelError={modelError}
          onToggleFacingMode={toggleFacingMode}
          onToggleSimulation={handleToggleSimulation}
          onToggleSound={handleToggleSound}
          onStopCamera={handleStopExperience}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
        />
      )}

      {/* 3. Bottom Dynamic Guidance Bar */}
      {!showPermissionScreen && (
        <BottomGuidance
          faces={faces}
          portal={portal}
          handCount={handCount}
          isStreaming={isStreaming}
          isHandTrackingReleased={isHandTrackingReleased}
          onToggleHandTracking={handleToggleHandTracking}
          onResetRoles={resetAllAssignments}
        />
      )}

      {/* 4. Loading State Indicator */}
      {appState === 'loading-models' && isModelLoading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-3 px-6 py-5 bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl max-w-xs text-center">
            <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-bold text-white">
              Calibrating MediaPipe Vision
            </div>
            <p className="text-xs text-slate-400">
              Loading on-device hand & facial landmark models...
            </p>
          </div>
        </div>
      )}

      {/* 5. Permission & Onboarding Prompt Screen */}
      {showPermissionScreen && (
        <PermissionPrompt
          onStartCamera={handleStartCamera}
          onStartSimulation={handleStartSimulation}
          isLoading={appState === 'requesting-camera'}
          errorMessage={cameraError || modelError}
        />
      )}

      {/* 6. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetRoles={resetAllAssignments}
        onUploadModel={handleUploadModel}
      />

      {/* 7. Help & Information Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};
