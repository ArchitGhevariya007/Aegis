const express = require('express');
const router = express.Router();
const EmergencyControl = require('../models/EmergencyControl');
const SecurityAlert = require('../models/SecurityAlert');
const adminAuth = require('../middleware/adminAuth');

// Get current emergency status
router.get('/status', adminAuth, async (req, res) => {
    try {
        const activeControls = await EmergencyControl.find({ status: 'active' })
            .populate('activatedBy', 'email')
            .sort({ activatedAt: -1 });

        res.json({
            hasActiveEmergency: activeControls.length > 0,
            activeControls
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Activate emergency control
router.post('/activate', adminAuth, async (req, res) => {
    try {
        const { type, reason, affectedSystems } = req.body;

        // Check if there's already an active emergency of this type
        const existingEmergency = await EmergencyControl.findOne({
            type,
            status: 'active'
        });

        if (existingEmergency) {
            return res.status(400).json({
                error: `There's already an active ${type} emergency control`
            });
        }

        // Create new emergency control
        const emergencyControl = new EmergencyControl({
            type,
            status: 'active',
            reason,
            affectedSystems,
            activatedBy: req.admin._id
        });

        await emergencyControl.save();

        // Create security alert for the emergency
        await SecurityAlert.create({
            type: 'emergency',
            severity: 'critical',
            title: `Emergency Control Activated: ${type}`,
            description: reason,
            status: 'new'
        });

        res.status(201).json(emergencyControl);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Deactivate emergency control
router.post('/deactivate/:controlId', adminAuth, async (req, res) => {
    try {
        const control = await EmergencyControl.findById(req.params.controlId);

        if (!control) {
            return res.status(404).json({ error: 'Emergency control not found' });
        }

        if (control.status === 'inactive') {
            return res.status(400).json({ error: 'Emergency control is already inactive' });
        }

        control.status = 'inactive';
        control.deactivatedBy = req.admin._id;
        control.deactivatedAt = new Date();

        await control.save();

        // Create security alert for deactivation
        await SecurityAlert.create({
            type: 'emergency',
            severity: 'high',
            title: `Emergency Control Deactivated: ${control.type}`,
            description: `Emergency control deactivated by admin: ${req.admin.email}`,
            status: 'new'
        });

        res.json(control);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get emergency control history
router.get('/history', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10, type } = req.query;
        const query = {};

        if (type) {
            query.type = type;
        }

        const controls = await EmergencyControl.find(query)
            .sort({ activatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('activatedBy', 'email')
            .populate('deactivatedBy', 'email');

        const total = await EmergencyControl.countDocuments(query);

        res.json({
            controls,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get emergency control statistics
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const stats = await EmergencyControl.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    systemLockdowns: {
                        $sum: { $cond: [{ $eq: ['$type', 'system_lockdown'] }, 1, 0] }
                    },
                    securityProtocols: {
                        $sum: { $cond: [{ $eq: ['$type', 'security_protocol'] }, 1, 0] }
                    },
                    dataProtection: {
                        $sum: { $cond: [{ $eq: ['$type', 'data_protection'] }, 1, 0] }
                    }
                }
            }
        ]);

        res.json(stats[0] || {
            total: 0,
            active: 0,
            systemLockdowns: 0,
            securityProtocols: 0,
            dataProtection: 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
