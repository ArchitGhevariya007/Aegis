const express = require('express');
const router = express.Router();
const { Role } = require('../models/Role');
const adminAuth = require('../middleware/adminAuth');

// Get all roles with filtering and pagination
router.get('/', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10, isActive } = req.query;
        const query = {};
        
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const roles = await Role.find(query)
            .sort({ name: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('createdBy', 'email')
            .populate('updatedBy', 'email');

        const total = await Role.countDocuments(query);

        res.json({
            roles,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new role
router.post('/', adminAuth, async (req, res) => {
    try {
        const { name, description, permissions } = req.body;

        // Check if role already exists
        const existingRole = await Role.findOne({ name });
        if (existingRole) {
            return res.status(400).json({ error: 'Role already exists' });
        }

        const role = new Role({
            name,
            description,
            permissions,
            createdBy: req.admin._id
        });

        await role.save();
        res.status(201).json(role);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update role
router.patch('/:roleId', adminAuth, async (req, res) => {
    try {
        const { description, permissions, isActive } = req.body;
        const role = await Role.findById(req.params.roleId);

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        // Don't allow updating the name of default roles
        if (req.body.name && ['user', 'manager', 'security_officer'].includes(role.name)) {
            return res.status(400).json({ error: 'Cannot modify default role name' });
        }

        Object.assign(role, {
            ...(req.body.name && { name: req.body.name }),
            ...(description && { description }),
            ...(permissions && { permissions }),
            ...(isActive !== undefined && { isActive }),
            updatedBy: req.admin._id
        });

        await role.save();
        res.json(role);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get role by ID
router.get('/:roleId', adminAuth, async (req, res) => {
    try {
        const role = await Role.findById(req.params.roleId)
            .populate('createdBy', 'email')
            .populate('updatedBy', 'email');

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        res.json(role);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get role statistics
router.get('/stats/summary', adminAuth, async (req, res) => {
    try {
        const stats = await Role.aggregate([
            {
                $group: {
                    _id: null,
                    totalRoles: { $sum: 1 },
                    activeRoles: {
                        $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                    },
                    inactiveRoles: {
                        $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
                    }
                }
            }
        ]);

        res.json(stats[0] || {
            totalRoles: 0,
            activeRoles: 0,
            inactiveRoles: 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get available permissions list
router.get('/permissions/list', adminAuth, async (req, res) => {
    // List of all available permissions in the system
    const availablePermissions = [
        'read_own_profile',
        'update_own_profile',
        'create_digital_id',
        'manage_team',
        'view_team_reports',
        'view_security_logs',
        'manage_security_alerts',
        'manage_roles',
        'view_analytics',
        'manage_system_settings'
    ];

    res.json({ permissions: availablePermissions });
});

module.exports = router;
