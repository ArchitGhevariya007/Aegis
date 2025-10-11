const mongoose = require('mongoose');

const securityAlertSchema = new mongoose.Schema({
    alertType: {
        type: String,
        required: true,
        enum: [
            'BRUTE_FORCE_DETECTED',
            'IMPOSSIBLE_TRAVEL',
            'IMPOSSIBLE_LOCATION_SWITCH',
            'UNAUTHORIZED_ACCESS_ATTEMPT',
            'SUSPICIOUS_IP',
            'ANOMALOUS_LOGIN_PATTERN',
            'MULTIPLE_DEVICE_LOGIN',
            'FAILED_FACE_VERIFICATION',
            'SUSPICIOUS_REGISTRATION',
            'ACCOUNT_TAKEOVER_ATTEMPT'
        ]
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        required: true,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },
    userEmail: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    ipAddress: String,
    location: {
        city: String,
        country: String,
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    deviceInfo: {
        type: {
            type: String
        },
        browser: String,
        os: String,
        device: String
    },
    metadata: {
        attemptCount: Number,
        timeWindow: String,
        previousLocation: Object,
        currentLocation: Object,
        travelTime: Number,
        distance: Number,
        additionalInfo: Object
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'],
        default: 'ACTIVE'
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    resolvedAt: Date,
    resolutionNotes: String
}, { timestamps: true });

// Index for efficient querying
securityAlertSchema.index({ createdAt: -1 });
securityAlertSchema.index({ type: 1, status: 1 });
securityAlertSchema.index({ severity: 1 });

const SecurityAlert = mongoose.model('SecurityAlert', securityAlertSchema);

module.exports = SecurityAlert;
