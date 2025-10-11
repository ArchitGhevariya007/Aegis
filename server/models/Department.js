const mongoose = require('mongoose');

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
        unique: true,
        enum: ['ITD', 'MED', 'IMM']
    },
    description: String,
    permissions: [{
        category: {
            type: String,
            required: true
        },
        fields: [{
            name: String,
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
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    lastModified: {
        type: Date,
        default: Date.now
    }
});

// Default permissions structure
const defaultPermissions = {
    'Income Tax Department': [
        {
            category: 'Basic Information',
            fields: [
                { name: 'Full Name', enabled: true },
                { name: 'Email', enabled: true },
                { name: 'Date of Birth', enabled: true },
                { name: 'Phone Number', enabled: true },
                { name: 'Current Address', enabled: true }
            ]
        },
        {
            category: 'Document Access',
            fields: [
                { name: 'Tax Returns', enabled: true },
                { name: 'Payslips', enabled: true },
                { name: 'Passport', enabled: false }
            ]
        }
    ],
    'Medical Department': [
        {
            category: 'Basic Information',
            fields: [
                { name: 'Full Name', enabled: true },
                { name: 'Email', enabled: true },
                { name: 'Date of Birth', enabled: true },
                { name: 'Age', enabled: true },
                { name: 'Blood Type', enabled: true }
            ]
        },
        {
            category: 'Document Access',
            fields: [
                { name: 'Medical History', enabled: true },
                { name: 'Insurance Policy', enabled: true },
                { name: 'Passport', enabled: false }
            ]
        }
    ],
    'Immigration Department': [
        {
            category: 'Basic Information',
            fields: [
                { name: 'Full Name', enabled: true },
                { name: 'Email', enabled: true },
                { name: 'Date of Birth', enabled: true },
                { name: 'Nationality', enabled: true },
                { name: 'Place of Birth', enabled: true },
                { name: 'Current Address', enabled: true }
            ]
        },
        {
            category: 'Document Access',
            fields: [
                { name: 'Passport', enabled: true },
                { name: 'Visa', enabled: true },
                { name: 'Criminal History', enabled: true },
                { name: 'Work Permit', enabled: true }
            ]
        }
    ]
};

// Initialize default departments
const initializeDepartments = async () => {
    try {
        const departments = [
            {
                name: 'Income Tax Department',
                code: 'ITD',
                description: 'Manages tax-related information and financial records',
                permissions: defaultPermissions['Income Tax Department']
            },
            {
                name: 'Medical Department',
                code: 'MED',
                description: 'Manages health records and medical information',
                permissions: defaultPermissions['Medical Department']
            },
            {
                name: 'Immigration Department',
                code: 'IMM',
                description: 'Manages travel documents and immigration records',
                permissions: defaultPermissions['Immigration Department']
            }
        ];

        for (const dept of departments) {
            await Department.findOneAndUpdate(
                { code: dept.code },
                dept,
                { upsert: true, new: true }
            );
        }

        console.log('[DEPARTMENTS] Default departments initialized');
    } catch (error) {
        console.error('[DEPARTMENTS] Initialization error:', error);
    }
};

const Department = mongoose.model('Department', departmentSchema);

module.exports = { Department, initializeDepartments };

