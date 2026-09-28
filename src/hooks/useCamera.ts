import { useState, useRef, useCallback, useEffect } from 'react';
import { CameraSettings } from '../types';

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  cameraReady: boolean;
  cameraError: string | null;
  isStreaming: boolean;
  facingMode: 'user' | 'environment';
  startCamera: () => Promise<boolean>;
  stopCamera: () => void;
  toggleFacingMode: () => Promise<void>;
  changeResolution: (res: CameraSettings['resolution']) => Promise<void>;
}

export function getCameraConstraints(
  facing: 'user' | 'environment',
  res: CameraSettings['resolution']
) {
  let idealWidth = 1280;
  let idealHeight = 720;

  if (res === '480p') {
    idealWidth = 640;
    idealHeight = 480;
  } else if (res === '1080p') {
    idealWidth = 1920;
    idealHeight = 1080;
  }

  return {
    audio: false,
    video: {
      facingMode: facing,
      width: { ideal: idealWidth },
      height: { ideal: idealHeight },
    },
  };
}

export function formatCameraError(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return 'Camera permission was denied. Please allow camera access in your browser address bar.';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return 'No webcam device found on this system. You can explore with Demo Simulation Mode.';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      return 'Camera is already in use by another application or tab.';
    } else if (err.name === 'OverconstrainedError') {
      return 'Camera does not support requested resolution. Fallback available in Simulation Mode.';
    }
    return err.message;
  }
  return 'Failed to access camera.';
}

export function useCamera(initialSettings?: Partial<CameraSettings>): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    initialSettings?.facingMode || 'user'
  );
  const [resolution, setResolution] = useState<CameraSettings['resolution']>(
    initialSettings?.resolution || '720p'
  );

  const getConstraints = useCallback(
    (facing: 'user' | 'environment', res: CameraSettings['resolution']) =>
      getCameraConstraints(facing, res),
    []
  );

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setIsStreaming(false);
  }, []);

  const startCamera = useCallback(async (): Promise<boolean> => {
    setCameraError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera API is not supported in this browser or context. Camera requires HTTPS or http://localhost.'
      );
      return false;
    }

    try {
      // Stop existing tracks if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const constraints = getConstraints(facingMode, resolution);
      let mediaStream: MediaStream;

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (tier1Err) {
        console.warn('High-resolution camera constraints failed, attempting basic facingMode:', tier1Err);
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode },
          });
        } catch (tier2Err) {
          console.warn('facingMode constraint failed, attempting default video device:', tier2Err);
          mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          });
        }
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);

      const video = videoRef.current;
      if (video) {
        if (video.srcObject !== mediaStream) {
          video.srcObject = mediaStream;
        }
        video.setAttribute('playsinline', 'true');
        video.muted = true;

        await new Promise<void>((resolve) => {
          let resolved = false;
          const onDone = () => {
            if (resolved) return;
            resolved = true;
            clearTimeout(timeoutId);
            setCameraReady(true);
            setIsStreaming(true);
            resolve();
          };

          const timeoutId = setTimeout(() => {
            console.warn('[useCamera] Video metadata timeout, continuing startup');
            onDone();
          }, 3500);

          video.onerror = () => {
            console.warn('[useCamera] Video element reported error during load');
            onDone();
          };

          video
            .play()
            .then(() => {
              onDone();
            })
            .catch((playErr) => {
              console.warn('[useCamera] Video auto-play error, continuing:', playErr);
              onDone();
            });
        });
      } else {
        setCameraReady(true);
        setIsStreaming(true);
      }

      return true;
    } catch (err: unknown) {
      const message = formatCameraError(err);
      setCameraError(message);
      setCameraReady(false);
      setIsStreaming(false);
      return false;
    }
  }, [facingMode, resolution, getConstraints]);

  const toggleFacingMode = useCallback(async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (streamRef.current) {
      stopCamera();
      // small delay for hardware release
      setTimeout(async () => {
        try {
          const constraints = getConstraints(nextMode, resolution);
          const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = mediaStream;
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            await videoRef.current.play().catch(() => {});
            setCameraReady(true);
            setIsStreaming(true);
          }
        } catch (e) {
          console.error('Failed to switch camera:', e);
        }
      }, 200);
    }
  }, [facingMode, resolution, stopCamera, getConstraints]);

  const changeResolution = useCallback(
    async (res: CameraSettings['resolution']) => {
      setResolution(res);
      if (streamRef.current) {
        stopCamera();
        setTimeout(async () => {
          try {
            const constraints = getConstraints(facingMode, res);
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = mediaStream;
            setStream(mediaStream);
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
              await videoRef.current.play().catch(() => {});
              setCameraReady(true);
              setIsStreaming(true);
            }
          } catch (e) {
            console.error('Failed to change resolution:', e);
          }
        }, 200);
      }
    },
    [facingMode, stopCamera, getConstraints]
  );

  // Synchronize stream with videoRef only if video element wasn't attached when stream was set
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;
        video
          .play()
          .then(() => {
            setCameraReady(true);
            setIsStreaming(true);
          })
          .catch((err) => {
            console.warn('[useCamera] Sync play warning:', err);
          });
      }
    } else {
      if (video.srcObject) {
        video.srcObject = null;
      }
    }
  }, [stream]);

  // Clean up tracks on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    stream,
    cameraReady,
    cameraError,
    isStreaming,
    facingMode,
    startCamera,
    stopCamera,
    toggleFacingMode,
    changeResolution,
  };
}
