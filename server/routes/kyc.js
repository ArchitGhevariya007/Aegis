const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { 
  validateLivenessCheck, 
  validateFaceMatch 
} = require('../middleware/validation');
const { 
  uploadIdDocument, 
  uploadFaceImage, 
  handleUploadError 
} = require('../middleware/upload');
const ocrService = require('../services/ocrService');

const router = express.Router();

// POST /api/kyc/upload-id
router.post('/upload-id', uploadIdDocument, handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file uploaded'
      });
    }
    
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Process document with OCR service
    let ocrData;
    try {
      // Convert uploaded file to base64 for OCR processing
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(req.file.path);
      const base64Image = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
      
      // Extract text and data using OCR service
      const ocrResult = await ocrService.processDocument(base64Image, 'id_card');
      
      if (ocrResult.success && ocrResult.documentData) {
        ocrData = {
          name: ocrResult.documentData.name || '',
          dob: ocrResult.documentData.dob || null,
          documentType: 'id_card',
          address: ocrResult.documentData.address || '',
          extractedText: ocrResult.extractedText || '',
          confidence: ocrResult.documentData.confidence || 0
        };
      } else {
        // OCR failed, return empty data
        console.log('[KYC] OCR processing failed, using empty data');
        ocrData = {
          name: '',
          dob: null,
          documentType: 'id_card',
          address: '',
          extractedText: '',
          confidence: 0
        };
      }
    } catch (error) {
      console.error('OCR processing failed:', error);
      ocrData = {
        name: '',
        dob: null,
        documentType: 'id_card',
        address: '',
        extractedText: '',
        confidence: 0
      };
    }

    // Add document to user's documents array
    const documentData = {
      type: 'id_card', // You can make this configurable
      fileName: req.file.originalname,
      filePath: req.file.path,
      ocrData: ocrData
    };

    user.documents.push(documentData);
    
    // Update KYC status
    if (user.kycStatus === 'pending') {
      user.kycStatus = 'document_uploaded';
    }

    await user.save();

    res.json({
      success: true,
      userId: user._id,
      ocrData: ocrData
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Document upload failed. Please try again.'
    });
  }
});

// POST /api/kyc/liveness-check
router.post('/liveness-check', validateLivenessCheck, async (req, res) => {
  try {
    const { userId, faceImage, movement } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has uploaded documents
    if (user.kycStatus === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Please upload ID documents first'
      });
    }

    // TODO: Implement actual liveness detection here
    // For now, we'll simulate the liveness check
    // In a real implementation, you would:
    // 1. Analyze the face image for liveness indicators
    // 2. Check for movement patterns, blinking, etc.
    // 3. Use AI models to detect spoofing attempts
    
    const livenessResult = await simulateLivenessCheck(faceImage, movement);

    if (livenessResult.verified) {
      // Update user's face data
      user.faceData.liveFaceImage = faceImage;
      user.faceData.livenessVerified = true;
      
      // Update KYC status
      if (user.kycStatus === 'document_uploaded') {
        user.kycStatus = 'liveness_verified';
      }
      
      await user.save();
    }

    res.json({
      success: true,
      livenessVerified: livenessResult.verified,
      message: livenessResult.message
    });
  } catch (error) {
    console.error('Liveness check error:', error);
    res.status(500).json({
      success: false,
      message: 'Liveness check failed. Please try again.'
    });
  }
});

// POST /api/kyc/face-match
router.post('/face-match', validateFaceMatch, async (req, res) => {
  try {
    const { userId, idFaceImage, liveFaceImage } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has completed previous steps
    if (user.kycStatus !== 'liveness_verified') {
      return res.status(400).json({
        success: false,
        message: 'Please complete liveness check first'
      });
    }

    // TODO: Implement actual face matching here
    // For now, we'll simulate the face matching
    // In a real implementation, you would:
    // 1. Extract face features from both images
    // 2. Compare the features using face recognition algorithms
    // 3. Calculate similarity score
    // 4. Use a threshold to determine if faces match
    
    const faceMatchResult = await simulateFaceMatching(idFaceImage, liveFaceImage);

    if (faceMatchResult.verified) {
      // Update user's face data
      user.faceData.idFaceImage = idFaceImage;
      user.faceData.faceMatched = true;
      user.faceData.faceEncoding = 'simulated_face_encoding'; // In real implementation, store actual face encoding
      
      // Update KYC status
      user.kycStatus = 'completed';
      
      await user.save();
    }

    res.json({
      success: true,
      matchScore: faceMatchResult.matchScore,
      verified: faceMatchResult.verified
    });
  } catch (error) {
    console.error('Face matching error:', error);
    res.status(500).json({
      success: false,
      message: 'Face matching failed. Please try again.'
    });
  }
});

// GET /api/kyc/status/:userId
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('kycStatus documents faceData');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      kycStatus: user.kycStatus,
      documentsCount: user.documents.length,
      livenessVerified: user.faceData.livenessVerified,
      faceMatched: user.faceData.faceMatched
    });
  } catch (error) {
    console.error('KYC status fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch KYC status'
    });
  }
});

// Simulated OCR processing function
// Replace this with actual OCR implementation
async function simulateOCRProcessing(file) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate extracted OCR data
  const ocrData = {
    name: 'John Doe',
    dob: new Date('1999-05-20'),
    idNumber: 'XYZ12345',
    documentType: 'ID Card'
  };
  
  return ocrData;
}

// Simulated liveness check function
// Replace this with actual liveness detection implementation
async function simulateLivenessCheck(faceImage, movement) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate liveness verification (95% success rate)
  const isVerified = Math.random() > 0.05;
  
  return {
    verified: isVerified,
    message: isVerified ? 'Liveness check passed' : 'Liveness check failed - please try again'
  };
}

// Simulated face matching function
// Replace this with actual face recognition implementation
async function simulateFaceMatching(idFaceImage, liveFaceImage) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate face matching (90% success rate)
  const isVerified = Math.random() > 0.1;
  const matchScore = isVerified ? 0.85 + Math.random() * 0.15 : 0.3 + Math.random() * 0.4;
  
  return {
    verified: isVerified,
    matchScore: parseFloat(matchScore.toFixed(2))
  };
}

module.exports = router;
