const faceDetection = require('./faceDetection');
const faceRecognition = require('./faceRecognition');

/**
 * Complete face processing pipeline:
 * 1. Detect faces using SCRFD
 * 2. Crop and align faces
 * 3. Extract embeddings using ArcFace
 * 4. Compare embeddings
 */

async function processImageForFaces(base64) {
  try {
    // Step 1: Detect faces
    const detectionResult = await faceDetection.detectFaces(base64);
    
    if (detectionResult.faces.length === 0) {
      throw new Error('No faces detected in image');
    }
    
    // Step 2: Crop the first (largest) face
    const primaryFace = detectionResult.faces[0];
    const croppedFace = await faceDetection.cropFaceFromImage(base64, primaryFace, 112);
    
    // Step 3: Extract embedding
    const embedding = await faceRecognition.extractEmbedding(croppedFace);
    
    return {
      success: true,
      faces: detectionResult.faces,
      croppedFace,
      embedding: embedding.slice(0, 10), // First 10 dims for debugging
      embeddingLength: embedding.length
    };
  } catch (error) {
    console.error('Face processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function compareFaceImages(idImage, liveImage) {
  try {
    // Process both images
    const idResult = await processImageForFaces(idImage);
    const liveResult = await processImageForFaces(liveImage);
    
    if (!idResult.success) {
      throw new Error('Failed to process ID image: ' + idResult.error);
    }
    
    if (!liveResult.success) {
      throw new Error('Failed to process live image: ' + liveResult.error);
    }
    
    // Compare embeddings
    const comparison = await faceRecognition.compareFaces(idImage, liveImage);
    
    return {
      success: true,
      similarity: comparison.similarity,
      is_match: comparison.is_match,
      idFaces: idResult.faces.length,
      liveFaces: liveResult.faces.length,
      idCroppedFace: idResult.croppedFace,
      liveCroppedFace: liveResult.croppedFace,
      debug: {
        idEmbedding: idResult.embedding,
        liveEmbedding: liveResult.embedding,
        embeddingLength: idResult.embeddingLength
      }
    };
  } catch (error) {
    console.error('Face comparison pipeline error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function detectAndCropFaces(base64) {
  try {
    const result = await processImageForFaces(base64);
    return result;
  } catch (error) {
    console.error('Face detection and cropping error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  processImageForFaces,
  compareFaceImages,
  detectAndCropFaces
};
