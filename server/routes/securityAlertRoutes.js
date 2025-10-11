const express = require('express');
const router = express.Router();
const SecurityAlert = require('../models/SecurityAlert');
const adminAuth = require('../middleware/adminAuth');

// Get all security alerts with filtering and pagination
router.get('/', adminAuth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            alertType,
            severity,
            status,
            startDate,
            endDate
        } = req.query;

        const query = {};
        
        if (alertType) query.alertType = alertType;
        if (severity) query.severity = severity;
        if (status) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const alerts = await SecurityAlert.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .populate('userId', 'email name')
            .populate('resolvedBy', 'email');

        const total = await SecurityAlert.countDocuments(query);

        res.json({
            alerts,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Error fetching security alerts:', error);
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

// Get alert statistics
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const stats = await SecurityAlert.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    critical: {
                        $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
                    },
                    high: {
                        $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
                    },
                    medium: {
                        $sum: { $cond: [{ $eq: ['$severity', 'medium'] }, 1, 0] }
                    },
                    low: {
                        $sum: { $cond: [{ $eq: ['$severity', 'low'] }, 1, 0] }
                    },
                    new: {
                        $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] }
                    },
                    investigating: {
                        $sum: { $cond: [{ $eq: ['$status', 'investigating'] }, 1, 0] }
                    },
                    resolved: {
                        $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
                    }
                }
            }
        ]);

        res.json(stats[0] || {
            total: 0,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            new: 0,
            investigating: 0,
            resolved: 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Resolve alert
router.patch('/:alertId/resolve', adminAuth, async (req, res) => {
    try {
        const { resolutionNotes } = req.body;
        const alert = await SecurityAlert.findById(req.params.alertId);

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        alert.status = 'RESOLVED';
        alert.resolvedBy = req.admin._id;
        alert.resolvedAt = new Date();
        if (resolutionNotes) {
            alert.resolutionNotes = resolutionNotes;
        }

        await alert.save();
        res.json({ message: 'Alert resolved successfully', alert });
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

// Update alert status
router.patch('/:alertId', adminAuth, async (req, res) => {
    try {
        const { status, resolutionNotes } = req.body;
        const alert = await SecurityAlert.findById(req.params.alertId);

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        alert.status = status;
        if (status === 'RESOLVED') {
            alert.resolvedBy = req.admin._id;
            alert.resolvedAt = new Date();
        }
        if (resolutionNotes) {
            alert.resolutionNotes = resolutionNotes;
        }

        await alert.save();
        res.json(alert);
    } catch (error) {
        console.error('Error updating alert:', error);
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

// Create new security alert (internal use)
router.post('/', async (req, res) => {
    try {
        const alert = new SecurityAlert(req.body);
        await alert.save();
        res.status(201).json(alert);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get alert by ID
router.get('/:alertId', adminAuth, async (req, res) => {
    try {
        const alert = await SecurityAlert.findById(req.params.alertId)
            .populate('userId', 'email name')
            .populate('resolvedBy', 'email');

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        res.json(alert);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
