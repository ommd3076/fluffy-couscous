import path from 'path';
import { exportModels, buildNickWildeModel, buildJudyHoppsModel } from './build-rich-models.mjs';

export { buildNickWildeModel, buildJudyHoppsModel };

/**
 * Builds candidate GLB character head models for Nick Wilde and Judy Hopps
 * with full facial anatomy (skull, cheeks, snout, nose, teeth, ears, eyes, pupils, eyelids, collar)
 * and MediaPipe-compatible morph targets: jawOpen, eyeBlinkLeft, eyeBlinkRight, browInnerUp.
 */
export async function generateCandidateGLBModels() {
  await exportModels();
}

if (process.argv[1] && process.argv[1].endsWith('create-test-glb.mjs')) {
  generateCandidateGLBModels()
    .then(() => {
      console.log('Candidate character GLB models generated successfully.');
    })
    .catch((err) => {
      console.error('Model generation failed:', err);
      process.exit(1);
    });
}
