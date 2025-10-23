const express = require('express');
const router = express.Router();
const Voting = require('../models/Voting');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const facePipeline = require('../services/facePipeline');
const fs = require('fs');

// Get current voting session status (public)
router.get('/status', auth, async (req, res) => {
  try {
    const session = await Voting.getCurrentSession();
    
    // Check if user has voted
    const hasVoted = session.hasUserVoted(req.userId);
    
    res.json({
      success: true,
      voting: {
        isActive: session.isActive,
        title: session.title,
        description: session.description,
        parties: session.parties.map(p => ({
          id: p.id,
          name: p.name,
          logo: p.logo,
          color: p.color
        })),
        hasVoted,
        startTime: session.startTime,
        endTime: session.endTime
      }
    });
  } catch (error) {
    console.error('Error fetching voting status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch voting status'
    });
  }
});

// Verify face for voting
router.post('/verify-face', auth, async (req, res) => {
  try {
    const { liveFaceImage } = req.body;
    
    if (!liveFaceImage) {
      return res.status(400).json({
        success: false,
        message: 'Live face image is required'
      });
    }

    // Get user's registered face image
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get the registered ID face image
    const idFaceDoc = user.documents.find(d => d.type === 'id_face');
    if (!idFaceDoc || !idFaceDoc.filePath) {
      return res.status(400).json({
        success: false,
        message: 'No registered face image found'
      });
    }

    // Read the stored ID face image
    let idFaceImage;
    try {
      // Check if filePath is a base64 data URL or file path
      if (idFaceDoc.filePath.startsWith('data:image')) {
        // Extract base64 from data URL
        idFaceImage = idFaceDoc.filePath.split(',')[1];
      } else if (fs.existsSync(idFaceDoc.filePath)) {
        // Read from file system
        const imageBuffer = fs.readFileSync(idFaceDoc.filePath);
        idFaceImage = imageBuffer.toString('base64');
      } else {
        return res.status(400).json({
          success: false,
          message: 'Registered face image file not found'
        });
      }
    } catch (readError) {
      console.error('[VOTING] Error reading face image:', readError);
      return res.status(500).json({
        success: false,
        message: 'Failed to read registered face image'
      });
    }

    // Compare faces using face pipeline
    const faceComparison = await facePipeline.compareFaceImages(idFaceImage, liveFaceImage);

    if (!faceComparison.success) {
      return res.status(400).json({
        success: false,
        message: 'Face verification failed: ' + faceComparison.error
      });
    }

    if (!faceComparison.is_match) {
      return res.status(403).json({
        success: false,
        message: `Face verification failed. Similarity: ${(faceComparison.similarity * 100).toFixed(1)}% (Required: ${(faceComparison.threshold * 100).toFixed(0)}%)`,
        similarity: faceComparison.similarity,
        threshold: faceComparison.threshold,
        verified: false
      });
    }

    res.json({
      success: true,
      verified: true,
      similarity: faceComparison.similarity,
      threshold: faceComparison.threshold,
      message: 'Face verified successfully'
    });

  } catch (error) {
    console.error('[VOTING] Face verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Face verification failed: ' + error.message
    });
  }
});

// Cast a vote
router.post('/cast-vote', auth, async (req, res) => {
  try {
    const { partyId, faceVerified } = req.body;
    
    if (!partyId) {
      return res.status(400).json({
        success: false,
        message: 'Party selection is required'
      });
    }

    if (!faceVerified) {
      return res.status(403).json({
        success: false,
        message: 'Face verification is required before voting'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const session = await Voting.getCurrentSession();
    const ipAddress = req.ip || req.connection.remoteAddress;

    try {
      const result = await session.castVote(req.userId, user.email, partyId, ipAddress, faceVerified);
      
      console.log(`✅ Vote cast: ${user.email} → ${result.party} ${result.blockchainVerified ? '(Blockchain ✓)' : '(DB only)'}`);
      if (result.transactionHash) {
        console.log(`   TX: ${result.transactionHash}`);
      }
      
      res.json({
        success: true,
        message: `Your vote for ${result.party} has been recorded successfully`,
        party: result.party,
        blockchainVerified: result.blockchainVerified,
        transactionHash: result.transactionHash
      });

    } catch (voteError) {
      return res.status(400).json({
        success: false,
        message: voteError.message
      });
    }

  } catch (error) {
    console.error('[VOTING] Error casting vote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cast vote: ' + error.message
    });
  }
});

// ============== ADMIN ROUTES ==============

// Get voting results (admin only)
router.get('/admin/results', adminAuth, async (req, res) => {
  try {
    const session = await Voting.getCurrentSession();
    
    res.json({
      success: true,
      results: {
        isActive: session.isActive,
        title: session.title,
        description: session.description,
        startTime: session.startTime,
        endTime: session.endTime,
        totalVotes: session.totalVotes,
        parties: session.parties.map(p => ({
          id: p.id,
          name: p.name,
          logo: p.logo,
          color: p.color,
          votes: p.votes,
          percentage: session.totalVotes > 0 ? ((p.votes / session.totalVotes) * 100).toFixed(2) : 0
        })),
        voterCount: session.voters.length,
        blockchainVerifiedCount: session.voters.filter(v => v.blockchainData?.verified).length,
        recentVotes: session.voters.slice(-10).reverse().map(v => ({
          email: v.email,
          timestamp: v.timestamp,
          faceVerified: v.faceVerified,
          blockchainVerified: v.blockchainData?.verified || false,
          transactionHash: v.blockchainData?.transactionHash
        }))
      }
    });
  } catch (error) {
    console.error('[VOTING] Error fetching results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch voting results'
    });
  }
});

// Start voting (admin only)
router.post('/admin/start', adminAuth, async (req, res) => {
  try {
    const session = await Voting.getCurrentSession();
    
    if (session.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Voting is already active'
      });
    }

    session.isActive = true;
    session.startTime = new Date();
    session.endTime = null;
    session.updatedAt = new Date();
    
    await session.save();
    
    // Start voting on blockchain
    const blockchainService = require('../services/blockchainService');
    let blockchainResult = null;
    
    try {
      blockchainResult = await blockchainService.startVotingOnContract();
      console.log('✅ Voting started:', session.isActive ? 'Active' : 'Inactive', '| Blockchain:', blockchainResult?.success ? '✓' : '✗');
    } catch (blockchainError) {
      console.error('⚠️  Blockchain start failed:', blockchainError.message);
    }
    
    res.json({
      success: true,
      message: 'Voting has been started successfully',
      blockchainActive: blockchainResult?.success || false,
      session: {
        isActive: session.isActive,
        startTime: session.startTime
      }
    });
  } catch (error) {
    console.error('[VOTING] Error starting voting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start voting'
    });
  }
});

// Stop voting (admin only)
router.post('/admin/stop', adminAuth, async (req, res) => {
  try {
    const session = await Voting.getCurrentSession();
    
    if (!session.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Voting is not currently active'
      });
    }

    session.isActive = false;
    session.endTime = new Date();
    session.updatedAt = new Date();
    
    await session.save();
    
    // Stop voting on blockchain
    const blockchainService = require('../services/blockchainService');
    
    try {
      await blockchainService.stopVotingOnContract();
      console.log('⏹️  Voting stopped | Total votes:', session.totalVotes);
    } catch (blockchainError) {
      console.error('⚠️  Blockchain stop failed:', blockchainError.message);
    }
    
    res.json({
      success: true,
      message: 'Voting has been stopped successfully',
      session: {
        isActive: session.isActive,
        endTime: session.endTime,
        totalVotes: session.totalVotes
      }
    });
  } catch (error) {
    console.error('[VOTING] Error stopping voting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop voting'
    });
  }
});

// Reset voting (admin only)
router.post('/admin/reset', adminAuth, async (req, res) => {
  try {
    const session = await Voting.getCurrentSession();
    
    // Reset all votes
    session.parties.forEach(party => {
      party.votes = 0;
    });
    
    session.voters = [];
    session.totalVotes = 0;
    session.isActive = false;
    session.startTime = null;
    session.endTime = null;
    session.updatedAt = new Date();
    
    await session.save();
    
    console.log('[VOTING] Voting session reset by admin');
    
    res.json({
      success: true,
      message: 'Voting session has been reset successfully'
    });
  } catch (error) {
    console.error('[VOTING] Error resetting voting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset voting'
    });
  }
});

// Update parties (admin only)
router.put('/admin/parties', adminAuth, async (req, res) => {
  try {
    const { parties } = req.body;
    
    if (!parties || !Array.isArray(parties)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parties data'
      });
    }

    const session = await Voting.getCurrentSession();
    
    if (session.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update parties while voting is active'
      });
    }

    // Preserve existing vote counts if party IDs match
    const updatedParties = parties.map(newParty => {
      const existingParty = session.parties.find(p => p.id === newParty.id);
      return {
        ...newParty,
        votes: existingParty ? existingParty.votes : 0
      };
    });

    session.parties = updatedParties;
    session.updatedAt = new Date();
    
    await session.save();
    
    console.log('[VOTING] Parties updated by admin');
    
    res.json({
      success: true,
      message: 'Parties updated successfully',
      parties: session.parties
    });
  } catch (error) {
    console.error('[VOTING] Error updating parties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update parties'
    });
  }
});

module.exports = router;

