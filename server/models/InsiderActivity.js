const mongoose = require('mongoose');

const insiderActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['data_access', 'permission_change', 'system_config', 'unusual_behavior', 'multiple_device'],
        required: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    metadata: {
        accessPattern: String,
        resourceAccessed: String,
        deviceInfo: {
            type: Map,
            of: String
        },
        previousState: String,
        newState: String
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
    status: {
        type: String,
        enum: ['detected', 'investigating', 'resolved', 'false_positive'],
        default: 'detected'
    },
    investigatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    resolution: {
        type: String,
        default: null
    },
    actionTaken: {
        type: String,
        default: null
    }
}, { timestamps: true });

// Create indexes
insiderActivitySchema.index({ userId: 1, createdAt: -1 });
insiderActivitySchema.index({ type: 1, severity: 1 });
insiderActivitySchema.index({ status: 1 });

const InsiderActivity = mongoose.model('InsiderActivity', insiderActivitySchema);

module.exports = InsiderActivity;
