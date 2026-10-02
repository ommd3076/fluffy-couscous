import * as THREE from 'three';
import { TrackedFace, PortalState } from '../types';
import {
  CharacterHeadInstance,
  getCachedOrProceduralHead,
  preloadCharacterModels,
  isModelCached,
  getModelAssetInfo,
} from './characterModels';
import {
  ViewportTransform,
  normToScreen,
  screenToWorld3D,
  screenDistanceToWorld,
} from '../utils/coordinateMapping';

export class ThreeSceneManager {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private container: HTMLElement;

  private heads: Map<string, CharacterHeadInstance> = new Map();
  private portalRingMesh: THREE.Mesh | null = null;
  private portalParticles: THREE.Points | null = null;
  private particleCount = 180;
  private particleGeo: THREE.BufferGeometry | null = null;

  private isDisposed = false;
  private animFrameId: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Renderer (gracefully catch if WebGL is unavailable)
    try {
      this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      // Transparent clear color so WebGL canvas does NOT occlude underlying video
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      const width = Math.max(container.clientWidth || window.innerWidth || 640, 100);
      const height = Math.max(container.clientHeight || window.innerHeight || 480, 100);
      this.renderer.setSize(width, height);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.1;

      this.renderer.domElement.style.position = 'absolute';
      this.renderer.domElement.style.top = '0';
      this.renderer.domElement.style.left = '0';
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
      this.renderer.domElement.style.pointerEvents = 'none';

      container.appendChild(this.renderer.domElement);
    } catch (e) {
      console.warn('[ThreeSceneManager] WebGL unavailable, 3D heads fallback active:', e);
      this.renderer = null;
    }

    // 2. Scene
    this.scene = new THREE.Scene();

    // 3. Perspective Camera
    const initialWidth = Math.max(container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 640), 100);
    const initialHeight = Math.max(container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 480), 100);
    const aspect = initialWidth / initialHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 5.0);

    // 4. Cinematic Lighting
    this.setupLighting();

    // 5. 3D Holographic Rectangular Portal Visuals
    this.setupPortalVisuals();

    // 6. Preload candidate GLTF models in background
    preloadCharacterModels().catch(() => {});

    // Start render loop
    this.render = this.render.bind(this);
    this.render();
  }

  private setupLighting() {
    // Ambient light for base illumination
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient);

    // Directional Key Light
    const keyLight = new THREE.DirectionalLight(0xfff6ea, 1.4);
    keyLight.position.set(1.5, 3, 3.5);
    this.scene.add(keyLight);

    // Warm Fox Amber Rim Light
    const amberRim = new THREE.PointLight(0xff8800, 2.0, 10);
    amberRim.position.set(-2.5, 1.5, 1.5);
    this.scene.add(amberRim);

    // Cool Bunny Violet Fill Light
    const violetFill = new THREE.PointLight(0x8b5cf6, 1.8, 10);
    violetFill.position.set(2.5, -1, 1.5);
    this.scene.add(violetFill);
  }

  private setupPortalVisuals() {
    // Holographic rectangular aperture wireframe mesh matching reference clip
    const planeGeo = new THREE.PlaneGeometry(1.0, 0.58, 8, 5);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      wireframe: true,
    });
    this.portalRingMesh = new THREE.Mesh(planeGeo, planeMat);
    this.portalRingMesh.position.set(0, 0, 0);
    this.portalRingMesh.visible = false;
    this.scene.add(this.portalRingMesh);

    // Swirling portal particles
    const particlePositions = new Float32Array(this.particleCount * 3);
    const particleColors = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      const angle = (i / this.particleCount) * Math.PI * 2;
      const r = 0.9 + (Math.random() - 0.5) * 0.25;
      particlePositions[i * 3] = Math.cos(angle) * r;
      particlePositions[i * 3 + 1] = Math.sin(angle) * r;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;

      const isAmber = Math.random() > 0.5;
      if (isAmber) {
        particleColors[i * 3] = 1.0;
        particleColors[i * 3 + 1] = 0.6;
        particleColors[i * 3 + 2] = 0.1;
      } else {
        particleColors[i * 3] = 0.2;
        particleColors[i * 3 + 1] = 0.8;
        particleColors[i * 3 + 2] = 1.0;
      }
    }

    this.particleGeo = new THREE.BufferGeometry();
    this.particleGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3)
    );
    this.particleGeo.setAttribute(
      'color',
      new THREE.BufferAttribute(particleColors, 3)
    );

    const particleMat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    this.portalParticles = new THREE.Points(this.particleGeo, particleMat);
    this.portalParticles.visible = false;
    this.scene.add(this.portalParticles);
  }

  public updatePortal(
    portal: PortalState | null,
    transform: ViewportTransform
  ) {
    if (!portal || (!portal.radius && !portal.width)) {
      if (this.portalRingMesh) this.portalRingMesh.visible = false;
      if (this.portalParticles) this.portalParticles.visible = false;
      return;
    }

    const screenCenter = normToScreen(portal.center, transform);
    const renderedWidth = transform.videoWidth * transform.scale;
    const renderedHeight = transform.videoHeight * transform.scale;

    const screenW = Math.max(
      (portal.width || portal.radius * 2.1) * renderedWidth,
      100
    );
    const screenH = Math.max(
      (portal.height || portal.radius * 1.3) * renderedHeight,
      60
    );

    const worldCenter = screenToWorld3D(
      screenCenter,
      transform.containerWidth,
      transform.containerHeight,
      this.camera.fov,
      this.camera.position.z,
      0
    );

    const worldW = screenDistanceToWorld(
      screenW,
      transform.containerHeight,
      this.camera.fov,
      this.camera.position.z,
      0
    );
    const worldH = screenDistanceToWorld(
      screenH,
      transform.containerHeight,
      this.camera.fov,
      this.camera.position.z,
      0
    );

    let screenAngle = portal.angle;
    if (portal.fingertip1 && portal.fingertip2) {
      const pt1 = normToScreen(portal.fingertip1, transform);
      const pt2 = normToScreen(portal.fingertip2, transform);
      screenAngle = Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x);
    } else if (transform.isMirrored) {
      screenAngle = -portal.angle;
    }

    if (this.portalRingMesh) {
      this.portalRingMesh.visible = true;
      this.portalRingMesh.position.set(worldCenter.x, worldCenter.y, 0);
      this.portalRingMesh.rotation.z = -screenAngle;
      this.portalRingMesh.scale.set(worldW, worldH, 1);

      const mat = this.portalRingMesh.material as THREE.MeshBasicMaterial;
      mat.opacity = portal.isActive ? 0.75 : 0.3;
    }

    if (this.portalParticles) {
      this.portalParticles.visible = true;
      this.portalParticles.position.set(worldCenter.x, worldCenter.y, 0);
      this.portalParticles.rotation.z += 0.04;
      this.portalParticles.scale.set(worldW * 0.5, worldH * 0.5, 1);

      const pMat = this.portalParticles.material as THREE.PointsMaterial;
      pMat.opacity = portal.isActive ? 0.85 : 0.35;
    }
  }

  /**
   * Syncs tracked faces with 3D heads.
   * Only transformed faces render 3D character heads.
   */
  public updateFaces(faces: TrackedFace[], transform: ViewportTransform) {
    const activeFaceIds = new Set<string>();

    for (const face of faces) {
      // Only render 3D head if assigned and transformed!
      if (!face.assignedRole || !face.isTransformed) {
        continue;
      }

      activeFaceIds.add(face.id);
      let headInst: CharacterHeadInstance | null | undefined = this.heads.get(face.id);

      // If head instance does not exist or role changed, instantiate head
      if (!headInst || headInst.type !== face.assignedRole) {
        if (headInst) {
          this.scene.remove(headInst.root);
          headInst.dispose();
        }
        headInst = getCachedOrProceduralHead(face.assignedRole, true, true);
        if (headInst) {
          this.heads.set(face.id, headInst);
          this.scene.add(headInst.root);
        }
      } else {
        const currentSource = getModelAssetInfo(face.assignedRole).source;
        const shouldReload =
          (!headInst.isExternalModel && isModelCached(face.assignedRole)) ||
          (headInst.isExternalModel && currentSource && headInst.modelSource !== currentSource);

        if (shouldReload) {
          // Upgrade procedural placeholder or switch to newly uploaded GLTF model seamlessly!
          const prevPos = headInst.root.position.clone();
          const prevQuat = headInst.root.quaternion.clone();
          const prevScale = headInst.root.scale.clone();
          this.scene.remove(headInst.root);
          headInst.dispose();
          headInst = getCachedOrProceduralHead(face.assignedRole, true, true);
          if (headInst) {
            headInst.root.position.copy(prevPos);
            headInst.root.quaternion.copy(prevQuat);
            headInst.root.scale.copy(prevScale);
            this.heads.set(face.id, headInst);
            this.scene.add(headInst.root);
          }
        }
      }

      if (!headInst) continue;

      // Compute exact screen position from video coordinates
      const screenPos = normToScreen(face.center, transform);

      // Project screen position to 3D world space at head depth z = 0.2
      const worldPos = screenToWorld3D(
        screenPos,
        transform.containerWidth,
        transform.containerHeight,
        this.camera.fov,
        this.camera.position.z,
        0.2
      );

      headInst.root.position.set(worldPos.x, worldPos.y, worldPos.z);

      // Dynamic scale: match face size in screen pixels converted to world units
      const faceScreenWidth = Math.max(
        face.box.width * transform.videoWidth * transform.scale,
        face.scale * transform.videoWidth * transform.scale,
        70
      );
      const faceWorldWidth = screenDistanceToWorld(
        faceScreenWidth,
        transform.containerHeight,
        this.camera.fov,
        this.camera.position.z,
        0.2
      );
      const dynamicScale = Math.max((faceWorldWidth / 1.8) * 1.35, 0.08);
      headInst.root.scale.setScalar(dynamicScale);

      // 3D Rotation using MediaPipe transformation matrix when available
      if (face.matrix && face.matrix.length === 16) {
        try {
          const mat = new THREE.Matrix4().fromArray(face.matrix);
          const te = mat.elements;

          // Basis conversion from MediaPipe (Y down, Z forward) to Three.js (Y up, Z backward)
          const col0 = new THREE.Vector3(te[0], -te[1], -te[2]).normalize();
          const col1 = new THREE.Vector3(-te[4], te[5], te[6]).normalize();
          const col2 = new THREE.Vector3(-te[8], te[9], te[10]).normalize();

          const rotMatrix = new THREE.Matrix4().makeBasis(col0, col1, col2);
          const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);

          if (transform.isMirrored) {
            targetQuat.y = -targetQuat.y;
            targetQuat.z = -targetQuat.z;
          }

          headInst.root.quaternion.slerp(targetQuat, 0.45);
        } catch {
          // Fallback to Euler angles
          const euler = new THREE.Euler(
            face.rotation.pitch,
            transform.isMirrored ? -face.rotation.yaw : face.rotation.yaw,
            transform.isMirrored ? -face.rotation.roll : face.rotation.roll,
            'YXZ'
          );
          const targetQuat = new THREE.Quaternion().setFromEuler(euler);
          headInst.root.quaternion.slerp(targetQuat, 0.45);
        }
      } else {
        const euler = new THREE.Euler(
          face.rotation.pitch,
          transform.isMirrored ? -face.rotation.yaw : face.rotation.yaw,
          transform.isMirrored ? -face.rotation.roll : face.rotation.roll,
          'YXZ'
        );
        const targetQuat = new THREE.Quaternion().setFromEuler(euler);
        headInst.root.quaternion.slerp(targetQuat, 0.45);
      }

      // Update blendshapes (jaw opening, blink, expressions)
      headInst.updateBlendshapes(face.blendshapes);
    }

    // Remove heads for faces no longer transformed or lost
    for (const [id, inst] of this.heads.entries()) {
      if (!activeFaceIds.has(id)) {
        this.scene.remove(inst.root);
        inst.dispose();
        this.heads.delete(id);
      }
    }
  }

  public handleResize() {
    if (!this.container || this.isDisposed) return;
    const width = Math.max(this.container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 640), 100);
    const height = Math.max(this.container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 480), 100);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    if (this.renderer) {
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2));
    }
  }

  private render() {
    if (this.isDisposed) return;
    this.animFrameId = requestAnimationFrame(this.render);

    if (this.portalParticles && this.portalParticles.visible) {
      this.portalParticles.rotation.z += 0.02;
    }

    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public dispose() {
    this.isDisposed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }

    for (const inst of this.heads.values()) {
      this.scene.remove(inst.root);
      inst.dispose();
    }
    this.heads.clear();

    if (this.portalRingMesh) {
      this.scene.remove(this.portalRingMesh);
      this.portalRingMesh.geometry.dispose();
      (this.portalRingMesh.material as THREE.Material).dispose();
    }

    if (this.portalParticles) {
      this.scene.remove(this.portalParticles);
      this.particleGeo?.dispose();
      (this.portalParticles.material as THREE.Material).dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }
  }
}
