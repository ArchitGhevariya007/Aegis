const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    permissions: [{
        type: String,
        required: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, { timestamps: true });

// Create indexes
roleSchema.index({ name: 1 });
roleSchema.index({ isActive: 1 });

const Role = mongoose.model('Role', roleSchema);

// Create default roles if they don't exist
const createDefaultRoles = async (adminId) => {
    const defaultRoles = [
        {
            name: 'user',
            description: 'Regular user with basic permissions',
            permissions: ['read_own_profile', 'update_own_profile', 'create_digital_id']
        },
        {
            name: 'manager',
            description: 'Manager with team management permissions',
            permissions: ['read_own_profile', 'update_own_profile', 'create_digital_id', 'manage_team', 'view_team_reports']
        },
        {
            name: 'security_officer',
            description: 'Security officer with enhanced security permissions',
            permissions: ['read_own_profile', 'update_own_profile', 'create_digital_id', 'view_security_logs', 'manage_security_alerts']
        }
    ];

    for (const role of defaultRoles) {
        try {
            const exists = await Role.findOne({ name: role.name });
            if (!exists) {
                await Role.create({
                    ...role,
                    createdBy: adminId,
                    isActive: true
                });
                console.log(`Default role created: ${role.name}`);
            }
        } catch (error) {
            console.error(`Error creating default role ${role.name}:`, error);
        }
    }
};

module.exports = { Role, createDefaultRoles };
