const fs = require('fs');
const path = require('path');
let ort;
try { ort = require('onnxruntime-node'); } catch (e) { try { ort = require('onnxruntime'); } catch { ort = null; } }
const sharp = require('sharp');

// ArcFace model configuration
const ARC_W = 112;
const ARC_H = 112;
const ARC_C = 3; // RGB
const EMBEDDING_DIM = 512; // Expected embedding dimension

function resolveFromServer(p) {
  return path.isAbsolute(p) ? p : path.resolve(__dirname, '..', p);
}

function findArcFaceModelPath() {
  const baseDir = path.resolve(__dirname, '../ai_models/onnx_model');
  if (fs.existsSync(baseDir)) {
    const candidates = fs.readdirSync(baseDir).filter(f => f.toLowerCase().endsWith('.onnx'));
    const preferred = candidates.find(f => f.toLowerCase().includes('arcface') || f.toLowerCase().includes('arc')) || candidates[0];
    if (preferred) return path.join(baseDir, preferred);
  }
  return path.resolve(__dirname, '../ai_models/onnx_model/arcface.onnx');
}

const ENV_MODEL = process.env.ARCFACE_MODEL_PATH ? resolveFromServer(process.env.ARCFACE_MODEL_PATH) : null;
const MODEL_PATH = ENV_MODEL || findArcFaceModelPath();

let sessionPromise = null;
async function ensureSession() {
  if (!ort) throw new Error('onnxruntime is not installed');
  if (sessionPromise) return sessionPromise;
  if (!fs.existsSync(MODEL_PATH)) throw new Error(`ArcFace model not found at ${MODEL_PATH}`);
  sessionPromise = ort.InferenceSession.create(MODEL_PATH, { executionProviders: ['cpu'] });
  return sessionPromise;
}

async function preprocessToTensor(session, base64) {
  const buf = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
  const rgb = await sharp(buf)
    .resize(ARC_W, ARC_H, { kernel: sharp.kernel.cubic })
    .removeAlpha()
    .raw()
    .toBuffer();

  // ArcFace normalization: (img - 127.5) / 128.0
  const floatArray = new Float32Array(ARC_W * ARC_H * ARC_C);
  for (let i = 0; i < rgb.length; i++) {
    floatArray[i] = (rgb[i] - 127.5) / 128.0;
  }

  // Determine model input layout by inspecting first input dims
  const inputName = session.inputNames && session.inputNames.length ? session.inputNames[0] : 'input';
  const meta = session.inputMetadata && session.inputMetadata[inputName];
  const dims = meta && Array.isArray(meta.dimensions) ? meta.dimensions : null;
  const inferredNCHW = dims && dims.length === 4 && (dims[1] === 3 || dims[1] === '3');
  
  // Default to NHWC unless model expects NCHW
  const isNCHW = process.env.FACE_INPUT_LAYOUT === 'NCHW' || inferredNCHW;

  if (isNCHW) {
    // Convert NHWC to NCHW
    const chw = new Float32Array(ARC_C * ARC_H * ARC_W);
    for (let h = 0; h < ARC_H; h++) {
      for (let w = 0; w < ARC_W; w++) {
        const nhwcIdx = (h * ARC_W + w) * ARC_C;
        chw[0 * ARC_H * ARC_W + h * ARC_W + w] = floatArray[nhwcIdx + 0]; // R
        chw[1 * ARC_H * ARC_W + h * ARC_W + w] = floatArray[nhwcIdx + 1]; // G
        chw[2 * ARC_H * ARC_W + h * ARC_W + w] = floatArray[nhwcIdx + 2]; // B
      }
    }
    return new ort.Tensor('float32', chw, [1, ARC_C, ARC_H, ARC_W]);
  }

  // Default NHWC
  return new ort.Tensor('float32', floatArray, [1, ARC_H, ARC_W, ARC_C]);
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
  if (a.length !== b.length) return -1;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // Both vectors are L2 normalized
}

async function extractEmbedding(base64) {
  try {
    const session = await ensureSession();
    const input = await preprocessToTensor(session, base64);
    const inputName = session.inputNames && session.inputNames.length ? session.inputNames[0] : 'input';
    
    const results = await session.run({ [inputName]: input });
    const outName = session.outputNames && session.outputNames.length ? session.outputNames[0] : Object.keys(results)[0];
    const output = results[outName];
    
    const arr = output.data instanceof Float32Array ? output.data : Float32Array.from(output.data);
    const normalized = l2normalize(arr);
    
    if (process.env.FACE_MATCH_DEBUG === 'true') {
      console.log(`[ArcFace] Embedding dimension: ${normalized.length}, expected: ${EMBEDDING_DIM}`);
    }
    
    return normalized;
  } catch (error) {
    console.error('ArcFace embedding extraction error:', error);
    throw new Error('Face recognition failed: ' + error.message);
  }
}

async function compareFaces(idImage, liveImage) {
  try {
    const [embedding1, embedding2] = await Promise.all([
      extractEmbedding(idImage),
      extractEmbedding(liveImage)
    ]);
    
    const similarity = cosineSimilarity(embedding1, embedding2);
    const threshold = parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.6');
    const safeSimilarity = Number.isFinite(similarity) ? similarity : -1;
    
    if (process.env.FACE_MATCH_DEBUG === 'true') {
      console.log(`[ArcFace] Similarity: ${safeSimilarity.toFixed(4)}, Threshold: ${threshold}, Match: ${safeSimilarity >= threshold}`);
    }
    
    return { 
      similarity: safeSimilarity, 
      is_match: safeSimilarity >= threshold,
      embedding1: embedding1.slice(0, 10), // Return first 10 dims for debugging
      embedding2: embedding2.slice(0, 10)
    };
  } catch (error) {
    console.error('Face comparison error:', error);
    throw error;
  }
}

module.exports = { 
  extractEmbedding, 
  compareFaces, 
  ensureSession, 
  MODEL_PATH 
};
