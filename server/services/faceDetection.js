const fs = require('fs');
const path = require('path');
let ort;
try { ort = require('onnxruntime-node'); } catch (e) { try { ort = require('onnxruntime'); } catch { ort = null; } }
const sharp = require('sharp');

// SCRFD model configuration
const SCRFD_INPUT_SIZE = 640; // Standard input size for SCRFD
const SCRFD_CONFIDENCE_THRESHOLD = 0.02; // Lower threshold for debugging
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
  
  let processedBuffer;
  try {
    // Try PNG conversion first to handle problematic JPEGs
    processedBuffer = await sharp(buf)
      .png({ quality: 90 })
      .toBuffer();
  } catch (error) {
    console.log('[FACE] PNG conversion failed, using original buffer');
    processedBuffer = buf;
  }
  
  const rgb = await sharp(processedBuffer, { failOnError: false })
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

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function parseSCRFDOutputs(results, inputSize) {
  const faces = [];
  
  try {
    const outputKeys = Object.keys(results);
    
    // Debug logging removed for cleaner console output
    
    // Based on the output, we have 3 scales with different strides
    // Scale 1: 12800 anchors (stride 8) - outputs 448 (cls), 451 (bbox), 454 (kps)
    // Scale 2: 3200 anchors (stride 16) - outputs 471 (cls), 474 (bbox), 477 (kps) 
    // Scale 3: 800 anchors (stride 32) - outputs 494 (cls), 497 (bbox), 500 (kps)
    
    const scales = [
      { stride: 8, clsKey: '448', bboxKey: '451', kpsKey: '454' },
      { stride: 16, clsKey: '471', bboxKey: '474', kpsKey: '477' },
      { stride: 32, clsKey: '494', bboxKey: '497', kpsKey: '500' }
    ];
    
    for (const scale of scales) {
      const { stride, clsKey, bboxKey } = scale;
      
      if (!results[clsKey] || !results[bboxKey]) {
        // Missing outputs for stride - silently skip
        continue;
      }
      
      const clsData = results[clsKey].data;
      const bboxData = results[bboxKey].data;
      const numAnchors = clsData.length;
      
      // Processing stride data - debug logging removed
      
      const gridSize = inputSize / stride;
      const anchorsPerCell = 2; // Standard SCRFD has 2 anchors per grid cell
      
      // Process each anchor
      let maxConf = 0;
      let minConf = 1;
      let validCount = 0;
      
      for (let i = 0; i < numAnchors; i++) {
        const rawConf = clsData[i];
        const confidence = sigmoid(rawConf); // Apply sigmoid activation
        maxConf = Math.max(maxConf, confidence);
        minConf = Math.min(minConf, confidence);
        
        if (confidence < SCRFD_CONFIDENCE_THRESHOLD) continue;
        validCount++;
        
        // Calculate grid position from anchor index
        const anchorInCell = i % anchorsPerCell;
        const cellIdx = Math.floor(i / anchorsPerCell);
        const gridX = cellIdx % gridSize;
        const gridY = Math.floor(cellIdx / gridSize);
        
        // Get bounding box deltas
        const bboxIdx = i * 4;
        const dx = bboxData[bboxIdx];
        const dy = bboxData[bboxIdx + 1];
        const dw = bboxData[bboxIdx + 2];
        const dh = bboxData[bboxIdx + 3];
        
        // Convert to absolute coordinates
        // SCRFD uses distance-based encoding
        const centerX = (gridX + 0.5) * stride;
        const centerY = (gridY + 0.5) * stride;
        
        // Apply deltas (SCRFD distance encoding)
        // Don't expand at detection - just use the raw SCRFD detection
        // We'll do ALL expansion during cropping to avoid boundary issues
        const x1 = centerX - dx * stride;
        const y1 = centerY - dy * stride;
        const x2 = centerX + dw * stride;
        const y2 = centerY + dh * stride;
        
        // Ensure coordinates are within bounds
        const boundedX1 = Math.max(0, Math.min(inputSize, x1));
        const boundedY1 = Math.max(0, Math.min(inputSize, y1));
        const boundedX2 = Math.max(0, Math.min(inputSize, x2));
        const boundedY2 = Math.max(0, Math.min(inputSize, y2));
        
        const width = boundedX2 - boundedX1;
        const height = boundedY2 - boundedY1;
        
        // Filter out invalid boxes
        if (width > 10 && height > 10 && width < inputSize && height < inputSize) {
          faces.push({
            x: boundedX1,
            y: boundedY1,
            width: width,
            height: height,
            confidence: confidence
          });
          
          if (process.env.FACE_MATCH_DEBUG === 'true' && faces.length <= 5) {
            // console.log(`[SCRFD] Detected face ${faces.length}: x=${boundedX1.toFixed(1)}, y=${boundedY1.toFixed(1)}, w=${width.toFixed(1)}, h=${height.toFixed(1)}, conf=${confidence.toFixed(4)}`);
          }
        }
      }
      
      // Stride processing complete - debug logging removed
    }
    
    // Face detection complete - debug logging removed
    
    // Apply Non-Maximum Suppression
    if (faces.length > 0) {
      const boxes = faces.map(f => [f.x, f.y, f.x + f.width, f.y + f.height]);
      const scores = faces.map(f => f.confidence);
      const keepIndices = nms(boxes, scores, SCRFD_NMS_THRESHOLD);
      const filteredFaces = keepIndices.map(box => {
        const idx = boxes.findIndex(b => b[0] === box[0] && b[1] === box[1]);
        return faces[idx];
      });
      
      const finalFaces = filteredFaces.sort((a, b) => b.confidence - a.confidence);
      
      // NMS complete - debug logging removed
      
      return finalFaces;
    }
    
    return faces;
  } catch (error) {
    console.error('[SCRFD] Error parsing outputs:', error);
    // Fallback: return center region as detected face
    return [{
      x: Math.floor(inputSize * 0.2),
      y: Math.floor(inputSize * 0.2),
      width: Math.floor(inputSize * 0.6),
      height: Math.floor(inputSize * 0.6),
      confidence: 0.5
    }];
  }
}

async function detectFaces(base64) {
  try {
    const session = await ensureSession();
    const input = await preprocessImage(base64);
    const inputName = session.inputNames && session.inputNames.length ? session.inputNames[0] : 'input';
    
    // Debug logging removed for cleaner console output
    
    const results = await session.run({ [inputName]: input });
    
    // Debug logging removed for cleaner console output
    
    // Parse SCRFD outputs
    const faces = parseSCRFDOutputs(results, SCRFD_INPUT_SIZE);
    
    return {
      faces,
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
  
  // Scale face box from SCRFD's 640x640 space to original image dimensions
  const detectedX = faceBox.x * scaleX;
  const detectedY = faceBox.y * scaleY;
  const detectedW = faceBox.width * scaleX;
  const detectedH = faceBox.height * scaleY;
  
  // Calculate face center
  const faceCenterX = detectedX + detectedW / 2;
  const faceCenterY = detectedY + detectedH / 2;
  
  console.log(`[CROP DEBUG] Image dims: ${imgWidth}x${imgHeight} | Detected face: x=${detectedX.toFixed(1)}, y=${detectedY.toFixed(1)}, w=${detectedW.toFixed(1)}, h=${detectedH.toFixed(1)}`);
  console.log(`[CROP DEBUG] Face center: (${faceCenterX.toFixed(1)}, ${faceCenterY.toFixed(1)})`);
  
  // Strategy: Don't force a square that might crop the face
  // Instead: Take the detected face box itself and just add generous padding
  // This guarantees NO cropping of the actual face
  const padding = 0.4; // 40% padding around each side of the detected box
  const paddedW = detectedW * (1 + 2 * padding);
  const paddedH = detectedH * (1 + 2 * padding);
  
  console.log(`[CROP DEBUG] Detected: ${detectedW.toFixed(1)}x${detectedH.toFixed(1)} | Padded (40%): ${paddedW.toFixed(1)}x${paddedH.toFixed(1)}`);
  
  // Make it square using the larger padded dimension
  const squareSize = Math.max(paddedW, paddedH);
  
  console.log(`[CROP DEBUG] Square size needed: ${squareSize.toFixed(1)}`);
  
  // IMPORTANT: Never crop the detected face
  // Position the square so the detected face box is fully inside it
  let cropX = detectedX - detectedW * padding;  // Add padding to left
  let cropY = detectedY - detectedH * padding;  // Add padding to top
  
  console.log(`[CROP DEBUG] Initial position: (${cropX.toFixed(1)}, ${cropY.toFixed(1)}), size: ${squareSize.toFixed(1)}`);
  
  // Ensure we don't go negative
  if (cropX < 0) cropX = 0;
  if (cropY < 0) cropY = 0;
  
  // Ensure we don't exceed image bounds - reduce size if needed, don't shift position
  // This keeps the face in the crop, even if we can't get the full desired square
  let finalSize = squareSize;
  if (cropX + finalSize > imgWidth) {
    finalSize = imgWidth - cropX;
  }
  if (cropY + finalSize > imgHeight) {
    finalSize = Math.min(finalSize, imgHeight - cropY);
  }
  
  // Final safety: ensure detected face is still inside the crop
  // If it's not (shouldn't happen with above logic), shift the crop to include it
  const detectedRight = detectedX + detectedW;
  const detectedBottom = detectedY + detectedH;
  
  let finalX = Math.floor(cropX);
  let finalY = Math.floor(cropY);
  let finalWidth = Math.floor(finalSize);
  let finalHeight = Math.floor(finalSize);
  
  // Verify detected face is inside
  if (finalX + finalWidth < detectedRight) {
    finalX = Math.floor(detectedRight - finalWidth);
  }
  if (finalY + finalHeight < detectedBottom) {
    finalY = Math.floor(detectedBottom - finalHeight);
  }
  
  // Clamp to non-negative
  finalX = Math.max(0, finalX);
  finalY = Math.max(0, finalY);
  
  console.log(`[CROP] RESULT - Image:${imgWidth}x${imgHeight} | Detected:${Math.floor(detectedW)}x${Math.floor(detectedH)} at (${Math.floor(detectedX)},${Math.floor(detectedY)}) | Final Crop:${finalWidth}x${finalHeight} at (${finalX},${finalY})`);
  
  // Face cropping debug logs removed for cleaner console output
  
  // Crop to square and resize to exact target size (112x112 for ArcFace)
  let processedBuffer;
  try {
    // Try PNG conversion first to handle problematic JPEGs
    processedBuffer = await sharp(buf)
      .png({ quality: 90 })
      .toBuffer();
  } catch (error) {
    console.log('[FACE] Face crop PNG conversion failed, using original buffer');
    processedBuffer = buf;
  }

  const cropped = await sharp(processedBuffer, { failOnError: false })
    .extract({ left: finalX, top: finalY, width: finalWidth, height: finalHeight })
    .resize(targetSize, targetSize, { 
      kernel: sharp.kernel.lanczos3,  // High-quality downsampling
      fit: 'fill'  // Already square, just resize without cropping
    })
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
