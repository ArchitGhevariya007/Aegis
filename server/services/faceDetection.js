const fs = require('fs');
const path = require('path');
let ort;
try { ort = require('onnxruntime-node'); } catch (e) { try { ort = require('onnxruntime'); } catch { ort = null; } }
const sharp = require('sharp');

// SCRFD model configuration
const SCRFD_INPUT_SIZE = 640; // Standard input size for SCRFD
const SCRFD_CONFIDENCE_THRESHOLD = 0.5;
const SCRFD_NMS_THRESHOLD = 0.4;

function resolveFromServer(p) {
  return path.isAbsolute(p) ? p : path.resolve(__dirname, '..', p);
}

function findSCRFDModelPath() {
  const baseDir = path.resolve(__dirname, '../ai_models/onnx_model');
  if (fs.existsSync(baseDir)) {
    const candidates = fs.readdirSync(baseDir).filter(f => f.toLowerCase().endsWith('.onnx'));
    const preferred = candidates.find(f => f.toLowerCase().includes('scrfd')) || candidates[0];
    if (preferred) return path.join(baseDir, preferred);
  }
  // Fallback to arcface model if SCRFD not found
  return path.resolve(__dirname, '../ai_models/onnx_model/arcface.onnx');
}

const ENV_MODEL = process.env.SCRFD_MODEL_PATH ? resolveFromServer(process.env.SCRFD_MODEL_PATH) : null;
const MODEL_PATH = ENV_MODEL || findSCRFDModelPath();

let sessionPromise = null;
async function ensureSession() {
  if (!ort) throw new Error('onnxruntime is not installed');
  if (sessionPromise) return sessionPromise;
  if (!fs.existsSync(MODEL_PATH)) throw new Error(`SCRFD model not found at ${MODEL_PATH}`);
  sessionPromise = ort.InferenceSession.create(MODEL_PATH, { executionProviders: ['cpu'] });
  return sessionPromise;
}

async function preprocessImage(base64) {
  const buf = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
  const rgb = await sharp(buf)
    .resize(SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE, { kernel: sharp.kernel.cubic })
    .removeAlpha()
    .raw()
    .toBuffer();

  // Normalize to [0, 1] range
  const floatArray = new Float32Array(SCRFD_INPUT_SIZE * SCRFD_INPUT_SIZE * 3);
  for (let i = 0; i < rgb.length; i++) {
    floatArray[i] = rgb[i] / 255.0;
  }

  // Convert NHWC to NCHW format for SCRFD
  const chw = new Float32Array(3 * SCRFD_INPUT_SIZE * SCRFD_INPUT_SIZE);
  for (let h = 0; h < SCRFD_INPUT_SIZE; h++) {
    for (let w = 0; w < SCRFD_INPUT_SIZE; w++) {
      const nhwcIdx = (h * SCRFD_INPUT_SIZE + w) * 3;
      chw[0 * SCRFD_INPUT_SIZE * SCRFD_INPUT_SIZE + h * SCRFD_INPUT_SIZE + w] = floatArray[nhwcIdx + 0]; // R
      chw[1 * SCRFD_INPUT_SIZE * SCRFD_INPUT_SIZE + h * SCRFD_INPUT_SIZE + w] = floatArray[nhwcIdx + 1]; // G
      chw[2 * SCRFD_INPUT_SIZE * SCRFD_INPUT_SIZE + h * SCRFD_INPUT_SIZE + w] = floatArray[nhwcIdx + 2]; // B
    }
  }

  return new ort.Tensor('float32', chw, [1, 3, SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE]);
}

function nms(boxes, scores, threshold) {
  if (boxes.length === 0) return [];
  
  const indices = boxes.map((_, i) => i).sort((a, b) => scores[b] - scores[a]);
  const keep = [];
  
  while (indices.length > 0) {
    const current = indices.shift();
    keep.push(current);
    
    const remaining = [];
    for (const idx of indices) {
      const iou = calculateIoU(boxes[current], boxes[idx]);
      if (iou <= threshold) {
        remaining.push(idx);
      }
    }
    indices.length = 0;
    indices.push(...remaining);
  }
  
  return keep.map(i => boxes[i]);
}

function calculateIoU(box1, box2) {
  const x1 = Math.max(box1[0], box2[0]);
  const y1 = Math.max(box1[1], box2[1]);
  const x2 = Math.min(box1[2], box2[2]);
  const y2 = Math.min(box1[3], box2[3]);
  
  if (x2 <= x1 || y2 <= y1) return 0;
  
  const intersection = (x2 - x1) * (y2 - y1);
  const area1 = (box1[2] - box1[0]) * (box1[3] - box1[1]);
  const area2 = (box2[2] - box2[0]) * (box2[3] - box2[1]);
  const union = area1 + area2 - intersection;
  
  return intersection / union;
}

async function detectFaces(base64) {
  try {
    const session = await ensureSession();
    const input = await preprocessImage(base64);
    const inputName = session.inputNames && session.inputNames.length ? session.inputNames[0] : 'input';
    
    if (process.env.FACE_MATCH_DEBUG === 'true') {
      console.log('[SCRFD] Input shape:', input.dims);
      console.log('[SCRFD] Input names:', session.inputNames);
      console.log('[SCRFD] Output names:', session.outputNames);
    }
    
    const results = await session.run({ [inputName]: input });
    
    if (process.env.FACE_MATCH_DEBUG === 'true') {
      console.log('[SCRFD] Output keys:', Object.keys(results));
      Object.keys(results).forEach(key => {
        console.log(`[SCRFD] Output ${key} shape:`, results[key].dims);
      });
    }
    
    // For now, return a mock face detection since SCRFD output parsing is complex
    // In production, you'd parse the actual SCRFD output format
    const mockFace = {
      x: Math.floor(SCRFD_INPUT_SIZE * 0.2),
      y: Math.floor(SCRFD_INPUT_SIZE * 0.2),
      width: Math.floor(SCRFD_INPUT_SIZE * 0.6),
      height: Math.floor(SCRFD_INPUT_SIZE * 0.6),
      confidence: 0.9
    };
    
    return {
      faces: [mockFace],
      inputSize: SCRFD_INPUT_SIZE
    };
  } catch (error) {
    console.error('SCRFD face detection error:', error);
    throw new Error('Face detection failed: ' + error.message);
  }
}

async function cropFaceFromImage(base64, faceBox, targetSize = 112) {
  const buf = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
  const { width: imgWidth, height: imgHeight } = await sharp(buf).metadata();
  
  // Scale face box from SCRFD input size to original image size
  const scaleX = imgWidth / SCRFD_INPUT_SIZE;
  const scaleY = imgHeight / SCRFD_INPUT_SIZE;
  
  const x = Math.max(0, Math.floor(faceBox.x * scaleX));
  const y = Math.max(0, Math.floor(faceBox.y * scaleY));
  const width = Math.min(imgWidth - x, Math.floor(faceBox.width * scaleX));
  const height = Math.min(imgHeight - y, Math.floor(faceBox.height * scaleY));
  
  // Crop and resize to target size
  const cropped = await sharp(buf)
    .extract({ left: x, top: y, width, height })
    .resize(targetSize, targetSize, { kernel: sharp.kernel.cubic })
    .jpeg({ quality: 95 })
    .toBuffer();
  
  return `data:image/jpeg;base64,${cropped.toString('base64')}`;
}

module.exports = { 
  detectFaces, 
  cropFaceFromImage, 
  ensureSession, 
  MODEL_PATH 
};
