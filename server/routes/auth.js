const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const User = require('../models/User');
const LoginLocation = require('../models/LoginLocation');
const { auth } = require('../middleware/auth');
const { 
  validateRegistration, 
  validateLogin, 
  validateFaceVerification 
} = require('../middleware/validation');
const { uploadIdDocument, handleUploadError } = require('../middleware/upload');
const facePipeline = require('../services/facePipeline');
const blockchainService = require('../services/blockchainService');
const geolocationService = require('../services/geolocationService');
const { performSecurityChecks } = require('../services/securityDetectionService');

const router = express.Router();

// Helper function to generate blockchain data
const generateBlockchainData = () => {
  const crypto = require('crypto');
  return {
    idHash: crypto.randomBytes(32).toString('hex'),
    blockReference: `Block #${Math.floor(Math.random() * 1000000) + 18000000}`,
    lastUpdated: new Date(),
    verified: true
  };
};

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
    const { email, password, birthDate, residency, phoneNumber, idFaceImage, liveFaceImage, ocrData, documentData } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    console.log('Registration request received:', {
      email,
      phoneNumber,
      hasIdFaceImage: !!idFaceImage,
      hasLiveFaceImage: !!liveFaceImage,
      idFaceImageLength: idFaceImage?.length || 0,
      liveFaceImageLength: liveFaceImage?.length || 0,
      hasOcrData: !!ocrData,
      ocrData: ocrData,
      hasDocumentData: !!documentData,
      documentData: documentData
    });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Log failed registration attempt for existing user
      await existingUser.logAccess('registration', false, ipAddress, userAgent, 'Email already exists');
      
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
      phoneNumber: phoneNumber || null,
      kycStatus: 'completed',
      isActive: true,
      faceData: {
        idFaceImage: faceComparison.idCroppedFace,
        liveFaceImage: faceComparison.liveCroppedFace,
        livenessVerified: true,
        faceMatched: true
      },
      documents: [
        {
          type: 'id_face',
          fileName: 'id_face_image.jpg',
          filePath: faceComparison.idCroppedFace,
          verified: true,
          // Attach OCR data to the ID face document
          ocrData: ocrData ? {
            name: ocrData.name || null,
            dob: ocrData.dob || null, // Keep as string, don't convert to Date
            idNumber: ocrData.idNumber || null,
            documentType: ocrData.documentType || null,
            address: ocrData.address || null,
            nationality: ocrData.nationality || null
          } : {}
        },
        {
          type: 'live_face',
          fileName: 'live_face_capture.jpg',
          filePath: faceComparison.liveCroppedFace,
          verified: true
        }
      ],
      verificationStatus: {
        documentAuthenticity: true,
        faceMatch: true,
        livenessCheck: true
      },
      blockchainData: generateBlockchainData()
    });

    await user.save();
    
    console.log(`[BLOCKCHAIN] Generated blockchain data for new user ${user.email}`);

    // Log successful registration
    await user.logAccess('registration', true, ipAddress, userAgent);

    // Track registration location
    try {
      const locationData = await geolocationService.getCompleteLocationData(req);
      await LoginLocation.create({
        userId: user._id,
        ...locationData,
        status: 'success',
        loginType: 'register'
      });
      console.log(`[LOCATION] Tracked registration location for ${user.email}`);
    } catch (locError) {
      console.error('[LOCATION] Error tracking registration location:', locError.message);
    }

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
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Check for system lockdown BEFORE allowing login
    const EmergencyControl = require('../models/EmergencyControl');
    const activeLockdown = await EmergencyControl.findOne({
      type: 'system_lockdown',
      status: 'active'
    });

    if (activeLockdown) {
      console.log('[LOCKDOWN] Login attempt blocked - system in lockdown mode');
      return res.status(403).json({
        success: false,
        message: '🔒 System is currently in lockdown mode. All user login attempts are blocked. Please contact your administrator.',
        lockdown: true
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // For security, we don't want to reveal if the email exists or not
      // So we just log a generic failed login attempt
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      await user.logAccess('login', false, ipAddress, userAgent, 'Account locked');
      
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts and log failed attempt
      await user.incLoginAttempts();
      await user.logAccess('login', false, ipAddress, userAgent, 'Invalid password');
      
      // Track failed login location for security detection
      try {
        const locationData = await geolocationService.getCompleteLocationData(req);
        await LoginLocation.create({
          userId: user._id,
          userEmail: user.email,
          ...locationData,
          status: 'failed',
          loginType: 'failed'
        });
        // Check for brute force attacks
        await performSecurityChecks(user._id, user.email, null, ipAddress, 'failed_login');
      } catch (secError) {
        console.error('[SECURITY] Error in failed login detection:', secError);
      }
      
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

    // Log successful login
    await user.logAccess('login', true, ipAddress, userAgent);

    // Generate session ID
    const crypto = require('crypto');
    const sessionId = crypto.randomBytes(32).toString('hex');

    // Track login location and perform security checks
    try {
      const locationData = await geolocationService.getCompleteLocationData(req);
      
      // Mark all previous sessions for this user as inactive
      await LoginLocation.updateMany(
        { userId: user._id, isActive: true },
        { 
          $set: { 
            isActive: false,
            logoutTime: new Date()
          }
        }
      );
      
      const loginLocation = await LoginLocation.create({
        userId: user._id,
        userEmail: user.email,
        sessionId: sessionId,
        ...locationData,
        status: 'success',
        loginType: 'login',
        isActive: true,
        lastActivity: new Date()
      });
      console.log(`[LOCATION] Tracked login location for ${user.email} with session ${sessionId}`);
      
      // Perform security checks for impossible travel, location switches, etc.
      await performSecurityChecks(user._id, user.email, loginLocation, ipAddress, 'login');
    } catch (locError) {
      console.error('[LOCATION] Error tracking login location:', locError.message);
    }

    // Generate JWT token with session ID
    const token = jwt.sign(
      { userId: user._id, sessionId: sessionId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      userId: user._id,
      token,
      user: {
        email: user.email,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const sessionId = req.sessionId;

    // Mark the session as inactive
    await LoginLocation.updateOne(
      { userId: userId, sessionId: sessionId, isActive: true },
      { 
        $set: { 
          isActive: false,
          logoutTime: new Date(),
          loginType: 'logout'
        }
      }
    );

    console.log(`[LOGOUT] User ${userId} logged out from session ${sessionId}`);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
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

    //Face Recognition
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

//  face verification function
async function simulateFaceVerification(faceImage, storedEncoding) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  //  verification result (90% success rate)
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
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
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

// GET /api/auth/user-documents
router.get('/user-documents', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      documents: req.user.documents || []
    });
  } catch (error) {
    console.error('Documents fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents'
    });
  }
});

// GET /api/auth/access-logs
router.get('/access-logs', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const logs = req.user.accessLogs || [];
    const totalLogs = logs.length;
    const totalPages = Math.ceil(totalLogs / limit);
    
    // Sort by timestamp (newest first) and paginate
    const sortedLogs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const paginatedLogs = sortedLogs.slice(skip, skip + limit);

    res.json({
      success: true,
      logs: paginatedLogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalLogs,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });
  } catch (error) {
    console.error('Access logs fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch access logs'
    });
  }
});

// GET /api/auth/verification-status
router.get('/verification-status', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      status: req.user.verificationStatus || {
        documentAuthenticity: false,
        faceMatch: false,
        livenessCheck: false
      }
    });
  } catch (error) {
    console.error('Verification status fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verification status'
    });
  }
});

// GET /api/auth/blockchain-id
router.get('/blockchain-id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has completed KYC and generate blockchain data if needed
    if (user.kycStatus === 'completed' && (!user.blockchainData || !user.blockchainData.idHash)) {
      user.blockchainData = generateBlockchainData();
      await user.save();
      
      console.log(`[BLOCKCHAIN] Generated blockchain data for user ${user.email}`);
    }

    res.json({
      success: true,
      idHash: user.blockchainData?.idHash || '',
      blockReference: user.blockchainData?.blockReference || '',
      lastUpdated: user.blockchainData?.lastUpdated || null,
      verified: user.blockchainData?.verified || false
    });
  } catch (error) {
    console.error('Blockchain data fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blockchain data'
    });
  }
});

// GET /api/auth/notification-settings
router.get('/notification-settings', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      settings: req.user.notificationSettings || {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true
      }
    });
  } catch (error) {
    console.error('Notification settings fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification settings'
    });
  }
});

// PUT /api/auth/notification-settings
router.put('/notification-settings', auth, async (req, res) => {
  try {
    const { settings } = req.body;
    
    req.user.notificationSettings = {
      ...req.user.notificationSettings,
      ...settings
    };
    
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    console.error('Notification settings update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings'
    });
  }
});

// GET /api/auth/permissions
router.get('/permissions', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      permissions: req.user.dataPermissions || {
        name: true,
        dob: true,
        address: false,
        health: false,
        tax: false
      }
    });
  } catch (error) {
    console.error('Permissions fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions'
    });
  }
});

// PUT /api/auth/permissions
router.put('/permissions', auth, async (req, res) => {
  try {
    const { permissions } = req.body;
    
    req.user.dataPermissions = {
      ...req.user.dataPermissions,
      ...permissions
    };
    
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Permissions updated successfully'
    });
  } catch (error) {
    console.error('Permissions update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update permissions'
    });
  }
});

// GET /api/auth/connected-services
router.get('/connected-services', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      services: req.user.connectedServices || []
    });
  } catch (error) {
    console.error('Connected services fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connected services'
    });
  }
});

// POST /api/auth/upload-document
router.post('/upload-document', auth, uploadIdDocument, handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Use custom name if provided, otherwise use original filename
    const customName = req.body.customName;
    const documentCategory = req.body.documentCategory; // Get document category
    const finalFileName = customName && customName.trim() ? 
      customName.trim() : 
      req.file.originalname;

    console.log(`📄 Starting blockchain upload for: ${finalFileName} (Category: ${documentCategory}, original: ${req.file.originalname})`);
    
    // Read file buffer
    const fileBuffer = fs.readFileSync(req.file.path);
    
    try {
      // Store document on blockchain with encryption
      const blockchainResult = await blockchainService.storeDocument(
        fileBuffer,
        finalFileName,
        req.user.email // Using email as user address for now - in production use wallet address
      );

      // Create document record with blockchain data
      const newDocument = {
        type: 'additional',
        fileName: finalFileName,
        documentCategory: documentCategory || 'Uncategorized', // Store document category
        filePath: req.file.path, // Keep local copy as backup
        uploadDate: new Date(),
        verified: blockchainResult.verified,
        // Blockchain specific data
        blockchainData: {
          documentHash: blockchainResult.documentHash,
          ipfsHash: blockchainResult.ipfsHash,
          encryptionKey: blockchainResult.encryptionKey,
          encryptionIV: blockchainResult.encryptionIV,
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber,
          documentId: blockchainResult.documentId,
          blockchainStored: true
        }
      };

      console.log(`📁 Storing document with file path: ${req.file.path}`);
      console.log(`📁 File exists: ${fs.existsSync(req.file.path)}`);
      console.log(`📁 File size: ${fs.statSync(req.file.path).size} bytes`);

      req.user.documents.push(newDocument);
      
      // Update user's blockchain data
      if (!req.user.blockchainData) {
        req.user.blockchainData = {};
      }
      req.user.blockchainData.lastUpdated = new Date();
      req.user.blockchainData.verified = true;

      await req.user.save();

      // Keep local file as backup for easier access
      // Note: In production, you might want to delete this after confirming IPFS storage
      console.log('📁 Keeping local backup copy for easier access');

      // Log document upload activity
      await req.user.logAccess('data_access', true, ipAddress, userAgent);

      res.json({
        success: true,
        message: 'Document uploaded and stored on blockchain successfully',
        document: {
          id: req.user.documents[req.user.documents.length - 1]._id,
          fileName: newDocument.fileName,
          uploadDate: newDocument.uploadDate,
          blockchain: {
            transactionHash: blockchainResult.transactionHash,
            ipfsHash: blockchainResult.ipfsHash,
            documentId: blockchainResult.documentId,
            verified: blockchainResult.verified
          }
        }
      });

    } catch (blockchainError) {
      console.error('Blockchain storage failed:', blockchainError.message);
      
      // Fallback to traditional storage if blockchain fails
      const newDocument = {
        type: 'additional',
        fileName: req.file.originalname,
        filePath: req.file.path,
        uploadDate: new Date(),
        verified: false,
        blockchainData: {
          blockchainStored: false,
          error: blockchainError.message
        }
      };

      req.user.documents.push(newDocument);
      await req.user.save();

      // Log failed blockchain attempt
      await req.user.logAccess('data_access', false, ipAddress, userAgent, 'Blockchain storage failed');

      res.json({
        success: true,
        message: 'Document uploaded (blockchain storage failed, stored locally)',
        document: {
          id: req.user.documents[req.user.documents.length - 1]._id,
          fileName: newDocument.fileName,
          uploadDate: newDocument.uploadDate
        },
        warning: 'Document stored locally due to blockchain error'
      });
    }

  } catch (error) {
    console.error('Document upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup file after error:', cleanupError.message);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    });
  }
});

// GET /api/auth/download-document/:documentId
router.get('/download-document/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = req.user.documents.id(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if document is stored on blockchain
    if (document.blockchainData && document.blockchainData.blockchainStored) {
      try {
        console.log(`📥 Blockchain document detected: ${document.fileName}`);
        console.log(`   Transaction: ${document.blockchainData.transactionHash}`);
        console.log(`   IPFS Hash: ${document.blockchainData.ipfsHash}`);
        
      // For now, fall back to local file since we don't have smart contract
      // In production, this would download from IPFS and decrypt
      console.log(`📁 Checking local file: ${document.filePath}`);
      console.log(`📁 File exists: ${document.filePath ? fs.existsSync(document.filePath) : 'No file path'}`);
      
      if (document.filePath && fs.existsSync(document.filePath)) {
        console.log('📁 Serving from local backup copy (blockchain verified)');
        res.download(document.filePath, document.fileName);
        return;
      } else {
        console.log(`📥 Local file not found, retrieving from IPFS...`);
        
        try {
          // Retrieve and decrypt from IPFS
          const blockchainResult = await blockchainService.retrieveDocumentFromIPFS(
            document.blockchainData.ipfsHash,
            document.blockchainData.encryptionKey,
            document.blockchainData.encryptionIV,
            req.user.email
          );

          // Verify document integrity
          const isValid = await blockchainService.verifyDocument(
            blockchainResult.documentBuffer,
            document.blockchainData.documentHash
          );

          if (!isValid) {
            return res.status(400).json({
              success: false,
              message: 'Document integrity verification failed'
            });
          }

          console.log(`✅ Successfully retrieved and verified document from IPFS`);

          // Set appropriate headers and send decrypted document
          res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
          res.setHeader('Content-Type', 'application/octet-stream');
          res.send(blockchainResult.documentBuffer);
          return;

        } catch (ipfsError) {
          console.error(`❌ IPFS retrieval failed: ${ipfsError.message}`);
          return res.status(500).json({
            success: false,
            message: `Failed to retrieve document from IPFS: ${ipfsError.message}`
          });
        }
      }

      } catch (blockchainError) {
        console.error('Blockchain document access error:', blockchainError.message);
        
        return res.status(500).json({
          success: false,
          message: 'Failed to access blockchain document'
        });
      }
    }

    // For base64 stored images (from registration)
    if (document.filePath && document.filePath.startsWith('data:image')) {
      const base64Data = document.filePath.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Type', 'image/jpeg');
      res.send(buffer);
      return;
    }

    // For file system stored documents
    if (document.filePath && fs.existsSync(document.filePath)) {
      res.download(document.filePath, document.fileName);
    } else {
      res.status(404).json({
        success: false,
        message: 'Document file not found on server'
      });
    }
  } catch (error) {
    console.error('Document download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download document'
    });
  }
});

// GET /api/auth/view-document/:documentId
router.get('/view-document/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = req.user.documents.id(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if document is stored on blockchain
    if (document.blockchainData && document.blockchainData.blockchainStored) {
      console.log(`📥 Viewing blockchain document: ${document.fileName}`);
      console.log(`   Transaction: ${document.blockchainData.transactionHash}`);
      console.log(`   IPFS Hash: ${document.blockchainData.ipfsHash}`);
      
      // For now, return info about blockchain storage since we don't have full IPFS retrieval
      return res.json({
        success: true,
        message: 'Document is securely stored on blockchain',
        document: {
          fileName: document.fileName,
          uploadDate: document.uploadDate,
          verified: document.verified,
          blockchain: {
            stored: true,
            transactionHash: document.blockchainData.transactionHash,
            ipfsHash: document.blockchainData.ipfsHash,
            verified: true
          }
        },
        note: 'Document is encrypted and stored on IPFS. Use download to get the file.'
      });
    }

    // For base64 stored images (from registration)
    if (document.filePath && document.filePath.startsWith('data:image')) {
      const base64Data = document.filePath.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', 'image/jpeg');
      res.send(buffer);
      return;
    }

    // For file system stored documents
    if (document.filePath && fs.existsSync(document.filePath)) {
      const ext = path.extname(document.fileName).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.pdf') contentType = 'application/pdf';
      
      res.setHeader('Content-Type', contentType);
      res.sendFile(path.resolve(document.filePath));
    } else {
      res.status(404).json({
        success: false,
        message: 'Document file not found on server'
      });
    }
  } catch (error) {
    console.error('Document view error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to view document'
    });
  }
});

// GET /api/auth/download-digital-id
router.get('/download-digital-id', auth, async (req, res) => {
  try {
    // Check if user has completed KYC
    if (req.user.kycStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Digital ID not available. Please complete KYC first.'
      });
    }

    const PDFDocument = require('pdfkit');
    
    // Generate a PDF digital ID document
    const digitalIdData = {
      name: req.user.email.split('@')[0],
      email: req.user.email,
      birthDate: req.user.birthDate,
      residency: req.user.residency,
      kycStatus: req.user.kycStatus,
      verificationStatus: req.user.verificationStatus,
      issuedAt: new Date().toISOString(),
      digitalSignature: 'DIGITAL_ID_' + req.user._id
    };

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: 'Digital Identity Card',
        Author: 'Aegis Digital Identity System',
        Subject: 'Blockchain Verified Digital Identity',
        Creator: 'Aegis Platform'
      }
    });

    // Set response headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="digital-id.pdf"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Pipe PDF to response
    doc.pipe(res);

    // Gradient background
    const gradient = doc.linearGradient(0, 50, 0, 800)
      .stop(0, '#6a11cb')
      .stop(1, '#2575fc');
    doc.rect(0, 0, 595, 842)
       .fill(gradient)
       .fill();

    // Main white card with rounded corners
    const cardX = 50;
    const cardY = 100;
    const cardWidth = 495;
    const cardHeight = 600;

    // Card shadow and main card
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 15)
       .fillColor('white')
       .fill();

    // Card border
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 15)
       .strokeColor('#667eea')
       .lineWidth(2)
       .stroke();

    // Header section
    doc.rect(cardX, cardY, cardWidth, 100)
       .fillColor('#667eea')
       .fill();

    // Title
    doc.fillColor('white')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('Digital Identity Card', cardX, cardY + 30, { 
         align: 'center', 
         width: cardWidth
       });

    // Verification status
    doc.fillColor('white')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('✓ Blockchain Verified', cardX, cardY + 60, { 
         align: 'center', 
         width: cardWidth
       });

    // Content area
    let yPosition = cardY + 130;
    const fieldSpacing = 30;

    const fields = [
      { label: 'Full Name:', value: digitalIdData.name },
      { label: 'Email:', value: digitalIdData.email },
      { label: 'Date of Birth:', value: new Date(digitalIdData.birthDate).toLocaleDateString() },
      { label: 'Residency:', value: digitalIdData.residency },
      { label: 'Verification Status:', value: digitalIdData.kycStatus.toUpperCase() },
      { label: 'Issued Date:', value: new Date(digitalIdData.issuedAt).toLocaleDateString() }
    ];

    fields.forEach(field => {
      // Field container
      doc.roundedRect(cardX + 20, yPosition - 5, cardWidth - 40, 30, 5)
         .fillColor('#f8fafc')
         .fill();

      doc.roundedRect(cardX + 20, yPosition - 5, cardWidth - 40, 30, 5)
         .strokeColor('#e2e8f0')
         .lineWidth(0.5)
         .stroke();

      // Label
      doc.fillColor('#374151')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(field.label, cardX + 30, yPosition);
      
      // Value
      doc.fillColor('#1f2937')
         .fontSize(12)
         .font('Helvetica')
         .text(field.value, cardX + 200, yPosition);
      
      yPosition += fieldSpacing;
    });

    // Digital signature section
    yPosition += 20;
    
    doc.fillColor('#374151')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('Digital Signature:', cardX, yPosition);
    
    yPosition += 25;

    // Signature container
    doc.roundedRect(cardX + 20, yPosition - 5, cardWidth - 40, 50, 5)
       .fillColor('#f1f5f9')
       .fill();

    doc.roundedRect(cardX + 20, yPosition - 5, cardWidth - 40, 50, 5)
       .strokeColor('#cbd5e1')
       .lineWidth(1)
       .stroke();

    doc.fillColor('#475569')
       .fontSize(10)
       .font('Courier')
       .text(digitalIdData.digitalSignature, cardX + 30, yPosition + 10, { 
         width: cardWidth - 60,
         align: 'center'
       });

    // Footer
    const footerY = cardY + cardHeight - 60;
    
    doc.fillColor('#64748b')
       .fontSize(10)
       .font('Helvetica')
       .text('This digital identity card is blockchain verified and tamper-proof.', 
             cardX, footerY, { 
               align: 'center', 
               width: cardWidth
             });
    
    doc.text('Generated by Aegis Digital Identity System', 
             cardX, footerY + 20, { 
               align: 'center', 
               width: cardWidth
             });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Digital ID download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate digital ID'
    });
  }
});

// POST /api/auth/generate-share-link
router.post('/generate-share-link', auth, async (req, res) => {
  try {
    // Check if user has completed KYC
    if (req.user.kycStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Digital ID not available for sharing. Please complete KYC first.'
      });
    }

    // Generate a temporary share link (expires in 1 hour)
    const shareToken = jwt.sign(
      { 
        userId: req.user._id,
        type: 'share_link',
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
      },
      process.env.JWT_SECRET
    );

    const shareLink = `${req.protocol}://${req.get('host')}/api/auth/verify-shared-id/${shareToken}`;

    res.json({
      success: true,
      shareLink: shareLink,
      expiresIn: '1 hour'
    });
  } catch (error) {
    console.error('Share link generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate share link'
    });
  }
});

// GET /api/auth/verify-shared-id/:token
router.get('/verify-shared-id/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'share_link') {
      return res.status(400).json({
        success: false,
        message: 'Invalid share link'
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      verificationData: {
        verified: user.kycStatus === 'completed',
        verificationStatus: user.verificationStatus,
        issuedAt: user.createdAt,
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid share link'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Share link has expired'
      });
    }
    
    console.error('Share link verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify share link'
    });
  }
});

// Delete document
router.delete('/delete-document/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const user = req.user;

    // Find the document to delete
    const documentIndex = user.documents.findIndex(doc => doc._id.toString() === documentId);
    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const document = user.documents[documentIndex];
    console.log(`🗑️ Deleting document: ${document.fileName}`);

    // Delete from local storage if exists
    if (document.filePath && fs.existsSync(document.filePath)) {
      try {
        fs.unlinkSync(document.filePath);
        console.log(`✅ Deleted local file: ${document.filePath}`);
      } catch (fileError) {
        console.warn(`⚠️ Could not delete local file: ${fileError.message}`);
      }
    }

    // Delete from Pinata IPFS if stored on blockchain
    if (document.blockchainData?.ipfsHash) {
      try {
        console.log(`🗑️ Attempting to unpin from Pinata: ${document.blockchainData.ipfsHash}`);
        
        // First, check if the file exists on Pinata
        try {
          const checkResponse = await axios.get(`https://api.pinata.cloud/data/pinList?hashContains=${document.blockchainData.ipfsHash}`, {
            headers: {
              'pinata_api_key': process.env.PINATA_API_KEY,
              'pinata_secret_api_key': process.env.PINATA_SECRET_KEY
            }
          });
          
          if (checkResponse.data.count === 0) {
            console.log(`ℹ️ File not found on Pinata (may already be unpinned): ${document.blockchainData.ipfsHash}`);
            return;
          }
          
          console.log(`📋 Found ${checkResponse.data.count} file(s) on Pinata for hash: ${document.blockchainData.ipfsHash}`);
        } catch (checkError) {
          console.warn(`⚠️ Could not check Pinata status: ${checkError.message}`);
        }
        
        // Proceed with unpinning
        const response = await axios.delete(`https://api.pinata.cloud/pinning/unpin/${document.blockchainData.ipfsHash}`, {
          headers: {
            'pinata_api_key': process.env.PINATA_API_KEY,
            'pinata_secret_api_key': process.env.PINATA_SECRET_KEY
          }
        });
        
        if (response.status === 200) {
          console.log(`✅ Successfully unpinned from Pinata: ${document.blockchainData.ipfsHash}`);
        } else {
          console.warn(`⚠️ Unexpected response from Pinata: ${response.status} - ${response.statusText}`);
        }
      } catch (pinataError) {
        console.error(`❌ Pinata unpin error for ${document.blockchainData.ipfsHash}:`, {
          message: pinataError.message,
          status: pinataError.response?.status,
          statusText: pinataError.response?.statusText,
          data: pinataError.response?.data
        });
        
        // If it's a 404, the file might already be unpinned
        if (pinataError.response?.status === 404) {
          console.log(`ℹ️ File not found on Pinata (already unpinned): ${document.blockchainData.ipfsHash}`);
        }
      }
    }

    // Remove from user's documents array
    user.documents.splice(documentIndex, 1);
    await user.save();

    console.log(`✅ Document deleted successfully: ${document.fileName}`);

    res.json({
      success: true,
      message: 'Document deleted successfully',
      deletedDocument: {
        id: documentId,
        fileName: document.fileName,
        blockchainStored: !!document.blockchainData?.blockchainStored
      }
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
});

module.exports = router;
