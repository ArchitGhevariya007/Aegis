const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  documentType: {
    type: String,
    required: true,
    enum: ['passport', 'id_card', 'driving_license', 'additional', 'selfie', 'id_face', 'live_face'],
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: Number,
  mimeType: String,
  fileHash: {
    type: String,
    index: true
  },
  uploadDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiryDate: Date,
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'expired'],
    default: 'pending',
    index: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  verifiedAt: Date,
  rejectionReason: String,
  ocrData: {
    name: String,
    dateOfBirth: Date,
    documentNumber: String,
    issueDate: Date,
    expiryDate: Date,
    nationality: String,
    address: String,
    rawText: String,
    confidence: Number
  },
  metadata: {
    width: Number,
    height: Number,
    format: String
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Compound indexes
documentSchema.index({ userId: 1, documentType: 1 });
documentSchema.index({ uploadDate: -1 });

// Check if document is expired
documentSchema.methods.isExpired = function() {
  if (!this.expiryDate) return false;
  return this.expiryDate < new Date();
};

// Soft delete
documentSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Document', documentSchema);

