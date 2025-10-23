const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  birthDate: {
    type: Date,
    required: true
  },
  residency: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'document_uploaded', 'liveness_verified', 'face_matched', 'completed'],
    default: 'pending'
  },
  documents: [{
    type: {
      type: String,
      enum: ['id_document', 'id_face', 'live_face', 'id_card', 'passport', 'drivers_license', 'additional']
    },
    fileName: String,
    documentCategory: String, // Document category for department permissions
    filePath: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    },
    ocrData: {
      name: String,
      dob: String, // Changed from Date to String to match OCR extraction format
      documentType: String,
      address: String,
      idNumber: String,
      nationality: String
    },
    blockchainData: {
      blockchainStored: {
        type: Boolean,
        default: false
      },
      documentHash: String,
      ipfsHash: String,
      encryptionKey: String,
      encryptionIV: String,
      transactionHash: String,
      blockNumber: String,
      documentId: String,
      error: String
    }
  }],
  faceData: {
    idFaceImage: String,
    liveFaceImage: String,
    faceEncoding: String,
    livenessVerified: {
      type: Boolean,
      default: false
    },
    faceMatched: {
      type: Boolean,
      default: false
    }
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  accessLogs: [{
    action: {
      type: String,
      enum: ['login', 'registration', 'logout', 'password_change', 'data_access'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    success: {
      type: Boolean,
      required: true
    },
    failureReason: String,
    location: {
      country: String,
      city: String,
      region: String
    }
  }],
  notificationSettings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    pushNotifications: {
      type: Boolean,
      default: true
    }
  },
  dataPermissions: {
    name: {
      type: Boolean,
      default: true
    },
    dob: {
      type: Boolean,
      default: true
    },
    address: {
      type: Boolean,
      default: false
    },
    health: {
      type: Boolean,
      default: false
    },
    tax: {
      type: Boolean,
      default: false
    }
  },
  connectedServices: [{
    serviceId: String,
    serviceName: String,
    permissions: [String],
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending'
    },
    connectedAt: {
      type: Date,
      default: Date.now
    }
  }],
  blockchainData: {
    idHash: String,
    blockReference: String,
    lastUpdated: Date,
    verified: {
      type: Boolean,
      default: false
    }
  },
  verificationStatus: {
    documentAuthenticity: {
      type: Boolean,
      default: false
    },
    faceMatch: {
      type: Boolean,
      default: false
    },
    livenessCheck: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to log access attempt
userSchema.methods.logAccess = function(action, success, ipAddress, userAgent, failureReason = null) {
  const accessLog = {
    action,
    success,
    ipAddress,
    userAgent,
    failureReason
  };
  
  this.accessLogs.push(accessLog);
  
  // Keep only last 100 access logs to prevent document from growing too large
  if (this.accessLogs.length > 100) {
    this.accessLogs = this.accessLogs.slice(-100);
  }
  
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
