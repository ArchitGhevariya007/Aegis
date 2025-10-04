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
            type: String,
            required: true
        },
        browser: String,
        os: String,
        device: String
    },
    city: String,
    country: String,
    status: {
        type: String,
        enum: ['success', 'failed', 'suspicious'],
        default: 'success'
    },
    loginTime: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Create indexes for efficient querying
loginLocationSchema.index({ userId: 1, loginTime: -1 });
loginLocationSchema.index({ location: '2dsphere' });
loginLocationSchema.index({ status: 1 });

const LoginLocation = mongoose.model('LoginLocation', loginLocationSchema);

module.exports = LoginLocation;
