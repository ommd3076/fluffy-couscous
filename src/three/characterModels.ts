import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CharacterModelInfo } from '../types';

export interface CharacterHeadInstance {
  root: THREE.Group;
  type: 'nick' | 'judy';
  isExternalModel: boolean;
  modelSource?: string;
  blendshapeNames: string[];
  occluder?: THREE.Mesh;
  updateBlendshapes: (blendshapes: Record<string, number>) => void;
  dispose: () => void;
}

/**
 * Creates an anatomical head occluder mesh (depth mask).
 * Uses colorWrite: false and depthWrite: true (renderOrder: 0)
 * to write depth values into the WebGL depth buffer, ensuring
 * the user's real face and hair behind the 3D head are cleanly occluded.
 */
export function createFaceOccluderMesh(): THREE.Mesh {
  const occluderGeo = new THREE.SphereGeometry(0.72, 24, 20);
  occluderGeo.scale(0.85, 0.95, 0.85);
  occluderGeo.translate(0, -0.05, -0.2);

  const occluderMat = new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthWrite: true,
  });

  const occluder = new THREE.Mesh(occluderGeo, occluderMat);
  occluder.name = 'FaceMeshDepthOccluder';
  occluder.renderOrder = 0;
  return occluder;
}

/**
 * Creates Nick Wilde (Stylized Fox) 3D procedural head placeholder.
 * Fully rigged with jaw opening, blinking eyelids, and brow reactions.
 */
export function createNickWildeHead(): CharacterHeadInstance {
  const root = new THREE.Group();
  root.name = 'NickWilde_StylizedPlaceholder';

  // Attach face occluder
  const occluder = createFaceOccluderMesh();
  root.add(occluder);

  // Materials
  const orangeFurMat = new THREE.MeshStandardMaterial({
    color: 0xd95f26,
    roughness: 0.65,
    metalness: 0.05,
  });
  const creamFurMat = new THREE.MeshStandardMaterial({
    color: 0xf6ede2,
    roughness: 0.7,
  });
  const darkFurMat = new THREE.MeshStandardMaterial({
    color: 0x24140d,
    roughness: 0.5,
  });
  const innerEarMat = new THREE.MeshStandardMaterial({
    color: 0xf5ded0,
    roughness: 0.8,
  });
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const irisMat = new THREE.MeshStandardMaterial({
    color: 0x388e3c,
    roughness: 0.2,
  });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
  const mouthInnerMat = new THREE.MeshStandardMaterial({
    color: 0x6e2226,
    roughness: 0.5,
  });
  const teethMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
  });
  const tieMat = new THREE.MeshStandardMaterial({
    color: 0x4f772d,
    roughness: 0.6,
  });

  // 1. Skull / Main Head
  const headGeo = new THREE.SphereGeometry(1.0, 24, 20);
  headGeo.scale(0.9, 1.0, 0.95);
  const headMesh = new THREE.Mesh(headGeo, orangeFurMat);
  headMesh.castShadow = true;
  headMesh.renderOrder = 1;
  root.add(headMesh);

  // 2. Cheek Tufts
  const cheekGeo = new THREE.ConeGeometry(0.45, 0.9, 5);
  cheekGeo.rotateZ(Math.PI / 2);

  const leftCheek = new THREE.Mesh(cheekGeo, creamFurMat);
  leftCheek.position.set(-0.85, -0.2, 0.1);
  leftCheek.rotation.set(0.1, -0.3, 0.4);
  leftCheek.renderOrder = 1;
  root.add(leftCheek);

  const rightCheek = new THREE.Mesh(cheekGeo, creamFurMat);
  rightCheek.position.set(0.85, -0.2, 0.1);
  rightCheek.rotation.set(0.1, 0.3, -0.4);
  rightCheek.renderOrder = 1;
  root.add(rightCheek);

  // 3. Upper Snout / Muzzle
  const snoutGroup = new THREE.Group();
  snoutGroup.position.set(0, -0.15, 0.7);

  const upperSnoutGeo = new THREE.ConeGeometry(0.48, 1.1, 16);
  upperSnoutGeo.rotateX(Math.PI / 2);
  const upperSnout = new THREE.Mesh(upperSnoutGeo, orangeFurMat);
  upperSnout.position.set(0, 0, 0.2);
  upperSnout.renderOrder = 1;
  snoutGroup.add(upperSnout);

  const muzzleUnderGeo = new THREE.SphereGeometry(0.35, 12, 10);
  muzzleUnderGeo.scale(1.1, 0.6, 1.3);
  const muzzleUnder = new THREE.Mesh(muzzleUnderGeo, creamFurMat);
  muzzleUnder.position.set(0, -0.12, 0.35);
  muzzleUnder.renderOrder = 1;
  snoutGroup.add(muzzleUnder);

  const noseGeo = new THREE.SphereGeometry(0.13, 10, 8);
  noseGeo.scale(1.2, 0.8, 1.1);
  const nose = new THREE.Mesh(noseGeo, darkFurMat);
  nose.position.set(0, 0.05, 0.8);
  nose.renderOrder = 1;
  snoutGroup.add(nose);
  root.add(snoutGroup);

  // 4. Lower Jaw
  const jawPivot = new THREE.Group();
  jawPivot.position.set(0, -0.35, 0.4);

  const jawGeo = new THREE.BoxGeometry(0.38, 0.16, 0.65);
  jawGeo.translate(0, -0.08, 0.25);
  const jawMesh = new THREE.Mesh(jawGeo, creamFurMat);
  jawMesh.renderOrder = 1;
  jawPivot.add(jawMesh);

  const lowerTeethGeo = new THREE.BoxGeometry(0.24, 0.06, 0.06);
  const lowerTeeth = new THREE.Mesh(lowerTeethGeo, teethMat);
  lowerTeeth.position.set(0, 0.01, 0.45);
  lowerTeeth.renderOrder = 1;
  jawPivot.add(lowerTeeth);

  const tongueGeo = new THREE.SphereGeometry(0.14, 8, 8);
  tongueGeo.scale(1, 0.3, 1.4);
  const tongue = new THREE.Mesh(tongueGeo, mouthInnerMat);
  tongue.position.set(0, 0, 0.3);
  tongue.renderOrder = 1;
  jawPivot.add(tongue);
  root.add(jawPivot);

  // 5. Fox Ears
  const createFoxEar = (isRight: boolean) => {
    const earGroup = new THREE.Group();
    const sign = isRight ? 1 : -1;
    earGroup.position.set(sign * 0.62, 0.85, -0.15);
    earGroup.rotation.set(0.15, -sign * 0.25, -sign * 0.35);

    const earGeo = new THREE.ConeGeometry(0.42, 1.25, 6);
    earGeo.scale(0.8, 1, 0.4);
    const earOuter = new THREE.Mesh(earGeo, orangeFurMat);
    earOuter.position.y = 0.55;
    earOuter.renderOrder = 1;
    earGroup.add(earOuter);

    const earTipGeo = new THREE.ConeGeometry(0.22, 0.45, 6);
    earTipGeo.scale(0.8, 1, 0.4);
    const earTip = new THREE.Mesh(earTipGeo, darkFurMat);
    earTip.position.y = 0.95;
    earTip.renderOrder = 1;
    earGroup.add(earTip);

    const innerEarGeo = new THREE.ConeGeometry(0.3, 0.85, 5);
    innerEarGeo.scale(0.7, 1, 0.2);
    const innerEar = new THREE.Mesh(innerEarGeo, innerEarMat);
    innerEar.position.set(0, 0.42, 0.08);
    innerEar.renderOrder = 1;
    earGroup.add(innerEar);

    return earGroup;
  };

  root.add(createFoxEar(false));
  root.add(createFoxEar(true));

  // 6. Eyes & Eyelids
  const createEye = (isRight: boolean) => {
    const eyeGroup = new THREE.Group();
    const sign = isRight ? 1 : -1;
    eyeGroup.position.set(sign * 0.42, 0.2, 0.72);
    eyeGroup.rotation.set(0, sign * 0.3, 0);

    const eyeWhiteGeo = new THREE.SphereGeometry(0.22, 16, 14);
    eyeWhiteGeo.scale(1.1, 0.9, 0.7);
    const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeWhite.renderOrder = 1;
    eyeGroup.add(eyeWhite);

    const irisGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
    irisGeo.rotateX(Math.PI / 2);
    const iris = new THREE.Mesh(irisGeo, irisMat);
    iris.position.set(0, 0, 0.13);
    iris.renderOrder = 1;
    eyeGroup.add(iris);

    const pupilGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12);
    pupilGeo.rotateX(Math.PI / 2);
    pupilGeo.scale(0.6, 1.2, 1);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(0, 0, 0.14);
    pupil.renderOrder = 1;
    eyeGroup.add(pupil);

    const eyelidGeo = new THREE.SphereGeometry(0.24, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    eyelidGeo.rotateX(-Math.PI / 2);
    const eyelid = new THREE.Mesh(eyelidGeo, orangeFurMat);
    eyelid.position.set(0, 0.12, 0.02);
    eyelid.scale.set(1.1, 0.01, 0.8);
    eyelid.renderOrder = 1;
    eyeGroup.add(eyelid);

    const browGeo = new THREE.BoxGeometry(0.32, 0.06, 0.1);
    const brow = new THREE.Mesh(browGeo, darkFurMat);
    brow.position.set(0, 0.28, 0.1);
    brow.rotation.z = sign * -0.2;
    brow.renderOrder = 1;
    eyeGroup.add(brow);

    return { eyeGroup, eyelid, brow };
  };

  const leftEyeData = createEye(false);
  const rightEyeData = createEye(true);
  root.add(leftEyeData.eyeGroup);
  root.add(rightEyeData.eyeGroup);

  // 7. Collar & Tie
  const collarGeo = new THREE.CylinderGeometry(0.75, 0.85, 0.45, 16);
  const collar = new THREE.Mesh(collarGeo, tieMat);
  collar.position.set(0, -0.9, 0);
  collar.renderOrder = 1;
  root.add(collar);

  const tieGeo = new THREE.ConeGeometry(0.18, 0.6, 4);
  tieGeo.rotateX(Math.PI);
  const tie = new THREE.Mesh(tieGeo, tieMat);
  tie.position.set(0, -1.05, 0.72);
  tie.renderOrder = 1;
  root.add(tie);

  root.scale.set(0.11, 0.11, 0.11);

  const updateBlendshapes = (blendshapes: Record<string, number>) => {
    const jawOpen = blendshapes['jawOpen'] || 0;
    jawPivot.rotation.x = -jawOpen * 0.48;

    const blinkL = blendshapes['eyeBlinkLeft'] || 0;
    const blinkR = blendshapes['eyeBlinkRight'] || 0;
    leftEyeData.eyelid.scale.y = Math.max(blinkL * 1.05, 0.05);
    rightEyeData.eyelid.scale.y = Math.max(blinkR * 1.05, 0.05);

    const browInnerUp = blendshapes['browInnerUp'] || 0;
    leftEyeData.brow.position.y = 0.28 + browInnerUp * 0.08;
    rightEyeData.brow.position.y = 0.28 + browInnerUp * 0.08;
  };

  const dispose = () => {
    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  };

  return {
    root,
    type: 'nick',
    isExternalModel: false,
    modelSource: 'procedural-placeholder',
    blendshapeNames: ['jawOpen', 'eyeBlinkLeft', 'eyeBlinkRight', 'browInnerUp'],
    occluder,
    updateBlendshapes,
    dispose,
  };
}

/**
 * Creates Judy Hopps (Stylized Bunny) 3D procedural head placeholder.
 */
export function createJudyHoppsHead(): CharacterHeadInstance {
  const root = new THREE.Group();
  root.name = 'JudyHopps_StylizedPlaceholder';

  const occluder = createFaceOccluderMesh();
  root.add(occluder);

  const bunnyFurMat = new THREE.MeshStandardMaterial({
    color: 0x98a0b0,
    roughness: 0.65,
    metalness: 0.05,
  });
  const cheekCreamMat = new THREE.MeshStandardMaterial({
    color: 0xeef0f6,
    roughness: 0.7,
  });
  const pinkInnerMat = new THREE.MeshStandardMaterial({
    color: 0xf4a6b8,
    roughness: 0.6,
  });
  const darkTipMat = new THREE.MeshStandardMaterial({
    color: 0x363a45,
    roughness: 0.5,
  });
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const irisMat = new THREE.MeshStandardMaterial({
    color: 0x7b2cbf,
    roughness: 0.2,
  });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f0b18 });
  const teethMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
  });
  const zpdCollarMat = new THREE.MeshStandardMaterial({
    color: 0x1d3557,
    roughness: 0.5,
  });

  const headGeo = new THREE.SphereGeometry(1.0, 24, 20);
  headGeo.scale(0.96, 0.95, 0.95);
  const headMesh = new THREE.Mesh(headGeo, bunnyFurMat);
  headMesh.castShadow = true;
  headMesh.renderOrder = 1;
  root.add(headMesh);

  const leftCheekGeo = new THREE.SphereGeometry(0.48, 16, 12);
  leftCheekGeo.scale(1.1, 0.85, 1.1);
  const leftCheek = new THREE.Mesh(leftCheekGeo, cheekCreamMat);
  leftCheek.position.set(-0.52, -0.22, 0.42);
  leftCheek.renderOrder = 1;
  root.add(leftCheek);

  const rightCheekGeo = new THREE.SphereGeometry(0.48, 16, 12);
  rightCheekGeo.scale(1.1, 0.85, 1.1);
  const rightCheek = new THREE.Mesh(rightCheekGeo, cheekCreamMat);
  rightCheek.position.set(0.52, -0.22, 0.42);
  rightCheek.renderOrder = 1;
  root.add(rightCheek);

  const muzzleGeo = new THREE.SphereGeometry(0.35, 14, 12);
  muzzleGeo.scale(0.9, 0.7, 0.9);
  const muzzle = new THREE.Mesh(muzzleGeo, cheekCreamMat);
  muzzle.position.set(0, -0.15, 0.72);
  muzzle.renderOrder = 1;
  root.add(muzzle);

  const noseGeo = new THREE.ConeGeometry(0.1, 0.12, 3);
  noseGeo.rotateZ(Math.PI);
  const nose = new THREE.Mesh(noseGeo, pinkInnerMat);
  nose.position.set(0, -0.06, 0.92);
  nose.renderOrder = 1;
  root.add(nose);

  const buckTeethGeo = new THREE.BoxGeometry(0.18, 0.15, 0.05);
  buckTeethGeo.translate(0, -0.06, 0);
  const buckTeeth = new THREE.Mesh(buckTeethGeo, teethMat);
  buckTeeth.position.set(0, -0.25, 0.82);
  buckTeeth.renderOrder = 1;
  root.add(buckTeeth);

  const jawPivot = new THREE.Group();
  jawPivot.position.set(0, -0.35, 0.5);

  const jawGeo = new THREE.BoxGeometry(0.32, 0.14, 0.35);
  jawGeo.translate(0, -0.07, 0.12);
  const jawMesh = new THREE.Mesh(jawGeo, cheekCreamMat);
  jawMesh.renderOrder = 1;
  jawPivot.add(jawMesh);
  root.add(jawPivot);

  const createBunnyEar = (isRight: boolean) => {
    const earGroup = new THREE.Group();
    const sign = isRight ? 1 : -1;
    earGroup.position.set(sign * 0.48, 0.82, -0.05);
    earGroup.rotation.set(-0.08, -sign * 0.15, -sign * 0.12);

    const earGeo = new THREE.CylinderGeometry(0.24, 0.32, 2.3, 16);
    earGeo.scale(0.85, 1, 0.32);
    earGeo.translate(0, 1.15, 0);
    const earOuter = new THREE.Mesh(earGeo, bunnyFurMat);
    earOuter.renderOrder = 1;
    earGroup.add(earOuter);

    const earTipGeo = new THREE.ConeGeometry(0.25, 0.6, 12);
    earTipGeo.scale(0.85, 1, 0.32);
    const earTip = new THREE.Mesh(earTipGeo, darkTipMat);
    earTip.position.set(0, 2.3, 0);
    earTip.renderOrder = 1;
    earGroup.add(earTip);

    const innerGeo = new THREE.CylinderGeometry(0.16, 0.22, 1.8, 12);
    innerGeo.scale(0.7, 1, 0.15);
    innerGeo.translate(0, 1.0, 0.06);
    const innerEar = new THREE.Mesh(innerGeo, pinkInnerMat);
    innerEar.renderOrder = 1;
    earGroup.add(innerEar);

    return earGroup;
  };

  const leftEar = createBunnyEar(false);
  const rightEar = createBunnyEar(true);
  root.add(leftEar);
  root.add(rightEar);

  const createBunnyEye = (isRight: boolean) => {
    const eyeGroup = new THREE.Group();
    const sign = isRight ? 1 : -1;
    eyeGroup.position.set(sign * 0.46, 0.15, 0.66);
    eyeGroup.rotation.set(0, sign * 0.28, 0);

    const eyeWhiteGeo = new THREE.SphereGeometry(0.26, 16, 14);
    eyeWhiteGeo.scale(1.0, 1.1, 0.7);
    const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeWhite.renderOrder = 1;
    eyeGroup.add(eyeWhite);

    const irisGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.05, 18);
    irisGeo.rotateX(Math.PI / 2);
    const iris = new THREE.Mesh(irisGeo, irisMat);
    iris.position.set(0, 0, 0.14);
    iris.renderOrder = 1;
    eyeGroup.add(iris);

    const pupilGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 14);
    pupilGeo.rotateX(Math.PI / 2);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(0, 0, 0.15);
    pupil.renderOrder = 1;
    eyeGroup.add(pupil);

    const gleamGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const gleam = new THREE.Mesh(gleamGeo, eyeWhiteMat);
    gleam.position.set(0.06, 0.06, 0.17);
    gleam.renderOrder = 1;
    eyeGroup.add(gleam);

    const eyelidGeo = new THREE.SphereGeometry(0.28, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    eyelidGeo.rotateX(-Math.PI / 2);
    const eyelid = new THREE.Mesh(eyelidGeo, bunnyFurMat);
    eyelid.position.set(0, 0.14, 0.03);
    eyelid.scale.set(1.05, 0.01, 0.75);
    eyelid.renderOrder = 1;
    eyeGroup.add(eyelid);

    const browGeo = new THREE.BoxGeometry(0.3, 0.05, 0.08);
    const brow = new THREE.Mesh(browGeo, darkTipMat);
    brow.position.set(0, 0.32, 0.08);
    brow.rotation.z = sign * -0.1;
    brow.renderOrder = 1;
    eyeGroup.add(brow);

    return { eyeGroup, eyelid, brow };
  };

  const leftEyeData = createBunnyEye(false);
  const rightEyeData = createBunnyEye(true);
  root.add(leftEyeData.eyeGroup);
  root.add(rightEyeData.eyeGroup);

  const collarGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.4, 16);
  const collar = new THREE.Mesh(collarGeo, zpdCollarMat);
  collar.position.set(0, -0.85, 0);
  collar.renderOrder = 1;
  root.add(collar);

  root.scale.set(0.105, 0.105, 0.105);

  const updateBlendshapes = (blendshapes: Record<string, number>) => {
    const jawOpen = blendshapes['jawOpen'] || 0;
    jawPivot.rotation.x = -jawOpen * 0.42;

    const blinkL = blendshapes['eyeBlinkLeft'] || 0;
    const blinkR = blendshapes['eyeBlinkRight'] || 0;
    leftEyeData.eyelid.scale.y = Math.max(blinkL * 1.05, 0.05);
    rightEyeData.eyelid.scale.y = Math.max(blinkR * 1.05, 0.05);

    const browInnerUp = blendshapes['browInnerUp'] || 0;
    leftEyeData.brow.position.y = 0.32 + browInnerUp * 0.06;
    rightEyeData.brow.position.y = 0.32 + browInnerUp * 0.06;
    leftEar.rotation.z = -(-0.12) - browInnerUp * 0.05;
    rightEar.rotation.z = -0.12 + browInnerUp * 0.05;
  };

  const dispose = () => {
    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  };

  return {
    root,
    type: 'judy',
    isExternalModel: false,
    modelSource: 'procedural-placeholder',
    blendshapeNames: ['jawOpen', 'eyeBlinkLeft', 'eyeBlinkRight', 'browInnerUp'],
    occluder,
    updateBlendshapes,
    dispose,
  };
}

/**
 * Creates a CharacterHeadInstance from a loaded Three.js GLTF scene.
 * Dynamically binds morph targets and bone hierarchies with MediaPipe blendshape mappings.
 */
export function createGLTFHeadInstance(
  gltfScene: THREE.Group,
  type: 'nick' | 'judy',
  modelSource = 'user-provided-glb'
): CharacterHeadInstance {
  const root = new THREE.Group();
  // Clone scene so multiple faces have independent instances
  const headModel = gltfScene.clone(true);

  // Collect discovered morph target names
  const discoveredBlendshapes = new Set<string>();

  // Ensure cloned meshes have independent morphTargetInfluences arrays and proper renderOrder
  headModel.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.renderOrder = 1;
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => (m.depthTest = true));
        } else {
          child.material.depthTest = true;
        }
      }
      if (child.morphTargetInfluences) {
        child.morphTargetInfluences = [...child.morphTargetInfluences];
      }
      if (child.morphTargetDictionary) {
        Object.keys(child.morphTargetDictionary).forEach((k) =>
          discoveredBlendshapes.add(k)
        );
      }
      child.castShadow = true;
    }
  });

  // Calculate bounding box and center geometry
  const bbox = new THREE.Box3().setFromObject(headModel);
  const center = bbox.getCenter(new THREE.Vector3());
  const size = bbox.getSize(new THREE.Vector3());

  // Center model at local origin (0, 0, 0)
  headModel.position.sub(center);

  // Normalize scale: standard head fits ~1.8 units across
  const maxDim = Math.max(size.x, size.y, size.z);
  const normScale = maxDim > 0 ? 1.8 / maxDim : 1.0;
  const wrapper = new THREE.Group();
  wrapper.scale.setScalar(normScale);
  wrapper.add(headModel);
  root.add(wrapper);

  // Attach face occluder (renderOrder: 0, depth mask)
  const occluder = createFaceOccluderMesh();
  root.add(occluder);

  root.scale.set(0.11, 0.11, 0.11);

  // Collect morph target bindings, bones, and named nodes
  interface MorphBinding {
    mesh: THREE.Mesh;
    dict: Record<string, number>;
  }
  const morphBindings: MorphBinding[] = [];
  const boneMap = new Map<string, THREE.Bone>();
  const nodeMap = new Map<string, THREE.Object3D>();

  headModel.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.morphTargetDictionary &&
      child.morphTargetInfluences
    ) {
      morphBindings.push({
        mesh: child,
        dict: child.morphTargetDictionary,
      });
    }
    if (child instanceof THREE.Bone) {
      boneMap.set(child.name.toLowerCase(), child);
    }
    if (child.name) {
      nodeMap.set(child.name.toLowerCase(), child);
    }
  });

  const aliasMap: Record<string, string[]> = {
    jawopen: ['jawopen', 'mouthopen', 'jaw_open', 'mouth_open', 'jaw'],
    eyeblinkleft: ['eyeblinkleft', 'blinkleft', 'blink_left', 'eyeblink_l', 'blink_l', 'blinkl'],
    eyeblinkright: ['eyeblinkright', 'blinkright', 'blink_right', 'eyeblink_r', 'blink_r', 'blinkr'],
    browinnerup: ['browinnerup', 'browup', 'brow_inner_up', 'brow_up', 'innerbrowup'],
    mouthsmileleft: ['mouthsmileleft', 'smileleft', 'mouth_smile_left', 'smile_l'],
    mouthsmileright: ['mouthsmileright', 'smileright', 'mouth_smile_right', 'smile_r'],
  };

  const updateBlendshapes = (blendshapes: Record<string, number>) => {
    // 1. Update morph targets on all morph-enabled meshes
    for (const binding of morphBindings) {
      const { mesh, dict } = binding;
      const influences = mesh.morphTargetInfluences;
      if (!influences) continue;

      for (const [rawKey, rawVal] of Object.entries(blendshapes)) {
        const keyLower = rawKey.toLowerCase();
        const value = Math.max(0, Math.min(1, rawVal));

        // Exact match
        if (dict[rawKey] !== undefined) {
          influences[dict[rawKey]] = value;
          continue;
        }

        // Lowercase or alias matches
        const candidates = aliasMap[keyLower] || [keyLower];
        for (const [targetName, targetIdx] of Object.entries(dict)) {
          const targetLower = targetName.toLowerCase();
          if (candidates.some((c) => targetLower === c || targetLower.includes(c))) {
            influences[targetIdx] = value;
          }
        }
      }
    }

    // 2. Bone/node-based articulation
    const jawOpen = blendshapes['jawOpen'] ?? blendshapes['mouthOpen'] ?? 0;
    const jawNode =
      boneMap.get('jaw') ||
      boneMap.get('jaw_bone') ||
      boneMap.get('head_jaw') ||
      boneMap.get('chin') ||
      nodeMap.get('jaw') ||
      nodeMap.get('jaw_bone') ||
      nodeMap.get('jawpivot');
    if (jawNode) {
      jawNode.rotation.x = -jawOpen * 0.45;
    }
  };

  const dispose = () => {
    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
      }
    });
  };

  return {
    root,
    type,
    isExternalModel: true,
    modelSource,
    blendshapeNames: Array.from(discoveredBlendshapes),
    occluder,
    updateBlendshapes,
    dispose,
  };
}

export const DEFAULT_MODEL_PATHS: Record<'nick' | 'judy', string> = {
  nick: '/models/nick_candidate.glb',
  judy: '/models/judy_candidate.glb',
};

// Global in-memory cache for parsed GLTF scene templates
const gltfTemplates = new Map<'nick' | 'judy', THREE.Group>();
const gltfLoadingPromises = new Map<'nick' | 'judy', Promise<THREE.Group>>();
const modelInfoRegister = new Map<'nick' | 'judy', CharacterModelInfo>();

export function isModelCached(type: 'nick' | 'judy'): boolean {
  return gltfTemplates.has(type);
}

export function clearModelCache(): void {
  gltfTemplates.clear();
  gltfLoadingPromises.clear();
  modelInfoRegister.clear();
}

export function getModelAssetInfo(type: 'nick' | 'judy'): CharacterModelInfo {
  const existing = modelInfoRegister.get(type);
  if (existing) return existing;

  return {
    role: type,
    status: gltfTemplates.has(type) ? 'ready' : 'asset-gate',
    source: DEFAULT_MODEL_PATHS[type],
    creator: 'Asset Gate: Awaiting Clearance / User Model',
    license: 'Disney Enterprises, Inc. Copyrighted IP (Evaluation)',
    isCustomUpload: false,
    blendshapes: [],
  };
}

/**
 * Registers a user-provided GLB file directly in memory.
 */
export async function setUserCustomModel(
  type: 'nick' | 'judy',
  buffer: ArrayBuffer,
  fileName: string
): Promise<CharacterHeadInstance> {
  const instance = await parseCharacterHeadModel(buffer, type, `user://${fileName}`);
  modelInfoRegister.set(type, {
    role: type,
    status: 'ready',
    source: fileName,
    creator: 'User Provided File',
    license: 'User Provided (Private Evaluation)',
    isCustomUpload: true,
    blendshapes: instance.blendshapeNames,
  });
  return instance;
}

/**
 * Parses a GLB / GLTF array buffer directly into a CharacterHeadInstance.
 */
export async function parseCharacterHeadModel(
  buffer: ArrayBuffer,
  type: 'nick' | 'judy',
  modelSource = 'buffer-candidate'
): Promise<CharacterHeadInstance> {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.parse(
      buffer,
      '',
      (gltf) => {
        gltfTemplates.set(type, gltf.scene);
        const inst = createGLTFHeadInstance(gltf.scene, type, modelSource);
        modelInfoRegister.set(type, {
          role: type,
          status: 'ready',
          source: modelSource,
          creator: 'GLTF 2.0 Binary',
          license: 'MIT / User',
          isCustomUpload: modelSource.startsWith('user://'),
          blendshapes: inst.blendshapeNames,
        });
        resolve(inst);
      },
      (err) => reject(err)
    );
  });
}

/**
 * Loads a character head GLTF/GLB model from URL.
 * In accordance with project instructions:
 * Does NOT silently fall back to a placeholder unless explicitly requested via options.
 */
export async function loadCharacterHeadModel(
  type: 'nick' | 'judy',
  customUrl?: string,
  options: { allowProceduralFallback?: boolean } = {}
): Promise<CharacterHeadInstance> {
  const url = customUrl || DEFAULT_MODEL_PATHS[type];

  if (gltfTemplates.has(type)) {
    return createGLTFHeadInstance(gltfTemplates.get(type)!, type, url);
  }

  let loadPromise = gltfLoadingPromises.get(type);
  if (!loadPromise) {
    loadPromise = new Promise<THREE.Group>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout loading 3D model for ${type} from "${url}"`));
      }, 2500);

      try {
        const loader = new GLTFLoader();
        loader.load(
          url,
          (gltf) => {
            clearTimeout(timeoutId);
            gltfTemplates.set(type, gltf.scene);
            resolve(gltf.scene);
          },
          undefined,
          (err) => {
            clearTimeout(timeoutId);
            reject(
              new Error(
                `Failed to load 3D model for ${type} from "${url}": ${
                  err instanceof Error ? err.message : String(err)
                }`
              )
            );
          }
        );
      } catch (err) {
        clearTimeout(timeoutId);
        reject(
          new Error(
            `Could not parse or load 3D model from "${url}": ${
              err instanceof Error ? err.message : String(err)
            }`
          )
        );
      }
    });
    gltfLoadingPromises.set(type, loadPromise);
  }

  try {
    const loadedScene = await loadPromise;
    gltfLoadingPromises.delete(type);
    const inst = createGLTFHeadInstance(loadedScene, type, url);
    modelInfoRegister.set(type, {
      role: type,
      status: 'ready',
      source: url,
      creator: 'Understand AR Pipeline Candidate',
      license: 'Candidate Model (Evaluation)',
      isCustomUpload: false,
      blendshapes: inst.blendshapeNames,
    });
    return inst;
  } catch (err) {
    gltfLoadingPromises.delete(type);
    modelInfoRegister.set(type, {
      role: type,
      status: 'error',
      source: url,
      creator: 'Unknown',
      license: 'Unknown',
      isCustomUpload: false,
      blendshapes: [],
      error: err instanceof Error ? err.message : String(err),
    });

    if (options.allowProceduralFallback) {
      return type === 'nick' ? createNickWildeHead() : createJudyHoppsHead();
    }
    throw err;
  }
}

/**
 * Preloads external GLTF models in the background.
 */
export async function preloadCharacterModels(
  urls?: Partial<Record<'nick' | 'judy', string>>,
  allowProceduralFallback = false
): Promise<void> {
  const promises: Promise<CharacterHeadInstance>[] = [];
  if (urls?.nick || DEFAULT_MODEL_PATHS.nick) {
    promises.push(
      loadCharacterHeadModel('nick', urls?.nick, { allowProceduralFallback })
    );
  }
  if (urls?.judy || DEFAULT_MODEL_PATHS.judy) {
    promises.push(
      loadCharacterHeadModel('judy', urls?.judy, { allowProceduralFallback })
    );
  }
  await Promise.allSettled(promises);
}

/**
 * Synchronously returns a character head instance.
 * If the external GLTF template is already cached, uses it.
 * If fallback is allowed and no load error occurred, returns stylized head; otherwise returns null.
 */
export function getCachedOrProceduralHead(
  type: 'nick' | 'judy',
  preferExternal = true,
  allowProceduralFallback = false
): CharacterHeadInstance | null {
  const info = modelInfoRegister.get(type);
  if (info?.status === 'error') {
    // Honest model gate: never silently return a procedural fallback on model load failure
    return null;
  }
  if (preferExternal && gltfTemplates.has(type)) {
    return createGLTFHeadInstance(
      gltfTemplates.get(type)!,
      type,
      info?.source || DEFAULT_MODEL_PATHS[type]
    );
  }
  if (allowProceduralFallback) {
    return type === 'nick' ? createNickWildeHead() : createJudyHoppsHead();
  }
  return null;
}
