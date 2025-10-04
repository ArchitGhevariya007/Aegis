const mongoose = require('mongoose');

const securityAlertSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['login_attempt', 'suspicious_activity', 'system_error', 'emergency']
    },
    severity: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'critical']
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    ipAddress: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['new', 'investigating', 'resolved', 'dismissed'],
        default: 'new'
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    resolvedAt: Date,
    metadata: {
        type: Map,
        of: String
    }
}, { timestamps: true });

// Index for efficient querying
securityAlertSchema.index({ createdAt: -1 });
securityAlertSchema.index({ type: 1, status: 1 });
securityAlertSchema.index({ severity: 1 });

const SecurityAlert = mongoose.model('SecurityAlert', securityAlertSchema);

module.exports = SecurityAlert;
