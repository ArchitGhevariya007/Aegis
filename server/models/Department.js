const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['Income Tax Department', 'Medical Department', 'Immigration Department']
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    permissions: [{
        category: {
            type: String,
            required: true
        },
        fields: [{
            name: {
                type: String,
                required: true
            },
            enabled: {
                type: Boolean,
                default: true
            }
        }]
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// Hash password before saving
departmentSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Compare password method
departmentSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Default permissions and credentials
const defaultDepartments = {
    'Income Tax Department': {
        code: 'INCOME',
        description: 'Manages tax-related information and financial documents',
        email: 'income@income.com',
        password: 'Income@123',
        permissions: [
            {
                category: 'Basic Information',
                fields: [
                    { name: 'Full Name', enabled: true },
                    { name: 'Email', enabled: true },
                    { name: 'Date of Birth', enabled: true },
                    { name: 'Phone Number', enabled: false },
                    { name: 'Current Address', enabled: false },
                    { name: 'Age', enabled: false },
                    { name: 'Blood Type', enabled: false },
                    { name: 'Nationality', enabled: false },
                    { name: 'Place of Birth', enabled: false }
                ]
            },
            {
                category: 'Document Access',
                fields: [
                    { name: 'Medical History', enabled: false },
                    { name: 'Insurance Policy', enabled: false },
                    { name: 'Tax Returns', enabled: true },
                    { name: 'Payslips', enabled: true },
                    { name: 'Passport', enabled: false },
                    { name: 'Visa', enabled: false },
                    { name: 'Criminal History', enabled: false },
                    { name: 'Work Permit', enabled: false }
                ]
            }
        ]
    },
    'Medical Department': {
        code: 'MEDICAL',
        description: 'Handles health records and medical information',
        email: 'medical@medical.com',
        password: 'Medical@123',
        permissions: [
            {
                category: 'Basic Information',
                fields: [
                    { name: 'Full Name', enabled: true },
                    { name: 'Email', enabled: true },
                    { name: 'Date of Birth', enabled: true },
                    { name: 'Phone Number', enabled: true },
                    { name: 'Current Address', enabled: true },
                    { name: 'Age', enabled: true },
                    { name: 'Blood Type', enabled: true },
                    { name: 'Nationality', enabled: false },
                    { name: 'Place of Birth', enabled: false }
                ]
            },
            {
                category: 'Document Access',
                fields: [
                    { name: 'Medical History', enabled: true },
                    { name: 'Insurance Policy', enabled: true },
                    { name: 'Tax Returns', enabled: false },
                    { name: 'Payslips', enabled: false },
                    { name: 'Passport', enabled: false },
                    { name: 'Visa', enabled: false },
                    { name: 'Criminal History', enabled: false },
                    { name: 'Work Permit', enabled: false }
                ]
            }
        ]
    },
    'Immigration Department': {
        code: 'IMMI',
        description: 'Oversees immigration status and travel documents',
        email: 'immigration@immi.com',
        password: 'Immigration@123',
        permissions: [
            {
                category: 'Basic Information',
                fields: [
                    { name: 'Full Name', enabled: true },
                    { name: 'Email', enabled: true },
                    { name: 'Date of Birth', enabled: true },
                    { name: 'Phone Number', enabled: true },
                    { name: 'Current Address', enabled: true },
                    { name: 'Age', enabled: false },
                    { name: 'Blood Type', enabled: false },
                    { name: 'Nationality', enabled: true },
                    { name: 'Place of Birth', enabled: true }
                ]
            },
            {
                category: 'Document Access',
                fields: [
                    { name: 'Medical History', enabled: false },
                    { name: 'Insurance Policy', enabled: false },
                    { name: 'Tax Returns', enabled: false },
                    { name: 'Payslips', enabled: false },
                    { name: 'Passport', enabled: true },
                    { name: 'Visa', enabled: true },
                    { name: 'Criminal History', enabled: true },
                    { name: 'Work Permit', enabled: true }
                ]
            }
        ]
    }
};

// Initialize default departments
const initializeDepartments = async () => {
    try {
        for (const [name, data] of Object.entries(defaultDepartments)) {
            const existing = await Department.findOne({ name });
            
            if (!existing) {
                // Create new department
                const dept = new Department({
                    name,
                    code: data.code,
                    description: data.description,
                    email: data.email,
                    password: data.password,
                    permissions: data.permissions
                });
                await dept.save();
                console.log(`[DEPARTMENTS] Created ${name}`);
            } else {
                console.log(`[DEPARTMENTS] ${name} already exists`);
            }
        }

        console.log('[DEPARTMENTS] Default departments initialized');
    } catch (error) {
        console.error('[DEPARTMENTS] Initialization error:', error);
    }
};

const Department = mongoose.model('Department', departmentSchema);

module.exports = { Department, initializeDepartments };