const mongoose = require('mongoose');

const loginLocationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
            required: true
        }
    },
    ipAddress: {
        type: String,
        required: true
    },
    deviceInfo: {
        type: {
            type: String
        },
        browser: String,
        os: String,
        device: String
    },
    city: String,
    region: String,
    country: String,
    countryCode: String,
    timezone: String,
    status: {
        type: String,
        enum: ['success', 'failed', 'suspicious'],
        default: 'success'
    },
    loginType: {
        type: String,
        enum: ['login', 'register', 'password_reset', 'logout', 'failed'],
        default: 'login'
    },
    loginTime: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    sessionId: String,
    lastActivity: {
        type: Date,
        default: Date.now
    },
    logoutTime: Date,
    userEmail: String,
    latitude: Number,
    longitude: Number,
    isp: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Create indexes for efficient querying
loginLocationSchema.index({ userId: 1, loginTime: -1 });
loginLocationSchema.index({ location: '2dsphere' });
loginLocationSchema.index({ status: 1 });
loginLocationSchema.index({ isActive: 1, loginTime: -1 });
loginLocationSchema.index({ sessionId: 1 });

const LoginLocation = mongoose.model('LoginLocation', loginLocationSchema);

module.exports = LoginLocation;
