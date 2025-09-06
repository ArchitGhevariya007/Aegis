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
  
  // Resize to exact ArcFace input size: 112x112 RGB
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

  // ArcFace expects NHWC format: (1, 112, 112, 3)
  // This matches the specification: (batch, height, width, channels)
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
    
    if (process.env.FACE_MATCH_DEBUG === 'true') {
      console.log(`[ArcFace] Input shape: ${input.dims}, Input name: ${inputName}`);
    }
    
    const results = await session.run({ [inputName]: input });
    const outName = session.outputNames && session.outputNames.length ? session.outputNames[0] : Object.keys(results)[0];
    const output = results[outName];
    
    if (process.env.FACE_MATCH_DEBUG === 'true') {
      console.log(`[ArcFace] Output shape: ${output.dims}, Output name: ${outName}`);
    }
    
    // Convert output to Float32Array and ensure it's 512-dimensional
    const arr = output.data instanceof Float32Array ? output.data : Float32Array.from(output.data);
    
    if (arr.length !== EMBEDDING_DIM) {
      console.warn(`[ArcFace] Warning: Expected ${EMBEDDING_DIM} dimensions, got ${arr.length}`);
    }
    
    // L2 normalize the embedding
    const normalized = l2normalize(arr);
    
    if (process.env.FACE_MATCH_DEBUG === 'true') {
      console.log(`[ArcFace] Embedding dimension: ${normalized.length}, norm: ${Math.sqrt(normalized.reduce((sum, val) => sum + val * val, 0)).toFixed(6)}`);
    }
    
    return normalized;
  } catch (error) {
    console.error('ArcFace embedding extraction error:', error);
    throw new Error('Face recognition failed: ' + error.message);
  }
}

async function compareFaces(idImage, liveImage) {
  try {
    if (process.env.FACE_MATCH_DEBUG === 'true') {
      console.log('[ArcFace] Starting face comparison...');
    }
    
    const [embedding1, embedding2] = await Promise.all([
      extractEmbedding(idImage),
      extractEmbedding(liveImage)
    ]);
    
    // Ensure both embeddings are valid
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
      throw new Error(`Invalid embeddings: ${embedding1?.length} vs ${embedding2?.length}`);
    }
    
    const similarity = cosineSimilarity(embedding1, embedding2);
    const threshold = parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.6'); // Default threshold as per your spec
    const safeSimilarity = Number.isFinite(similarity) ? similarity : -1;
    
    if (process.env.FACE_MATCH_DEBUG === 'true') {
      console.log(`[ArcFace] Embedding1 sample: [${embedding1.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
      console.log(`[ArcFace] Embedding2 sample: [${embedding2.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
      console.log(`[ArcFace] Similarity: ${safeSimilarity.toFixed(6)}, Threshold: ${threshold}, Match: ${safeSimilarity >= threshold}`);
    }
    
    return { 
      similarity: safeSimilarity, 
      is_match: safeSimilarity >= threshold,
      embedding1: embedding1.slice(0, 10), // Return first 10 dims for debugging
      embedding2: embedding2.slice(0, 10),
      threshold: threshold
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
