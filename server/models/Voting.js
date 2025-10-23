const mongoose = require('mongoose');

const votingSchema = new mongoose.Schema({
  isActive: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  title: {
    type: String,
    default: 'General Election'
  },
  description: {
    type: String,
    default: 'Cast your vote for the party of your choice'
  },
  parties: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    logo: {
      type: String // Emoji or icon identifier
    },
    color: {
      type: String,
      default: '#6366f1'
    },
    votes: {
      type: Number,
      default: 0
    }
  }],
  voters: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: String,
    partyId: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    faceVerified: {
      type: Boolean,
      default: true
    },
    blockchainData: {
      transactionHash: String,
      blockNumber: String,
      voteHash: String,
      verified: Boolean,
      timestamp: String
    }
  }],
  totalVotes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check if user has already voted
votingSchema.methods.hasUserVoted = function(userId) {
  return this.voters.some(voter => voter.userId.toString() === userId.toString());
};

// Method to cast a vote
votingSchema.methods.castVote = async function(userId, userEmail, partyId, ipAddress, faceVerified) {
  // Check if user has already voted
  if (this.hasUserVoted(userId)) {
    throw new Error('User has already voted');
  }

  // Check if voting is active
  if (!this.isActive) {
    throw new Error('Voting is not currently active');
  }

  // Find the party
  const party = this.parties.find(p => p.id === partyId);
  if (!party) {
    throw new Error('Invalid party selection');
  }

  // Store vote on blockchain
  const blockchainService = require('../services/blockchainService');
  let blockchainData = null;
  
  try {
    const voteData = {
      userId: userId.toString(),
      sessionId: this._id.toString(),
      partyId,
      timestamp: new Date().toISOString(),
      faceVerified
    };
    
    blockchainData = await blockchainService.storeVote(voteData);
    console.log('✅ Vote stored on blockchain:', blockchainData.transactionHash);
    if (blockchainData.contractAddress) {
      console.log('📝 Smart Contract:', blockchainData.contractAddress);
    }
  } catch (blockchainError) {
    console.error('⚠️  Blockchain storage failed:', blockchainError.message);
    // Continue with vote but mark as not blockchain-verified
    blockchainData = {
      verified: false,
      error: blockchainError.message
    };
  }

  // Increment vote count
  party.votes += 1;
  this.totalVotes += 1;

  // Add voter record with blockchain data
  this.voters.push({
    userId,
    email: userEmail,
    partyId,
    ipAddress,
    faceVerified,
    timestamp: new Date(),
    blockchainData
  });

  this.updatedAt = new Date();
  await this.save();

  return {
    success: true,
    party: party.name,
    blockchainVerified: blockchainData?.verified || false,
    transactionHash: blockchainData?.transactionHash
  };
};

// Static method to get or create voting session
votingSchema.statics.getCurrentSession = async function() {
  let session = await this.findOne({});
  
  if (!session) {
    // Create default voting session with sample parties
    session = await this.create({
      isActive: false,
      title: 'General Election',
      description: 'Cast your vote for the party of your choice',
      parties: [
        {
          id: 'party1',
          name: 'Progressive Alliance',
          logo: '🟦',
          color: '#3b82f6',
          votes: 0
        },
        {
          id: 'party2',
          name: 'Democratic Unity',
          logo: '🟩',
          color: '#10b981',
          votes: 0
        },
        {
          id: 'party3',
          name: 'People\'s Coalition',
          logo: '🟥',
          color: '#ef4444',
          votes: 0
        },
        {
          id: 'party4',
          name: 'National Front',
          logo: '🟨',
          color: '#f59e0b',
          votes: 0
        }
      ],
      voters: [],
      totalVotes: 0
    });
  }
  
  return session;
};

module.exports = mongoose.model('Voting', votingSchema);

