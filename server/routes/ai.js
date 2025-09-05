const express = require('express');
const router = express.Router();
const facePipeline = require('../services/facePipeline');

// POST /api/ai/face-match
router.post('/face-match', async (req, res) => {
  try {
    const { idImage, liveImage } = req.body || {};
    if (!idImage || !liveImage) {
      return res.status(400).json({ 
        success: false, 
        message: 'idImage and liveImage are required' 
      });
    }

    const result = await facePipeline.compareFaceImages(idImage, liveImage);
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        message: result.error || 'Face comparison failed' 
      });
    }

    return res.json({ 
      success: true, 
      similarity: result.similarity,
      is_match: result.is_match,
      idFaces: result.idFaces,
      liveFaces: result.liveFaces,
      source: 'scrfd-arcface-pipeline'
    });
  } catch (err) {
    console.error('Face match error:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message || 'Face match failed' 
    });
  }
});

// POST /api/ai/detect-faces
router.post('/detect-faces', async (req, res) => {
  try {
    const { image } = req.body || {};
    if (!image) {
      return res.status(400).json({ 
        success: false, 
        message: 'image is required' 
      });
    }

    const result = await facePipeline.detectAndCropFaces(image);
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        message: result.error || 'Face detection failed' 
      });
    }

    return res.json({ 
      success: true, 
      faces: result.faces,
      croppedFace: result.croppedFace,
      embeddingLength: result.embeddingLength
    });
  } catch (err) {
    console.error('Face detection error:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message || 'Face detection failed' 
    });
  }
});

module.exports = router;
