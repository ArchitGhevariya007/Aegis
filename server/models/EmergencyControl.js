const mongoose = require('mongoose');

const emergencyControlSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },
    type: {
        type: String,
        enum: ['system_lockdown', 'security_protocol', 'data_protection'],
        required: true
    },
    activatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    deactivatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    reason: {
        type: String,
        required: true
    },
    affectedSystems: [{
        type: String,
        required: true
    }],
    activatedAt: {
        type: Date,
        default: Date.now
    },
    deactivatedAt: Date,
    metadata: {
        type: Map,
        of: String
    }
}, { timestamps: true });

// Index for efficient querying
emergencyControlSchema.index({ status: 1, type: 1 });
emergencyControlSchema.index({ activatedAt: -1 });

const EmergencyControl = mongoose.model('EmergencyControl', emergencyControlSchema);

module.exports = EmergencyControl;
