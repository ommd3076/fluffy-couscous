import fs from 'fs';
import path from 'path';

/**
 * Inspects a GLB or GLTF file and outputs detailed metadata:
 * - File size & format
 * - Meshes, primitives, vertices, triangles
 * - Morph targets / Blendshapes
 * - Skeleton bones / Skinning
 * - Materials & Textures
 * - Face tracking compatibility verdict
 */
export function inspectGLTF(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  let gltfJson = null;

  if (ext === '.glb') {
    const buffer = fs.readFileSync(filePath);
    if (buffer.length < 12) {
      throw new Error('Invalid GLB file: header too short');
    }

    const magic = buffer.readUInt32LE(0);
    if (magic !== 0x46546c67) {
      throw new Error(`Invalid GLB magic: 0x${magic.toString(16)} (expected 0x46546c67 'glTF')`);
    }

    const version = buffer.readUInt32LE(4);
    const totalLength = buffer.readUInt32LE(8);

    let offset = 12;
    while (offset < buffer.length) {
      const chunkLength = buffer.readUInt32LE(offset);
      const chunkType = buffer.readUInt32LE(offset + 4);
      offset += 8;

      if (chunkType === 0x4e4f534a) {
        // 'JSON'
        const jsonStr = buffer.toString('utf8', offset, offset + chunkLength);
        gltfJson = JSON.parse(jsonStr);
        break;
      }
      offset += chunkLength;
    }

    if (!gltfJson) {
      throw new Error('GLB file did not contain a JSON chunk');
    }
  } else if (ext === '.gltf') {
    const raw = fs.readFileSync(filePath, 'utf8');
    gltfJson = JSON.parse(raw);
  } else {
    throw new Error(`Unsupported 3D file format: ${ext}. Expected .glb or .gltf`);
  }

  // Analyze structure
  const accessors = gltfJson.accessors || [];
  const meshes = gltfJson.meshes || [];
  const nodes = gltfJson.nodes || [];
  const materials = gltfJson.materials || [];
  const textures = gltfJson.textures || [];
  const skins = gltfJson.skins || [];
  const animations = gltfJson.animations || [];

  let totalVertices = 0;
  let totalTriangles = 0;
  const morphTargetNames = new Set();
  let hasMorphTargets = false;

  for (const mesh of meshes) {
    if (mesh.extras?.targetNames && Array.isArray(mesh.extras.targetNames)) {
      mesh.extras.targetNames.forEach((n) => morphTargetNames.add(n));
      hasMorphTargets = true;
    }

    for (const prim of mesh.primitives || []) {
      if (prim.targets && prim.targets.length > 0) {
        hasMorphTargets = true;
        // In some models, targets don't have extras.targetNames
        if (morphTargetNames.size === 0) {
          prim.targets.forEach((_, idx) => morphTargetNames.add(`morphTarget_${idx}`));
        }
      }

      // Vertices
      if (prim.attributes && prim.attributes.POSITION !== undefined) {
        const posAcc = accessors[prim.attributes.POSITION];
        if (posAcc) {
          totalVertices += posAcc.count || 0;
        }
      }

      // Triangles
      if (prim.indices !== undefined) {
        const indAcc = accessors[prim.indices];
        if (indAcc) {
          totalTriangles += Math.floor((indAcc.count || 0) / 3);
        }
      } else if (prim.attributes && prim.attributes.POSITION !== undefined) {
        const posAcc = accessors[prim.attributes.POSITION];
        if (posAcc) {
          totalTriangles += Math.floor((posAcc.count || 0) / 3);
        }
      }
    }
  }

  // Bone inspection
  const bones = [];
  for (const skin of skins) {
    for (const jointIdx of skin.joints || []) {
      const node = nodes[jointIdx];
      bones.push(node?.name || `joint_${jointIdx}`);
    }
  }

  // MediaPipe / ARKit facial compatibility evaluation
  const targetArray = Array.from(morphTargetNames);
  const facialKeys = [
    'jawopen',
    'mouthopen',
    'eyeblinkleft',
    'eyeblinkright',
    'blink',
    'blink_l',
    'blink_r',
    'browinnerup',
    'browup',
    'smile',
    'mouthsmileleft',
    'mouthsmileright',
  ];
  const detectedFacialMorphs = targetArray.filter((name) =>
    facialKeys.some((k) => name.toLowerCase().includes(k))
  );

  const report = {
    filePath: path.resolve(filePath),
    fileName: path.basename(filePath),
    fileSizeKB: Math.round(stat.size / 1024),
    generator: gltfJson.asset?.generator || 'Unknown',
    meshCount: meshes.length,
    nodeCount: nodes.length,
    vertexCount: totalVertices,
    triangleCount: totalTriangles,
    materialCount: materials.length,
    textureCount: textures.length,
    skinCount: skins.length,
    boneCount: bones.length,
    bones: bones.slice(0, 15), // sample
    hasMorphTargets,
    morphTargetCount: targetArray.length,
    morphTargets: targetArray,
    detectedFacialMorphs,
    isExpressionReady: detectedFacialMorphs.length > 0,
    summary:
      detectedFacialMorphs.length > 0
        ? `Model has ${detectedFacialMorphs.length} compatible facial morph targets/blendshapes.`
        : bones.length > 0
        ? `Model has skeletal armature (${bones.length} bones) but NO standard facial blendshapes/morph targets.`
        : `Model is a static unrigged mesh with NO facial blendshapes or skeleton.`,
  };

  return report;
}

if (process.argv[1] && process.argv[1].endsWith('inspect-model.mjs')) {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node scripts/inspect-model.mjs <path-to-glb-or-gltf>');
    process.exit(1);
  }
  try {
    const res = inspectGLTF(target);
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Inspection failed:', err.message);
    process.exit(1);
  }
}
