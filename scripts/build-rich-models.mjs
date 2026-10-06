import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Polyfill FileReader for Node.js environment
globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
};

/**
 * Attaches MediaPipe-compatible morph targets to a BufferGeometry.
 */
function attachFacialMorphTargets(geometry, isBunny = false) {
  const pos = geometry.attributes.position;
  const count = pos.count;

  const jawDeltas = new Float32Array(count * 3);
  const blinkLDeltas = new Float32Array(count * 3);
  const blinkRDeltas = new Float32Array(count * 3);
  const browDeltas = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    const pz = pos.getZ(i);

    // 1. jawOpen: lower snout & chin
    if (py < -0.05 && pz > -0.3) {
      const weight = Math.min(Math.max((-py - 0.05) / 0.55, 0), 1);
      jawDeltas[i * 3 + 1] = -0.38 * weight;
      jawDeltas[i * 3 + 2] = -0.08 * weight;
    }

    // 2. eyeBlinkLeft (user perspective: left side is negative x in model space)
    if (px < -0.1 && py > 0.0 && py < 0.45 && pz > 0.25) {
      blinkLDeltas[i * 3 + 1] = -0.12;
      blinkLDeltas[i * 3 + 2] = 0.02;
    }

    // 3. eyeBlinkRight (user perspective: right side is positive x in model space)
    if (px > 0.1 && py > 0.0 && py < 0.45 && pz > 0.25) {
      blinkRDeltas[i * 3 + 1] = -0.12;
      blinkRDeltas[i * 3 + 2] = 0.02;
    }

    // 4. browInnerUp
    if (Math.abs(px) < 0.32 && py > 0.22 && pz > 0.2) {
      browDeltas[i * 3 + 1] = 0.12;
      browDeltas[i * 3 + 2] = 0.03;
    }
  }

  geometry.morphAttributes.position = [
    new THREE.BufferAttribute(jawDeltas, 3),
    new THREE.BufferAttribute(blinkLDeltas, 3),
    new THREE.BufferAttribute(blinkRDeltas, 3),
    new THREE.BufferAttribute(browDeltas, 3),
  ];
}

function createMorphDictionary(mesh) {
  mesh.morphTargetDictionary = {
    jawOpen: 0,
    eyeBlinkLeft: 1,
    eyeBlinkRight: 2,
    browInnerUp: 3,
  };
  mesh.morphTargetInfluences = [0, 0, 0, 0];
}

/**
 * Builds the complete Nick Wilde (Stylized Fox) 3D Model
 */
export function buildNickWildeModel() {
  const root = new THREE.Group();
  root.name = 'NickWilde_CandidateHead';

  // Materials
  const orangeFurMat = new THREE.MeshStandardMaterial({
    name: 'Nick_OrangeFur',
    color: 0xd95f26,
    roughness: 0.65,
    metalness: 0.05,
  });
  const creamFurMat = new THREE.MeshStandardMaterial({
    name: 'Nick_CreamFur',
    color: 0xf6ede2,
    roughness: 0.7,
  });
  const darkFurMat = new THREE.MeshStandardMaterial({
    name: 'Nick_DarkFur',
    color: 0x24140d,
    roughness: 0.5,
  });
  const innerEarMat = new THREE.MeshStandardMaterial({
    name: 'Nick_InnerEar',
    color: 0xf5ded0,
    roughness: 0.8,
  });
  const eyeWhiteMat = new THREE.MeshBasicMaterial({
    name: 'EyeWhite',
    color: 0xffffff,
  });
  const irisMat = new THREE.MeshStandardMaterial({
    name: 'Nick_IrisGreen',
    color: 0x388e3c,
    roughness: 0.2,
  });
  const pupilMat = new THREE.MeshBasicMaterial({
    name: 'PupilBlack',
    color: 0x0a0a0a,
  });
  const mouthInnerMat = new THREE.MeshStandardMaterial({
    name: 'MouthInner',
    color: 0x6e2226,
    roughness: 0.5,
  });
  const teethMat = new THREE.MeshStandardMaterial({
    name: 'TeethWhite',
    color: 0xffffff,
    roughness: 0.2,
  });
  const tieMat = new THREE.MeshStandardMaterial({
    name: 'Nick_GreenTie',
    color: 0x4f772d,
    roughness: 0.6,
  });

  // 1. Skull / Head with full morph targets
  const skullGeo = new THREE.SphereGeometry(1.0, 24, 20);
  skullGeo.scale(0.9, 1.0, 0.95);
  attachFacialMorphTargets(skullGeo, false);
  const skullMesh = new THREE.Mesh(skullGeo, orangeFurMat);
  skullMesh.name = 'Nick_Skull';
  createMorphDictionary(skullMesh);
  root.add(skullMesh);

  // 2. Cheek Tufts
  const cheekGeo = new THREE.ConeGeometry(0.45, 0.9, 6);
  cheekGeo.rotateZ(Math.PI / 2);
  const leftCheek = new THREE.Mesh(cheekGeo, creamFurMat);
  leftCheek.name = 'Nick_LeftCheek';
  leftCheek.position.set(-0.85, -0.2, 0.1);
  leftCheek.rotation.set(0.1, -0.3, 0.4);
  root.add(leftCheek);

  const rightCheek = new THREE.Mesh(cheekGeo, creamFurMat);
  rightCheek.name = 'Nick_RightCheek';
  rightCheek.position.set(0.85, -0.2, 0.1);
  rightCheek.rotation.set(0.1, 0.3, -0.4);
  root.add(rightCheek);

  // 3. Upper Snout / Muzzle
  const snoutGeo = new THREE.ConeGeometry(0.48, 1.1, 16);
  snoutGeo.rotateX(Math.PI / 2);
  snoutGeo.translate(0, -0.15, 0.9);
  const upperSnout = new THREE.Mesh(snoutGeo, orangeFurMat);
  upperSnout.name = 'Nick_UpperSnout';
  root.add(upperSnout);

  const muzzleUnderGeo = new THREE.SphereGeometry(0.35, 14, 12);
  muzzleUnderGeo.scale(1.1, 0.6, 1.3);
  muzzleUnderGeo.translate(0, -0.27, 1.05);
  const muzzleUnder = new THREE.Mesh(muzzleUnderGeo, creamFurMat);
  muzzleUnder.name = 'Nick_MuzzleUnder';
  root.add(muzzleUnder);

  const noseGeo = new THREE.SphereGeometry(0.13, 12, 10);
  noseGeo.scale(1.2, 0.8, 1.1);
  noseGeo.translate(0, -0.1, 1.5);
  const nose = new THREE.Mesh(noseGeo, darkFurMat);
  nose.name = 'Nick_NoseTip';
  root.add(nose);

  // 4. Lower Jaw Group with Morph Target
  const jawGeo = new THREE.BoxGeometry(0.38, 0.16, 0.65);
  jawGeo.translate(0, -0.43, 0.65);
  // Add jawOpen delta directly to jaw geometry
  const jawPos = jawGeo.attributes.position;
  const jawDeltaArr = new Float32Array(jawPos.count * 3);
  for (let i = 0; i < jawPos.count; i++) {
    jawDeltaArr[i * 3 + 1] = -0.35;
    jawDeltaArr[i * 3 + 2] = -0.06;
  }
  jawGeo.morphAttributes.position = [
    new THREE.BufferAttribute(jawDeltaArr, 3),
    new THREE.BufferAttribute(new Float32Array(jawPos.count * 3), 3),
    new THREE.BufferAttribute(new Float32Array(jawPos.count * 3), 3),
    new THREE.BufferAttribute(new Float32Array(jawPos.count * 3), 3),
  ];
  const jawMesh = new THREE.Mesh(jawGeo, creamFurMat);
  jawMesh.name = 'Nick_LowerJaw';
  createMorphDictionary(jawMesh);
  root.add(jawMesh);

  // Lower teeth
  const teethGeo = new THREE.BoxGeometry(0.24, 0.06, 0.06);
  teethGeo.translate(0, -0.34, 0.85);
  const lowerTeeth = new THREE.Mesh(teethGeo, teethMat);
  lowerTeeth.name = 'Nick_LowerTeeth';
  root.add(lowerTeeth);

  // Tongue
  const tongueGeo = new THREE.SphereGeometry(0.14, 10, 8);
  tongueGeo.scale(1, 0.3, 1.4);
  tongueGeo.translate(0, -0.35, 0.7);
  const tongue = new THREE.Mesh(tongueGeo, mouthInnerMat);
  tongue.name = 'Nick_Tongue';
  root.add(tongue);

  // 5. Fox Ears
  const addEar = (isRight) => {
    const sign = isRight ? 1 : -1;
    const earGroup = new THREE.Group();
    earGroup.name = isRight ? 'Nick_RightEarGroup' : 'Nick_LeftEarGroup';
    earGroup.position.set(sign * 0.62, 0.85, -0.15);
    earGroup.rotation.set(0.15, -sign * 0.25, -sign * 0.35);

    const earGeo = new THREE.ConeGeometry(0.42, 1.25, 8);
    earGeo.scale(0.8, 1, 0.4);
    const earOuter = new THREE.Mesh(earGeo, orangeFurMat);
    earOuter.name = isRight ? 'Nick_RightEarOuter' : 'Nick_LeftEarOuter';
    earOuter.position.y = 0.55;
    earGroup.add(earOuter);

    const earTipGeo = new THREE.ConeGeometry(0.22, 0.45, 8);
    earTipGeo.scale(0.8, 1, 0.4);
    const earTip = new THREE.Mesh(earTipGeo, darkFurMat);
    earTip.name = isRight ? 'Nick_RightEarTip' : 'Nick_LeftEarTip';
    earTip.position.y = 0.95;
    earGroup.add(earTip);

    const innerEarGeo = new THREE.ConeGeometry(0.3, 0.85, 6);
    innerEarGeo.scale(0.7, 1, 0.2);
    const innerEar = new THREE.Mesh(innerEarGeo, innerEarMat);
    innerEar.name = isRight ? 'Nick_RightEarFluff' : 'Nick_LeftEarFluff';
    innerEar.position.set(0, 0.42, 0.08);
    earGroup.add(innerEar);

    root.add(earGroup);
  };
  addEar(false);
  addEar(true);

  // 6. Eyes & Eyelids
  const addEye = (isRight) => {
    const sign = isRight ? 1 : -1;
    const eyeGroup = new THREE.Group();
    eyeGroup.name = isRight ? 'Nick_RightEyeGroup' : 'Nick_LeftEyeGroup';
    eyeGroup.position.set(sign * 0.42, 0.2, 0.72);
    eyeGroup.rotation.set(0, sign * 0.3, 0);

    // Eye white
    const eyeWhiteGeo = new THREE.SphereGeometry(0.22, 16, 14);
    eyeWhiteGeo.scale(1.1, 0.9, 0.7);
    const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeWhite.name = isRight ? 'Nick_RightEyeWhite' : 'Nick_LeftEyeWhite';
    eyeGroup.add(eyeWhite);

    // Green Iris
    const eyeIrisGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
    eyeIrisGeo.rotateX(Math.PI / 2);
    const eyeIris = new THREE.Mesh(eyeIrisGeo, irisMat);
    eyeIris.name = isRight ? 'Nick_RightIris' : 'Nick_LeftIris';
    eyeIris.position.set(0, 0, 0.13);
    eyeGroup.add(eyeIris);

    // Pupil
    const eyePupilGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12);
    eyePupilGeo.rotateX(Math.PI / 2);
    eyePupilGeo.scale(0.6, 1.2, 1);
    const eyePupil = new THREE.Mesh(eyePupilGeo, pupilMat);
    eyePupil.name = isRight ? 'Nick_RightPupil' : 'Nick_LeftPupil';
    eyePupil.position.set(0, 0, 0.14);
    eyeGroup.add(eyePupil);

    // Eyelid with Morph Target
    const eyelidGeo = new THREE.SphereGeometry(0.24, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    eyelidGeo.rotateX(-Math.PI / 2);
    const elPos = eyelidGeo.attributes.position;
    const elDeltas = new Float32Array(elPos.count * 3);
    for (let i = 0; i < elPos.count; i++) {
      elDeltas[i * 3 + 1] = -0.16;
    }
    eyelidGeo.morphAttributes.position = [
      new THREE.BufferAttribute(new Float32Array(elPos.count * 3), 3),
      new THREE.BufferAttribute(isRight ? new Float32Array(elPos.count * 3) : elDeltas, 3),
      new THREE.BufferAttribute(isRight ? elDeltas : new Float32Array(elPos.count * 3), 3),
      new THREE.BufferAttribute(new Float32Array(elPos.count * 3), 3),
    ];
    const eyelid = new THREE.Mesh(eyelidGeo, orangeFurMat);
    eyelid.name = isRight ? 'Nick_RightEyelid' : 'Nick_LeftEyelid';
    eyelid.position.set(0, 0.12, 0.02);
    createMorphDictionary(eyelid);
    eyeGroup.add(eyelid);

    // Eyebrow
    const browGeo = new THREE.BoxGeometry(0.32, 0.06, 0.1);
    const browPos = browGeo.attributes.position;
    const browDeltas = new Float32Array(browPos.count * 3);
    for (let i = 0; i < browPos.count; i++) {
      browDeltas[i * 3 + 1] = 0.09;
    }
    browGeo.morphAttributes.position = [
      new THREE.BufferAttribute(new Float32Array(browPos.count * 3), 3),
      new THREE.BufferAttribute(new Float32Array(browPos.count * 3), 3),
      new THREE.BufferAttribute(new Float32Array(browPos.count * 3), 3),
      new THREE.BufferAttribute(browDeltas, 3),
    ];
    const brow = new THREE.Mesh(browGeo, darkFurMat);
    brow.name = isRight ? 'Nick_RightBrow' : 'Nick_LeftBrow';
    brow.position.set(0, 0.28, 0.1);
    brow.rotation.z = sign * -0.2;
    createMorphDictionary(brow);
    eyeGroup.add(brow);

    root.add(eyeGroup);
  };
  addEye(false);
  addEye(true);

  // 7. Collar & Tie
  const collarGeo = new THREE.CylinderGeometry(0.75, 0.85, 0.45, 16);
  collarGeo.translate(0, -0.9, 0);
  const collar = new THREE.Mesh(collarGeo, tieMat);
  collar.name = 'Nick_Collar';
  root.add(collar);

  const tieGeo = new THREE.ConeGeometry(0.18, 0.6, 4);
  tieGeo.rotateX(Math.PI);
  tieGeo.translate(0, -1.05, 0.72);
  const tie = new THREE.Mesh(tieGeo, tieMat);
  tie.name = 'Nick_Tie';
  root.add(tie);

  return root;
}

/**
 * Builds the complete Judy Hopps (Stylized Bunny) 3D Model
 */
export function buildJudyHoppsModel() {
  const root = new THREE.Group();
  root.name = 'JudyHopps_CandidateHead';

  // Materials
  const bunnyFurMat = new THREE.MeshStandardMaterial({
    name: 'Judy_LavenderFur',
    color: 0x98a0b0,
    roughness: 0.65,
    metalness: 0.05,
  });
  const cheekCreamMat = new THREE.MeshStandardMaterial({
    name: 'Judy_CheekCream',
    color: 0xeef0f6,
    roughness: 0.7,
  });
  const pinkInnerMat = new THREE.MeshStandardMaterial({
    name: 'Judy_PinkInner',
    color: 0xf4a6b8,
    roughness: 0.6,
  });
  const darkTipMat = new THREE.MeshStandardMaterial({
    name: 'Judy_DarkTip',
    color: 0x363a45,
    roughness: 0.5,
  });
  const eyeWhiteMat = new THREE.MeshBasicMaterial({
    name: 'EyeWhite',
    color: 0xffffff,
  });
  const irisMat = new THREE.MeshStandardMaterial({
    name: 'Judy_IrisViolet',
    color: 0x7b2cbf,
    roughness: 0.2,
  });
  const pupilMat = new THREE.MeshBasicMaterial({
    name: 'PupilBlack',
    color: 0x0f0b18,
  });
  const teethMat = new THREE.MeshStandardMaterial({
    name: 'TeethWhite',
    color: 0xffffff,
    roughness: 0.1,
  });
  const zpdCollarMat = new THREE.MeshStandardMaterial({
    name: 'Judy_ZPDCollar',
    color: 0x1d3557,
    roughness: 0.5,
  });

  // 1. Skull / Head with full morph targets
  const skullGeo = new THREE.SphereGeometry(1.0, 24, 20);
  skullGeo.scale(0.96, 0.95, 0.95);
  attachFacialMorphTargets(skullGeo, true);
  const skullMesh = new THREE.Mesh(skullGeo, bunnyFurMat);
  skullMesh.name = 'Judy_Skull';
  createMorphDictionary(skullMesh);
  root.add(skullMesh);

  // 2. Chubby Bunny Cheeks
  const leftCheekGeo = new THREE.SphereGeometry(0.48, 16, 12);
  leftCheekGeo.scale(1.1, 0.85, 1.1);
  leftCheekGeo.translate(-0.52, -0.22, 0.42);
  const leftCheek = new THREE.Mesh(leftCheekGeo, cheekCreamMat);
  leftCheek.name = 'Judy_LeftCheek';
  root.add(leftCheek);

  const rightCheekGeo = new THREE.SphereGeometry(0.48, 16, 12);
  rightCheekGeo.scale(1.1, 0.85, 1.1);
  rightCheekGeo.translate(0.52, -0.22, 0.42);
  const rightCheek = new THREE.Mesh(rightCheekGeo, cheekCreamMat);
  rightCheek.name = 'Judy_RightCheek';
  root.add(rightCheek);

  // 3. Bunny Muzzle & Pink Nose
  const muzzleGeo = new THREE.SphereGeometry(0.35, 14, 12);
  muzzleGeo.scale(0.9, 0.7, 0.9);
  muzzleGeo.translate(0, -0.15, 0.72);
  const muzzle = new THREE.Mesh(muzzleGeo, cheekCreamMat);
  muzzle.name = 'Judy_Muzzle';
  root.add(muzzle);

  const noseGeo = new THREE.ConeGeometry(0.1, 0.12, 4);
  noseGeo.rotateZ(Math.PI);
  noseGeo.translate(0, -0.06, 0.92);
  const nose = new THREE.Mesh(noseGeo, pinkInnerMat);
  nose.name = 'Judy_Nose';
  root.add(nose);

  // 4. Iconic Front Buck Teeth
  const buckTeethGeo = new THREE.BoxGeometry(0.18, 0.15, 0.05);
  buckTeethGeo.translate(0, -0.31, 0.82);
  const buckTeeth = new THREE.Mesh(buckTeethGeo, teethMat);
  buckTeeth.name = 'Judy_BuckTeeth';
  root.add(buckTeeth);

  // 5. Articulated Lower Jaw with Morph Target
  const jawGeo = new THREE.BoxGeometry(0.32, 0.14, 0.35);
  jawGeo.translate(0, -0.42, 0.62);
  const jawPos = jawGeo.attributes.position;
  const jawDeltaArr = new Float32Array(jawPos.count * 3);
  for (let i = 0; i < jawPos.count; i++) {
    jawDeltaArr[i * 3 + 1] = -0.32;
    jawDeltaArr[i * 3 + 2] = -0.05;
  }
  jawGeo.morphAttributes.position = [
    new THREE.BufferAttribute(jawDeltaArr, 3),
    new THREE.BufferAttribute(new Float32Array(jawPos.count * 3), 3),
    new THREE.BufferAttribute(new Float32Array(jawPos.count * 3), 3),
    new THREE.BufferAttribute(new Float32Array(jawPos.count * 3), 3),
  ];
  const jawMesh = new THREE.Mesh(jawGeo, cheekCreamMat);
  jawMesh.name = 'Judy_LowerJaw';
  createMorphDictionary(jawMesh);
  root.add(jawMesh);

  // 6. Big Upright Judy Hopps Bunny Ears
  const addEar = (isRight) => {
    const sign = isRight ? 1 : -1;
    const earGroup = new THREE.Group();
    earGroup.name = isRight ? 'Judy_RightEarGroup' : 'Judy_LeftEarGroup';
    earGroup.position.set(sign * 0.48, 0.82, -0.05);
    earGroup.rotation.set(-0.08, -sign * 0.15, -sign * 0.12);

    const earGeo = new THREE.CylinderGeometry(0.24, 0.32, 2.3, 16);
    earGeo.scale(0.85, 1, 0.32);
    earGeo.translate(0, 1.15, 0);
    const earOuter = new THREE.Mesh(earGeo, bunnyFurMat);
    earOuter.name = isRight ? 'Judy_RightEarOuter' : 'Judy_LeftEarOuter';
    earGroup.add(earOuter);

    const earTipGeo = new THREE.ConeGeometry(0.25, 0.6, 12);
    earTipGeo.scale(0.85, 1, 0.32);
    const earTip = new THREE.Mesh(earTipGeo, darkTipMat);
    earTip.name = isRight ? 'Judy_RightEarTip' : 'Judy_LeftEarTip';
    earTip.position.set(0, 2.3, 0);
    earGroup.add(earTip);

    const innerGeo = new THREE.CylinderGeometry(0.16, 0.22, 1.8, 12);
    innerGeo.scale(0.7, 1, 0.15);
    innerGeo.translate(0, 1.0, 0.06);
    const innerEar = new THREE.Mesh(innerGeo, pinkInnerMat);
    innerEar.name = isRight ? 'Judy_RightEarInner' : 'Judy_LeftEarInner';
    earGroup.add(innerEar);

    root.add(earGroup);
  };
  addEar(false);
  addEar(true);

  // 7. Expressive Purple Eyes
  const addEye = (isRight) => {
    const sign = isRight ? 1 : -1;
    const eyeGroup = new THREE.Group();
    eyeGroup.name = isRight ? 'Judy_RightEyeGroup' : 'Judy_LeftEyeGroup';
    eyeGroup.position.set(sign * 0.46, 0.15, 0.66);
    eyeGroup.rotation.set(0, sign * 0.28, 0);

    // Eye white
    const eyeWhiteGeo = new THREE.SphereGeometry(0.26, 16, 14);
    eyeWhiteGeo.scale(1.0, 1.1, 0.7);
    const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeWhite.name = isRight ? 'Judy_RightEyeWhite' : 'Judy_LeftEyeWhite';
    eyeGroup.add(eyeWhite);

    // Violet Iris
    const irisGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.05, 18);
    irisGeo.rotateX(Math.PI / 2);
    const iris = new THREE.Mesh(irisGeo, irisMat);
    iris.name = isRight ? 'Judy_RightIris' : 'Judy_LeftIris';
    iris.position.set(0, 0, 0.14);
    eyeGroup.add(iris);

    // Pupil
    const pupilGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 14);
    pupilGeo.rotateX(Math.PI / 2);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.name = isRight ? 'Judy_RightPupil' : 'Judy_LeftPupil';
    pupil.position.set(0, 0, 0.15);
    eyeGroup.add(pupil);

    // Eye highlight gleam
    const gleamGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const gleam = new THREE.Mesh(gleamGeo, eyeWhiteMat);
    gleam.name = isRight ? 'Judy_RightGleam' : 'Judy_LeftGleam';
    gleam.position.set(0.06, 0.06, 0.17);
    eyeGroup.add(gleam);

    // Eyelid with Morph Target
    const eyelidGeo = new THREE.SphereGeometry(0.28, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    eyelidGeo.rotateX(-Math.PI / 2);
    const elPos = eyelidGeo.attributes.position;
    const elDeltas = new Float32Array(elPos.count * 3);
    for (let i = 0; i < elPos.count; i++) {
      elDeltas[i * 3 + 1] = -0.18;
    }
    eyelidGeo.morphAttributes.position = [
      new THREE.BufferAttribute(new Float32Array(elPos.count * 3), 3),
      new THREE.BufferAttribute(isRight ? new Float32Array(elPos.count * 3) : elDeltas, 3),
      new THREE.BufferAttribute(isRight ? elDeltas : new Float32Array(elPos.count * 3), 3),
      new THREE.BufferAttribute(new Float32Array(elPos.count * 3), 3),
    ];
    const eyelid = new THREE.Mesh(eyelidGeo, bunnyFurMat);
    eyelid.name = isRight ? 'Judy_RightEyelid' : 'Judy_LeftEyelid';
    eyelid.position.set(0, 0.14, 0.03);
    createMorphDictionary(eyelid);
    eyeGroup.add(eyelid);

    // Brow
    const browGeo = new THREE.BoxGeometry(0.3, 0.05, 0.08);
    const browPos = browGeo.attributes.position;
    const browDeltas = new Float32Array(browPos.count * 3);
    for (let i = 0; i < browPos.count; i++) {
      browDeltas[i * 3 + 1] = 0.07;
    }
    browGeo.morphAttributes.position = [
      new THREE.BufferAttribute(new Float32Array(browPos.count * 3), 3),
      new THREE.BufferAttribute(new Float32Array(browPos.count * 3), 3),
      new THREE.BufferAttribute(new Float32Array(browPos.count * 3), 3),
      new THREE.BufferAttribute(browDeltas, 3),
    ];
    const brow = new THREE.Mesh(browGeo, darkTipMat);
    brow.name = isRight ? 'Judy_RightBrow' : 'Judy_LeftBrow';
    brow.position.set(0, 0.32, 0.08);
    brow.rotation.z = sign * -0.1;
    createMorphDictionary(brow);
    eyeGroup.add(brow);

    root.add(eyeGroup);
  };
  addEye(false);
  addEye(true);

  // 8. Judy's ZPD Officer Collar
  const collarGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.4, 16);
  collarGeo.translate(0, -0.85, 0);
  const collar = new THREE.Mesh(collarGeo, zpdCollarMat);
  collar.name = 'Judy_ZPDCollar';
  root.add(collar);

  return root;
}

export async function exportModels() {
  const exporter = new GLTFExporter();
  const outDir = path.resolve('public/models');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const nick = buildNickWildeModel();
  const nickGlb = await exporter.parseAsync(nick, { binary: true });
  const nickPath = path.join(outDir, 'nick_candidate.glb');
  fs.writeFileSync(nickPath, Buffer.from(nickGlb));
  console.log(`Saved ${nickPath} (${nickGlb.byteLength} bytes)`);

  const judy = buildJudyHoppsModel();
  const judyGlb = await exporter.parseAsync(judy, { binary: true });
  const judyPath = path.join(outDir, 'judy_candidate.glb');
  fs.writeFileSync(judyPath, Buffer.from(judyGlb));
  console.log(`Saved ${judyPath} (${judyGlb.byteLength} bytes)`);
}

if (process.argv[1] && process.argv[1].endsWith('build-rich-models.mjs')) {
  exportModels().catch((err) => {
    console.error('Export failed:', err);
    process.exit(1);
  });
}
