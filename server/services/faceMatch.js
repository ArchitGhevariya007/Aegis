const fs = require('fs');
const path = require('path');
let ort;
try { ort = require('onnxruntime-node'); } catch (e) { try { ort = require('onnxruntime'); } catch { ort = null; } }
const sharp = require('sharp');

const ARC_W = 112;
const ARC_H = 112;
const ARC_C = 3; // RGB

function resolveFromServer(p) {
  return path.isAbsolute(p) ? p : path.resolve(__dirname, '..', p);
}

function findArcfaceModelPath() {
  const baseDir = path.resolve(__dirname, '../ai_models/onnx_model');
  if (fs.existsSync(baseDir)) {
    // Prefer arcface/arc naming if present
    const candidates = fs.readdirSync(baseDir).filter(f => f.toLowerCase().endsWith('.onnx'));
    const preferred = candidates.find(f => f.toLowerCase().includes('arc')) || candidates[0];
    if (preferred) return path.join(baseDir, preferred);
  }
  // Fallback single model path
  return path.resolve(__dirname, '../ai_models/model.onnx');
}

const ENV_MODEL = process.env.FACE_MODEL_PATH ? resolveFromServer(process.env.FACE_MODEL_PATH) : null;
const MODEL_PATH = ENV_MODEL || findArcfaceModelPath();

let sessionPromise = null;
async function ensureSession() {
  if (!ort) throw new Error('onnxruntime is not installed');
  if (sessionPromise) return sessionPromise;
  if (!fs.existsSync(MODEL_PATH)) throw new Error(`Model not found at ${MODEL_PATH}`);
  sessionPromise = ort.InferenceSession.create(MODEL_PATH, { executionProviders: ['cpu'] });
  return sessionPromise;
}

const COLOR_ORDER = (process.env.FACE_COLOR_ORDER || 'RGB').toUpperCase(); // 'RGB' or 'BGR'
const INPUT_LAYOUT = (process.env.FACE_INPUT_LAYOUT || '').toUpperCase(); // '', 'NHWC', or 'NCHW'

async function preprocessToTensor(session, base64, layoutOverride, colorOrderOverride) {
  const buf = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
  const rgb = await sharp(buf)
    .resize(ARC_W, ARC_H, { kernel: sharp.kernel.cubic })
    .removeAlpha()
    .raw()
    .toBuffer(); // RGBRGB...

  // ArcFace normalization: (img - 127.5) / 128.0
  const norm = new Float32Array(ARC_W * ARC_H * ARC_C);
  for (let i = 0; i < rgb.length; i++) {
    norm[i] = (rgb[i] - 127.5) / 128.0;
  }

  // Determine model input layout by inspecting first input dims (unless overridden)
  const inputName = session.inputNames && session.inputNames.length ? session.inputNames[0] : 'input';
  const meta = session.inputMetadata && session.inputMetadata[inputName];
  const dims = meta && Array.isArray(meta.dimensions) ? meta.dimensions : null;
  const inferredNCHW = dims && dims.length === 4 && (dims[1] === 3 || dims[1] === '3');
  const effectiveLayout = layoutOverride || (INPUT_LAYOUT === 'NCHW' ? 'NCHW' : INPUT_LAYOUT === 'NHWC' ? 'NHWC' : (inferredNCHW ? 'NCHW' : 'NHWC'));
  const isNCHW = effectiveLayout === 'NCHW';

  if (isNCHW) {
    // Convert NHWC (H,W,C) norm to NCHW (C,H,W)
    const chw = new Float32Array(ARC_C * ARC_H * ARC_W);
    let idx = 0;
    for (let h = 0; h < ARC_H; h++) {
      for (let w = 0; w < ARC_W; w++) {
        const nhwcIdx = (h * ARC_W + w) * ARC_C;
        // Color order mapping
        const r = norm[nhwcIdx + 0];
        const g = norm[nhwcIdx + 1];
        const b = norm[nhwcIdx + 2];
        const colorOrder = (colorOrderOverride || COLOR_ORDER);
        const c0 = colorOrder === 'BGR' ? b : r;
        const c1 = g;
        const c2 = colorOrder === 'BGR' ? r : b;
        chw[0 * ARC_H * ARC_W + h * ARC_W + w] = c0;
        chw[1 * ARC_H * ARC_W + h * ARC_W + w] = c1;
        chw[2 * ARC_H * ARC_W + h * ARC_W + w] = c2;
        idx++;
      }
    }
    return new ort.Tensor('float32', chw, [1, ARC_C, ARC_H, ARC_W]);
  }

  // Default to NHWC, apply color order by rearranging channels per pixel
  const nhwc = new Float32Array(ARC_H * ARC_W * ARC_C);
  for (let h = 0; h < ARC_H; h++) {
    for (let w = 0; w < ARC_W; w++) {
      const idxHW = (h * ARC_W + w) * ARC_C;
      const r = norm[idxHW + 0];
      const g = norm[idxHW + 1];
      const b = norm[idxHW + 2];
      const colorOrder = (colorOrderOverride || COLOR_ORDER);
      nhwc[idxHW + 0] = colorOrder === 'BGR' ? b : r;
      nhwc[idxHW + 1] = g;
      nhwc[idxHW + 2] = colorOrder === 'BGR' ? r : b;
    }
  }
  return new ort.Tensor('float32', nhwc, [1, ARC_H, ARC_W, ARC_C]);
}

function l2normalize(vec) {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1e-6;
  const out = new Float32Array(vec.length);
  for (let i = 0; i < vec.length; i++) out[i] = vec[i] / norm;
  return out;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // unit vectors
}

async function embed(base64) {
  const session = await ensureSession();
  const inputName = session.inputNames && session.inputNames.length ? session.inputNames[0] : 'input';
  try {
    const input = await preprocessToTensor(session, base64);
    const results = await session.run({ [inputName]: input });
    const outName = session.outputNames && session.outputNames.length ? session.outputNames[0] : Object.keys(results)[0];
    const output = results[outName];
    const arr = output.data instanceof Float32Array ? output.data : Float32Array.from(output.data);
    return l2normalize(arr);
  } catch (err) {
    const msg = String(err && err.message || err);
    const dimErr = msg.includes('Got invalid dimensions') || msg.includes('invalid shape') || msg.includes('invalid dimensions');
    if (dimErr) {
      // Retry with swapped layout
      const currentLayout = (INPUT_LAYOUT || '').toUpperCase();
      const tryLayout = currentLayout === 'NCHW' ? 'NHWC' : 'NCHW';
      if (process.env.FACE_MATCH_DEBUG === 'true') {
        console.warn('[faceMatch] Dimension error, retrying with layout', tryLayout);
      }
      const input2 = await preprocessToTensor(session, base64, tryLayout);
      const results2 = await session.run({ [inputName]: input2 });
      const outName2 = session.outputNames && session.outputNames.length ? session.outputNames[0] : Object.keys(results2)[0];
      const output2 = results2[outName2];
      const arr2 = output2.data instanceof Float32Array ? output2.data : Float32Array.from(output2.data);
      return l2normalize(arr2);
    }
    throw err;
  }
}

async function compareFaces(idImage, liveImage) {
  const [e1, e2] = await Promise.all([embed(idImage), embed(liveImage)]);
  const similarity = cosineSimilarity(e1, e2);
  const threshold = parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.9');
  const safeSimilarity = Number.isFinite(similarity) ? similarity : -1;
  if (process.env.FACE_MATCH_DEBUG === 'true') {
    console.log('[faceMatch] e1.len', e1.length, 'e2.len', e2.length, 'similarity', safeSimilarity.toFixed(6), 'threshold', threshold);
  }
  return { similarity: safeSimilarity, is_match: safeSimilarity >= threshold };
}

module.exports = { compareFaces, ensureSession, MODEL_PATH };
