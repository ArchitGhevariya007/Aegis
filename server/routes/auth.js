const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { 
  validateRegistration, 
  validateLogin, 
  validateFaceVerification 
} = require('../middleware/validation');
const facePipeline = require('../services/facePipeline');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { email, password, birthDate, residency, idFaceImage, liveFaceImage } = req.body;

    console.log('Registration request received:', {
      email,
      hasIdFaceImage: !!idFaceImage,
      hasLiveFaceImage: !!liveFaceImage,
      idFaceImageLength: idFaceImage?.length || 0,
      liveFaceImageLength: liveFaceImage?.length || 0
    });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Verify faces using new pipeline
    if (!idFaceImage || !liveFaceImage) {
      console.log('Missing face images:', { idFaceImage: !!idFaceImage, liveFaceImage: !!liveFaceImage });
      return res.status(400).json({
        success: false,
        message: 'Both ID face image and live face image are required'
      });
    }

    const faceComparison = await facePipeline.compareFaceImages(idFaceImage, liveFaceImage);
    
    if (!faceComparison.success) {
      return res.status(400).json({
        success: false,
        message: 'Face verification failed: ' + faceComparison.error
      });
    }

    if (!faceComparison.is_match) {
      return res.status(400).json({
        success: false,
        message: `Face did not match document photo. Similarity: ${(faceComparison.similarity * 100).toFixed(1)}%`,
        similarity: faceComparison.similarity
      });
    }

    // Create new user with verified face data
    const user = new User({
      email,
      password,
      birthDate: new Date(birthDate),
      residency,
      kycStatus: 'completed',
      isActive: true,
      faceData: {
        idFaceImage: faceComparison.idCroppedFace,
        liveFaceImage: faceComparison.liveCroppedFace,
        livenessVerified: true,
        faceMatched: true
      }
    });

    await user.save();

    res.status(201).json({
      success: true,
      userId: user._id,
      message: 'User registered successfully',
      faceMatch: {
        similarity: faceComparison.similarity,
        verified: true
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      userId: user._id,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// POST /api/auth/face-verify
router.post('/face-verify', validateFaceVerification, async (req, res) => {
  try {
    const { userId, faceImage } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has completed face matching
    if (!user.faceData.faceMatched) {
      return res.status(400).json({
        success: false,
        message: 'Face matching not completed. Please complete KYC first.'
      });
    }

    // TODO: Implement actual face recognition logic here
    // For now, we'll simulate the verification
    // In a real implementation, you would:
    // 1. Extract face features from the uploaded image
    // 2. Compare with stored face encoding
    // 3. Return match score and verification result
    
    // Simulated face verification
    const verificationResult = await simulateFaceVerification(faceImage, user.faceData.faceEncoding);

    res.json({
      success: true,
      verified: verificationResult.verified,
      matchScore: verificationResult.matchScore
    });
  } catch (error) {
    console.error('Face verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Face verification failed. Please try again.'
    });
  }
});

// Simulated face verification function
// Replace this with actual face recognition implementation
async function simulateFaceVerification(faceImage, storedEncoding) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate verification result (90% success rate)
  const isVerified = Math.random() > 0.1;
  const matchScore = isVerified ? 0.85 + Math.random() * 0.15 : 0.3 + Math.random() * 0.4;
  
  return {
    verified: isVerified,
    matchScore: parseFloat(matchScore.toFixed(2))
  };
}

// GET /api/auth/profile (protected route example)
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        birthDate: req.user.birthDate,
        residency: req.user.residency,
        kycStatus: req.user.kycStatus,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

module.exports = router;
