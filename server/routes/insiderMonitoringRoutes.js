const express = require('express');
const router = express.Router();
const InsiderActivity = require('../models/InsiderActivity');
const SecurityAlert = require('../models/SecurityAlert');
const adminAuth = require('../middleware/adminAuth');

// Get all insider activities with filtering and pagination
router.get('/', adminAuth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            type,
            severity,
            status,
            userId,
            startDate,
            endDate
        } = req.query;

        const query = {};
        
        if (type) query.type = type;
        if (severity) query.severity = severity;
        if (status) query.status = status;
        if (userId) query.userId = userId;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const activities = await InsiderActivity.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('userId', 'email name')
            .populate('investigatedBy', 'email');

        const total = await InsiderActivity.countDocuments(query);

        res.json({
            activities,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Record new insider activity
router.post('/', async (req, res) => {
    try {
        const activity = new InsiderActivity(req.body);
        await activity.save();

        // Create security alert for high severity activities
        if (['high', 'critical'].includes(req.body.severity)) {
            await SecurityAlert.create({
                type: 'suspicious_activity',
                severity: req.body.severity,
                title: `Insider Activity Detected: ${req.body.type}`,
                description: req.body.description,
                userId: req.body.userId,
                status: 'new'
            });
        }

        res.status(201).json(activity);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update activity status
router.patch('/:activityId', adminAuth, async (req, res) => {
    try {
        const { status, resolution, actionTaken } = req.body;
        const activity = await InsiderActivity.findById(req.params.activityId);

        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        Object.assign(activity, {
            ...(status && { status }),
            ...(resolution && { resolution }),
            ...(actionTaken && { actionTaken }),
            investigatedBy: req.admin._id
        });

        await activity.save();
        res.json(activity);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get activity statistics
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const stats = await InsiderActivity.aggregate([
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
                    detected: {
                        $sum: { $cond: [{ $eq: ['$status', 'detected'] }, 1, 0] }
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

        // Get activity type distribution
        const typeStats = await InsiderActivity.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.json({
            overall: stats[0] || {
                total: 0,
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                detected: 0,
                investigating: 0,
                resolved: 0
            },
            byType: typeStats
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's activity history
router.get('/user/:userId', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const activities = await InsiderActivity.find({ userId: req.params.userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('userId', 'email name')
            .populate('investigatedBy', 'email');

        const total = await InsiderActivity.countDocuments({ userId: req.params.userId });

        res.json({
            activities,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
