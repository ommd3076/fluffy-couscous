export type CharacterRole = 'nick' | 'judy';

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface PortalState {
  center: Point2D;
  radius: number; // legacy equivalent or radial half-span
  width: number;  // rectangle width along fingertip vector
  height: number; // rectangle height perpendicular to fingertip vector
  angle: number;  // radians
  isActive: boolean; // whether fingertips are actively visible and controlling it
  fingertip1: Point2D | null;
  fingertip2: Point2D | null;
  corners?: Point2D[]; // 4 corners in normalized coordinates [TL, TR, BR, BL]
  mode: 'two-hands' | 'one-hand-pinch' | 'locked';
}

export interface TrackedFace {
  id: string;
  box: {
    xMin: number;
    yMin: number;
    width: number;
    height: number;
  };
  center: Point2D;
  scale: number;
  rotation: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  matrix?: number[]; // 16 elements 4x4 matrix from MediaPipe if available
  blendshapes: Record<string, number>;
  assignedRole: CharacterRole | null;
  isTransformed: boolean;
  wasInsidePortal?: boolean;
  transformedAt?: number;
  lastSeenTime: number;
  missingFrames: number;
  trackingStatus?: 'tracking' | 'coasting' | 'lost';
}

export interface HandDetectionData {
  handsCount: number;
  portal: PortalState | null;
}

export type AppTrackingState =
  | 'idle'
  | 'requesting-camera'
  | 'loading-models'
  | 'tracking'
  | 'camera-error'
  | 'simulation';

export type ModelAssetStatus =
  | 'unloaded'
  | 'loading'
  | 'ready'
  | 'error'
  | 'asset-gate';

export interface CharacterModelInfo {
  role: CharacterRole;
  status: ModelAssetStatus;
  source: string;
  creator: string;
  license: string;
  isCustomUpload: boolean;
  blendshapes: string[];
  error?: string;
}

export interface CameraSettings {
  facingMode: 'user' | 'environment';
  resolution: '720p' | '480p' | '1080p';
  smoothingFactor: number;
  soundEnabled: boolean;
  showLandmarkOverlay: boolean;
}
