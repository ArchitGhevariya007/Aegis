const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    loginLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    }
}, { timestamps: true });

// Hash password before saving
adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
adminSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { id: this._id, email: this.email, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

const Admin = mongoose.model('Admin', adminSchema);

// Initialize admin from environment variables
const initializeAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.warn('⚠️  Admin credentials not found in environment variables');
            console.warn('⚠️  Please set ADMIN_EMAIL and ADMIN_PASSWORD in .env file');
            return;
        }

        const adminExists = await Admin.findOne({ email: adminEmail });
        if (!adminExists) {
            await Admin.create({
                email: adminEmail,
                password: adminPassword
            });
            console.log('✓ Admin account created successfully');
        } else {
            console.log('✓ Admin account already exists');
        }
    } catch (error) {
        console.error('❌ Error initializing admin:', error.message);
    }
};

module.exports = { Admin, initializeAdmin };
