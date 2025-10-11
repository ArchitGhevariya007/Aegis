const express = require('express');
const router = express.Router();
const LoginLocation = require('../models/LoginLocation');
const SecurityAlert = require('../models/SecurityAlert');
const adminAuth = require('../middleware/adminAuth');
const geolocationService = require('../services/geolocationService');

// Get all login locations with filtering and pagination
router.get('/', adminAuth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            startDate,
            endDate,
            userId
        } = req.query;

        const query = {};
        
        if (status) query.status = status;
        if (userId) query.userId = userId;
        if (startDate || endDate) {
            query.loginTime = {};
            if (startDate) query.loginTime.$gte = new Date(startDate);
            if (endDate) query.loginTime.$lte = new Date(endDate);
        }

        const locations = await LoginLocation.find(query)
            .sort({ loginTime: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('userId', 'email name');

        const total = await LoginLocation.countDocuments(query);

        res.json({
            locations,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get login locations within radius
router.get('/nearby', adminAuth, async (req, res) => {
    try {
        const { longitude, latitude, radius = 5000 } = req.query; // radius in meters

        const locations = await LoginLocation.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(radius)
                }
            }
        })
        .sort({ loginTime: -1 })
        .limit(100)
        .populate('userId', 'email name');

        res.json(locations);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get location statistics
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const stats = await LoginLocation.aggregate([
            {
                $group: {
                    _id: null,
                    totalLogins: { $sum: 1 },
                    successfulLogins: {
                        $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
                    },
                    failedLogins: {
                        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                    },
                    suspiciousLogins: {
                        $sum: { $cond: [{ $eq: ['$status', 'suspicious'] }, 1, 0] }
                    }
                }
            }
        ]);

        // Get country-wise statistics
        const countryStats = await LoginLocation.aggregate([
            {
                $group: {
                    _id: '$country',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        res.json({
            overall: stats[0] || {
                totalLogins: 0,
                successfulLogins: 0,
                failedLogins: 0,
                suspiciousLogins: 0
            },
            topCountries: countryStats
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Record new login location (internal use)
router.post('/', async (req, res) => {
    try {
        const location = new LoginLocation(req.body);
        await location.save();

        // Check for suspicious activity
        if (req.body.status === 'suspicious') {
            await SecurityAlert.create({
                type: 'suspicious_activity',
                severity: 'high',
                title: 'Suspicious Login Activity Detected',
                description: `Suspicious login attempt from ${req.body.city}, ${req.body.country}`,
                location: location.location,
                ipAddress: req.body.ipAddress,
                userId: req.body.userId,
                status: 'new'
            });
        }

        res.status(201).json(location);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's login history
router.get('/user/:userId', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const locations = await LoginLocation.find({ userId: req.params.userId })
            .sort({ loginTime: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('userId', 'email name');

        const total = await LoginLocation.countDocuments({ userId: req.params.userId });

        res.json({
            locations,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get aggregated location data for map visualization
router.get('/map-data', adminAuth, async (req, res) => {
    try {
        const { timeRange = '30', activeOnly = 'false' } = req.query; // days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeRange));

        // Build match query
        const matchQuery = {
            loginTime: { $gte: startDate },
            status: 'success'
        };

        // If activeOnly is true, only show currently active/online users
        if (activeOnly === 'true') {
            matchQuery.isActive = true;
            // Check for recent activity (last 30 minutes)
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            matchQuery.lastActivity = { $gte: thirtyMinutesAgo };
        }

        // Aggregate login locations by city
        const locationStats = await LoginLocation.aggregate([
            {
                $match: matchQuery
            },
            {
                $group: {
                    _id: {
                        city: '$city',
                        country: '$country',
                        coordinates: '$location.coordinates'
                    },
                    count: { $sum: 1 },
                    lastLogin: { $max: '$loginTime' },
                    users: { $addToSet: '$userId' }
                }
            },
            {
                $project: {
                    _id: 0,
                    city: '$_id.city',
                    country: '$_id.country',
                    coordinates: '$_id.coordinates',
                    loginCount: '$count',
                    uniqueUsers: { $size: '$users' },
                    lastLogin: 1,
                    status: {
                        $cond: {
                            if: { $gte: ['$count', 10] },
                            then: 'high',
                            else: {
                                $cond: {
                                    if: { $gte: ['$count', 5] },
                                    then: 'medium',
                                    else: 'low'
                                }
                            }
                        }
                    }
                }
            },
            { $sort: { loginCount: -1 } },
            { $limit: 100 } // Top 100 locations
        ]);

        res.json({
            success: true,
            locations: locationStats,
            totalLocations: locationStats.length
        });
    } catch (error) {
        console.error('Map data error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get recent activity summary
router.get('/recent-activity', adminAuth, async (req, res) => {
    try {
        const { limit = 10, activeOnly = 'false' } = req.query;

        // Build match query
        const matchQuery = {
            status: 'success'
        };

        // If activeOnly is true, only show currently active/online users
        if (activeOnly === 'true') {
            matchQuery.isActive = true;
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            matchQuery.lastActivity = { $gte: thirtyMinutesAgo };
        }

        const recentActivity = await LoginLocation.aggregate([
            {
                $match: matchQuery
            },
            {
                $group: {
                    _id: {
                        city: '$city',
                        country: '$country',
                        coordinates: '$location.coordinates'
                    },
                    count: { $sum: 1 },
                    lastLogin: { $max: '$loginTime' }
                }
            },
            {
                $project: {
                    _id: 0,
                    city: '$_id.city',
                    country: '$_id.country',
                    coordinates: '$_id.coordinates',
                    loginCount: '$count',
                    lastLogin: 1,
                    status: {
                        $cond: {
                            if: { $lt: ['$count', 5] },
                            then: 'suspicious',
                            else: 'normal'
                        }
                    }
                }
            },
            { $sort: { lastLogin: -1 } },
            { $limit: parseInt(limit) }
        ]);

        res.json({
            success: true,
            activities: recentActivity
        });
    } catch (error) {
        console.error('Recent activity error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
