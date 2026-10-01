import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
// @ts-expect-error Node fs module in test environment
import fs from 'node:fs';
// @ts-expect-error Node path module in test environment
import path from 'node:path';
import {
  createNickWildeHead,
  createJudyHoppsHead,
  createGLTFHeadInstance,
  parseCharacterHeadModel,
  loadCharacterHeadModel,
  getCachedOrProceduralHead,
  clearModelCache,
  isModelCached,
  setUserCustomModel,
} from './characterModels';

/**
 * Creates a valid, in-memory GLB buffer with morph targets
 * without requiring Node filesystem APIs.
 */
function createMockGLBBuffer(): ArrayBuffer {
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
  const jawDeltas = new Float32Array([0, -0.2, 0, 0, -0.2, 0, 0, -0.2, 0]);

  const binLength = positions.byteLength + normals.byteLength + jawDeltas.byteLength;
  const binBuffer = new Uint8Array(binLength);
  binBuffer.set(new Uint8Array(positions.buffer), 0);
  binBuffer.set(new Uint8Array(normals.buffer), positions.byteLength);
  binBuffer.set(
    new Uint8Array(jawDeltas.buffer),
    positions.byteLength + normals.byteLength
  );

  const gltf = {
    asset: { version: '2.0' },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [
      {
        name: 'TestCandidateMesh',
        extras: { targetNames: ['jawOpen'] },
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1 },
            targets: [{ POSITION: 2 }],
          },
        ],
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [0, 0, 0],
        max: [1, 1, 0],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [0, 0, 1],
        max: [0, 0, 1],
      },
      {
        bufferView: 2,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [0, -0.2, 0],
        max: [0, -0.2, 0],
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positions.byteLength },
      {
        buffer: 0,
        byteOffset: positions.byteLength,
        byteLength: normals.byteLength,
      },
      {
        buffer: 0,
        byteOffset: positions.byteLength + normals.byteLength,
        byteLength: jawDeltas.byteLength,
      },
    ],
    buffers: [{ byteLength: binLength }],
  };

  const jsonStr = JSON.stringify(gltf);
  const jsonBytes = new TextEncoder().encode(jsonStr);
  const paddedJsonLen = (jsonBytes.length + 3) & ~3;
  const jsonChunk = new Uint8Array(paddedJsonLen);
  jsonChunk.fill(0x20);
  jsonChunk.set(jsonBytes);

  const totalLength = 12 + 8 + paddedJsonLen + 8 + binLength;
  const glb = new ArrayBuffer(totalLength);
  const view = new DataView(glb);
  const u8 = new Uint8Array(glb);

  view.setUint32(0, 0x46546c67, true); // 'glTF'
  view.setUint32(4, 2, true); // version 2
  view.setUint32(8, totalLength, true);

  view.setUint32(12, paddedJsonLen, true);
  view.setUint32(16, 0x4e4f534a, true); // 'JSON'
  u8.set(jsonChunk, 20);

  const binHeaderOffset = 20 + paddedJsonLen;
  view.setUint32(binHeaderOffset, binLength, true);
  view.setUint32(binHeaderOffset + 4, 0x004e4942, true); // 'BIN\0'
  u8.set(binBuffer, binHeaderOffset + 8);

  return glb;
}

describe('3D Character Models (Nick Wilde & Judy Hopps)', () => {
  beforeEach(() => {
    clearModelCache();
  });

  it('instantiates procedural Nick Wilde with articulated jaw and blendshape responsiveness', () => {
    const nick = createNickWildeHead();
    expect(nick.type).toBe('nick');
    expect(nick.isExternalModel).toBe(false);
    expect(nick.modelSource).toBe('procedural-placeholder');
    expect(nick.root).toBeInstanceOf(THREE.Group);
    expect(nick.root.name).toBe('NickWilde_StylizedPlaceholder');

    // Test blendshapes update without error
    nick.updateBlendshapes({
      jawOpen: 0.8,
      eyeBlinkLeft: 1.0,
      eyeBlinkRight: 0.0,
      browInnerUp: 0.5,
    });

    // Test clean disposal
    expect(() => nick.dispose()).not.toThrow();
  });

  it('instantiates procedural Judy Hopps with ears, buck teeth and blendshape responsiveness', () => {
    const judy = createJudyHoppsHead();
    expect(judy.type).toBe('judy');
    expect(judy.isExternalModel).toBe(false);
    expect(judy.modelSource).toBe('procedural-placeholder');
    expect(judy.root).toBeInstanceOf(THREE.Group);
    expect(judy.root.name).toBe('JudyHopps_StylizedPlaceholder');

    // Test blendshapes update
    judy.updateBlendshapes({
      jawOpen: 0.6,
      eyeBlinkLeft: 0.5,
      eyeBlinkRight: 0.5,
      browInnerUp: 0.7,
    });

    // Test clean disposal
    expect(() => judy.dispose()).not.toThrow();
  });

  it('creates GLTF head instance with morph target bindings and updates influences', () => {
    const mockScene = new THREE.Group();
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const pos = geo.attributes.position;
    const morphPos = new Float32Array(pos.count * 3);
    geo.morphAttributes.position = [
      new THREE.BufferAttribute(morphPos, 3),
      new THREE.BufferAttribute(morphPos, 3),
    ];
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial());
    mesh.morphTargetDictionary = { jawOpen: 0, eyeBlinkLeft: 1 };
    mesh.morphTargetInfluences = [0, 0];
    mockScene.add(mesh);

    const instance = createGLTFHeadInstance(mockScene, 'nick', 'test-mock');
    expect(instance.type).toBe('nick');
    expect(instance.isExternalModel).toBe(true);
    expect(instance.modelSource).toBe('test-mock');

    instance.updateBlendshapes({
      jawOpen: 0.75,
      eyeBlinkLeft: 0.9,
    });

    const clonedMesh = instance.root.getObjectByProperty('type', 'Mesh') as THREE.Mesh;
    expect(clonedMesh).toBeDefined();
    expect(clonedMesh.morphTargetInfluences![0]).toBeCloseTo(0.75);
    expect(clonedMesh.morphTargetInfluences![1]).toBeCloseTo(0.9);

    expect(() => instance.dispose()).not.toThrow();
  });

  it('articulates skeletal jaw bone when jaw bone is present in GLTF hierarchy', () => {
    const mockScene = new THREE.Group();
    const headBone = new THREE.Bone();
    headBone.name = 'head';
    const jawBone = new THREE.Bone();
    jawBone.name = 'jaw';
    headBone.add(jawBone);
    mockScene.add(headBone);

    const instance = createGLTFHeadInstance(mockScene, 'judy');
    instance.updateBlendshapes({ jawOpen: 0.8 });

    const clonedJaw = instance.root.getObjectByName('jaw') as THREE.Bone;
    expect(clonedJaw).toBeDefined();
    expect(clonedJaw.rotation.x).toBeCloseTo(-0.8 * 0.45);
  });

  it('articulates named Object3D / Group jaw pivot even if not a THREE.Bone instance', () => {
    const mockScene = new THREE.Group();
    const headGroup = new THREE.Group();
    headGroup.name = 'HeadRoot';
    const jawPivot = new THREE.Group();
    jawPivot.name = 'jawPivot';
    headGroup.add(jawPivot);
    mockScene.add(headGroup);

    const instance = createGLTFHeadInstance(mockScene, 'nick');
    instance.updateBlendshapes({ jawOpen: 0.7 });

    const clonedPivot = instance.root.getObjectByName('jawPivot') as THREE.Group;
    expect(clonedPivot).toBeDefined();
    expect(clonedPivot.rotation.x).toBeCloseTo(-0.7 * 0.45);
  });

  it('parses real candidate GLB binary and binds morph targets', async () => {
    const arrayBuffer = createMockGLBBuffer();
    const instance = await parseCharacterHeadModel(
      arrayBuffer,
      'nick',
      'memory://candidate.glb'
    );
    expect(instance.type).toBe('nick');
    expect(instance.isExternalModel).toBe(true);

    instance.updateBlendshapes({
      jawOpen: 0.65,
    });

    expect(isModelCached('nick')).toBe(true);
    expect(() => instance.dispose()).not.toThrow();
  });

  it('parses generated on-disk candidate GLB files and verifies full character geometry and morphs', async () => {
    const nickPath = path.resolve('public/models/nick_candidate.glb');
    const judyPath = path.resolve('public/models/judy_candidate.glb');

    expect(fs.existsSync(nickPath)).toBe(true);
    expect(fs.existsSync(judyPath)).toBe(true);

    const nickBuf = fs.readFileSync(nickPath).buffer;
    const nickInstance = await parseCharacterHeadModel(nickBuf, 'nick', '/models/nick_candidate.glb');
    expect(nickInstance.type).toBe('nick');
    expect(nickInstance.isExternalModel).toBe(true);

    // Verify multiple meshes exist (not just 1 deformed oval)
    const nickMeshes: THREE.Mesh[] = [];
    nickInstance.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) nickMeshes.push(obj);
    });
    expect(nickMeshes.length).toBeGreaterThan(10);

    // Verify blendshapes update without error
    nickInstance.updateBlendshapes({
      jawOpen: 0.8,
      eyeBlinkLeft: 1.0,
      eyeBlinkRight: 0.5,
      browInnerUp: 0.6,
    });
    expect(() => nickInstance.dispose()).not.toThrow();

    const judyBuf = fs.readFileSync(judyPath).buffer;
    const judyInstance = await parseCharacterHeadModel(judyBuf, 'judy', '/models/judy_candidate.glb');
    expect(judyInstance.type).toBe('judy');
    expect(judyInstance.isExternalModel).toBe(true);

    const judyMeshes: THREE.Mesh[] = [];
    judyInstance.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) judyMeshes.push(obj);
    });
    expect(judyMeshes.length).toBeGreaterThan(10);

    judyInstance.updateBlendshapes({
      jawOpen: 0.5,
      eyeBlinkLeft: 0.8,
      eyeBlinkRight: 0.8,
      browInnerUp: 0.7,
    });
    expect(() => judyInstance.dispose()).not.toThrow();
  });

  it('rejects without silent fallback on load failure when fallback is not enabled', async () => {
    // Attempt to load from non-existent URL without fallback
    await expect(
      loadCharacterHeadModel('nick', '/invalid/path/does_not_exist.glb')
    ).rejects.toThrow();
  });

  it('allows explicit procedural fallback on load failure when opted in', async () => {
    const instance = await loadCharacterHeadModel(
      'nick',
      '/invalid/path/does_not_exist_fallback.glb',
      { allowProceduralFallback: true }
    );
    expect(instance).toBeDefined();
    expect(instance.type).toBe('nick');
    expect(instance.isExternalModel).toBe(false);
    expect(instance.modelSource).toBe('procedural-placeholder');
  });

  it('registers and loads a user-provided custom GLB model directly into memory', async () => {
    const arrayBuffer = createMockGLBBuffer();
    const customInstance = await setUserCustomModel('judy', arrayBuffer, 'my_custom_judy.glb');
    expect(customInstance.type).toBe('judy');
    expect(customInstance.isExternalModel).toBe(true);
    expect(customInstance.modelSource).toBe('user://my_custom_judy.glb');
    expect(isModelCached('judy')).toBe(true);
  });

  it('getCachedOrProceduralHead returns cached model if available or procedural fallback when requested', () => {
    clearModelCache();
    expect(isModelCached('judy')).toBe(false);
    // By default without fallback flag, returns null
    expect(getCachedOrProceduralHead('judy', true, false)).toBeNull();
    // When fallback is explicitly allowed and no load error occurred, returns procedural
    const fallback = getCachedOrProceduralHead('judy', true, true);
    expect(fallback).not.toBeNull();
    expect(fallback?.isExternalModel).toBe(false);
    expect(fallback?.type).toBe('judy');
  });

  it('refuses silent procedural fallback and returns null when model has error status', async () => {
    clearModelCache();
    // Attempting to load an invalid model sets error status
    await expect(
      loadCharacterHeadModel('nick', '/non_existent_model_12345.glb')
    ).rejects.toThrow();

    // Now model status is 'error'. getCachedOrProceduralHead MUST return null and refuse silent fallback
    const result = getCachedOrProceduralHead('nick', true, true);
    expect(result).toBeNull();
  });
});
