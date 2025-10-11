const express = require('express');
const router = express.Router();
const EmergencyControl = require('../models/EmergencyControl');
const SecurityAlert = require('../models/SecurityAlert');
const User = require('../models/User');
const LoginLocation = require('../models/LoginLocation');
const adminAuth = require('../middleware/adminAuth');

// Get current emergency status
router.get('/status', adminAuth, async (req, res) => {
    try {
        const activeControls = await EmergencyControl.find({ status: 'active' })
            .populate('activatedBy', 'email')
            .sort({ activatedAt: -1 });

        // Check specifically for active lockdown
        const activeLockdown = await EmergencyControl.findOne({
            type: 'system_lockdown',
            status: 'active'
        });

        res.json({
            hasActiveEmergency: activeControls.length > 0,
            isLockdownActive: !!activeLockdown,
            activeControls,
            activeLockdown
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

// Export data (Emergency data backup)
router.get('/export-users', adminAuth, async (req, res) => {
    try {
        const { type = 'users' } = req.query;
        console.log(`[EMERGENCY] Exporting ${type} data...`);
        
        let exportData;
        
        if (type === 'admin') {
            // Export admin-specific data
            const { Admin } = require('../models/Admin');
            const admins = await Admin.find({}).select('-password').lean();
            const emergencyControls = await EmergencyControl.find({})
                .populate('activatedBy', 'email')
                .populate('deactivatedBy', 'email')
                .lean();
            const adminAlerts = await SecurityAlert.find({ 
                severity: { $in: ['HIGH', 'CRITICAL'] } 
            }).limit(100).lean();
            
            exportData = {
                exportedAt: new Date(),
                exportedBy: req.admin.email,
                reason: 'Emergency Admin Data Backup',
                data: {
                    admins: admins,
                    emergencyControls: emergencyControls,
                    criticalAlerts: adminAlerts,
                    summary: {
                        totalAdmins: admins.length,
                        totalEmergencyEvents: emergencyControls.length,
                        criticalAlerts: adminAlerts.length
                    }
                }
            };
        } else {
            // Export user data (exclude admin accounts)
            const users = await User.find({}).select('-password').lean();
            const loginLocations = await LoginLocation.find({}).lean();
            const securityAlerts = await SecurityAlert.find({}).lean();
            
            exportData = {
                exportedAt: new Date(),
                exportedBy: req.admin.email,
                reason: 'Emergency User Data Backup',
                data: {
                    users: users,
                    loginLocations: loginLocations,
                    securityAlerts: securityAlerts,
                    summary: {
                        totalUsers: users.length,
                        totalLoginRecords: loginLocations.length,
                        totalSecurityAlerts: securityAlerts.length,
                        activeUsers: users.filter(u => !u.accountLocked).length,
                        lockedUsers: users.filter(u => u.accountLocked).length
                    }
                }
            };
        }

        // Log the export action
        await SecurityAlert.create({
            alertType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
            title: `Emergency ${type === 'admin' ? 'Admin' : 'User'} Data Export`,
            description: `Admin ${req.admin.email} exported ${type} data for emergency backup`,
            severity: 'HIGH',
            userEmail: req.admin.email,
            status: 'RESOLVED'
        });

        console.log(`[EMERGENCY] ${type} data export completed`);
        res.json({
            success: true,
            data: exportData,
            message: `${type === 'admin' ? 'Admin' : 'User'} data exported successfully`
        });
    } catch (error) {
        console.error('[EMERGENCY] Export error:', error);
        res.status(500).json({ error: 'Failed to export data', message: error.message });
    }
});

// Generate comprehensive system report
router.get('/system-report', adminAuth, async (req, res) => {
    try {
        console.log('[EMERGENCY] Generating system report...');
        
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // User statistics
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ accountLocked: false });
        const lockedUsers = await User.countDocuments({ accountLocked: true });
        const newUsersToday = await User.countDocuments({ 
            createdAt: { $gte: last24Hours } 
        });
        
        // Login statistics
        const totalLogins = await LoginLocation.countDocuments();
        const loginsToday = await LoginLocation.countDocuments({ 
            loginTime: { $gte: last24Hours },
            loginType: 'login'
        });
        const failedLoginsToday = await LoginLocation.countDocuments({ 
            loginTime: { $gte: last24Hours },
            loginType: 'failed'
        });
        const activeSessionsNow = await LoginLocation.countDocuments({ 
            isActive: true,
            lastActivity: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
        });
        
        // Security alerts
        const totalAlerts = await SecurityAlert.countDocuments();
        const activeAlerts = await SecurityAlert.countDocuments({ status: 'ACTIVE' });
        const criticalAlerts = await SecurityAlert.countDocuments({ 
            severity: 'CRITICAL',
            createdAt: { $gte: last7Days }
        });
        
        // Recent critical alerts
        const recentCriticalAlerts = await SecurityAlert.find({ 
            severity: { $in: ['CRITICAL', 'HIGH'] },
            createdAt: { $gte: last7Days }
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('alertType title severity createdAt userEmail status')
        .lean();
        
        // Emergency controls history
        const emergencyControls = await EmergencyControl.find()
            .sort({ activatedAt: -1 })
            .limit(10)
            .populate('activatedBy', 'email')
            .populate('deactivatedBy', 'email')
            .lean();
        
        // Login location breakdown
        const locationStats = await LoginLocation.aggregate([
            { $match: { loginTime: { $gte: last7Days } } },
            {
                $group: {
                    _id: '$country',
                    count: { $sum: 1 },
                    cities: { $addToSet: '$city' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        
        // Alert type breakdown
        const alertTypeStats = await SecurityAlert.aggregate([
            { $match: { createdAt: { $gte: last7Days } } },
            {
                $group: {
                    _id: '$alertType',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        const report = {
            generatedAt: now,
            generatedBy: req.admin.email,
            reportPeriod: {
                start: last7Days,
                end: now
            },
            systemStatus: {
                status: activeAlerts > 5 ? 'CRITICAL' : activeAlerts > 0 ? 'WARNING' : 'HEALTHY',
                activeAlerts: activeAlerts,
                criticalIssues: criticalAlerts
            },
            userMetrics: {
                total: totalUsers,
                active: activeUsers,
                locked: lockedUsers,
                newToday: newUsersToday,
                activeSessions: activeSessionsNow
            },
            loginMetrics: {
                total: totalLogins,
                today: loginsToday,
                failedToday: failedLoginsToday,
                successRate: loginsToday > 0 ? ((loginsToday - failedLoginsToday) / loginsToday * 100).toFixed(2) + '%' : '0%'
            },
            securityMetrics: {
                totalAlerts: totalAlerts,
                activeAlerts: activeAlerts,
                criticalAlertsLast7Days: criticalAlerts,
                alertTypes: alertTypeStats
            },
            geographicData: {
                topCountries: locationStats
            },
            recentCriticalAlerts: recentCriticalAlerts,
            emergencyControlHistory: emergencyControls,
            recommendations: generateRecommendations(activeAlerts, criticalAlerts, failedLoginsToday, lockedUsers)
        };

        // Log the report generation
        await SecurityAlert.create({
            alertType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
            title: 'Emergency System Report Generated',
            description: `Admin ${req.admin.email} generated a comprehensive system report`,
            severity: 'MEDIUM',
            userEmail: req.admin.email,
            status: 'RESOLVED'
        });

        console.log('[EMERGENCY] System report generated successfully');
        res.json({
            success: true,
            report: report
        });
    } catch (error) {
        console.error('[EMERGENCY] Report generation error:', error);
        res.status(500).json({ error: 'Failed to generate system report', message: error.message });
    }
});

// Toggle system lockdown
router.post('/toggle-lockdown', adminAuth, async (req, res) => {
    try {
        const { enabled, reason } = req.body;
        
        // Debug logging
        console.log('[EMERGENCY] Toggle lockdown request:', { 
            enabled, 
            enabledType: typeof enabled,
            enabledValue: enabled,
            enabledStrictTrue: enabled === true,
            enabledLooseTrue: enabled == true,
            reason,
            body: req.body 
        });
        
        // Ensure enabled is a boolean
        const shouldEnable = enabled === true || enabled === 'true';
        
        if (shouldEnable) {
            // Check if lockdown already active
            const existingLockdown = await EmergencyControl.findOne({
                type: 'system_lockdown',
                status: 'active'
            });

            if (existingLockdown) {
                return res.status(400).json({
                    error: 'System lockdown is already active'
                });
            }

            // Create lockdown control
            const lockdown = await EmergencyControl.create({
                type: 'system_lockdown',
                status: 'active',
                reason: reason || 'Emergency system lockdown activated',
                affectedSystems: ['user_login', 'data_access', 'api_endpoints'],
                activatedBy: req.admin._id
            });

            // Forcefully logout all active users
            await LoginLocation.updateMany(
                { isActive: true },
                { 
                    $set: { 
                        isActive: false, 
                        logoutTime: new Date(),
                        loginType: 'logout'
                    } 
                }
            );

            // Create critical alert
            await SecurityAlert.create({
                alertType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                title: 'SYSTEM LOCKDOWN ACTIVATED',
                description: `Emergency system lockdown activated by ${req.admin.email}. Reason: ${reason || 'Not specified'}`,
                severity: 'CRITICAL',
                userEmail: req.admin.email,
                status: 'ACTIVE'
            });

            console.log(`[EMERGENCY] System lockdown activated by ${req.admin.email}`);
            res.json({
                success: true,
                message: 'System lockdown activated. All users have been logged out.',
                lockdown: lockdown
            });
        } else {
            // Deactivate lockdown
            const lockdown = await EmergencyControl.findOne({
                type: 'system_lockdown',
                status: 'active'
            });

            if (!lockdown) {
                // If no active lockdown, just return success (system is already unlocked)
                console.log(`[EMERGENCY] No active lockdown found, system already unlocked`);
                return res.json({
                    success: true,
                    message: 'System is already unlocked.',
                    lockdown: null
                });
            }

            lockdown.status = 'inactive';
            lockdown.deactivatedBy = req.admin._id;
            lockdown.deactivatedAt = new Date();
            await lockdown.save();

            // Create alert
            await SecurityAlert.create({
                alertType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                title: 'SYSTEM LOCKDOWN DEACTIVATED',
                description: `System lockdown deactivated by ${req.admin.email}. System restored to normal operation.`,
                severity: 'HIGH',
                userEmail: req.admin.email,
                status: 'RESOLVED'
            });

            console.log(`[EMERGENCY] System lockdown deactivated by ${req.admin.email}`);
            res.json({
                success: true,
                message: 'System lockdown deactivated. Normal operations resumed.',
                lockdown: lockdown
            });
        }
    } catch (error) {
        console.error('[EMERGENCY] Lockdown toggle error:', error);
        res.status(500).json({ error: 'Failed to toggle system lockdown', message: error.message });
    }
});

// Helper function to generate recommendations
function generateRecommendations(activeAlerts, criticalAlerts, failedLogins, lockedUsers) {
    const recommendations = [];
    
    if (criticalAlerts > 5) {
        recommendations.push({
            level: 'CRITICAL',
            message: 'High number of critical alerts detected. Immediate investigation required.',
            action: 'Review security alerts panel and investigate recent incidents'
        });
    }
    
    if (failedLogins > 20) {
        recommendations.push({
            level: 'WARNING',
            message: 'Elevated failed login attempts detected today.',
            action: 'Review login locations and consider implementing additional security measures'
        });
    }
    
    if (lockedUsers > 10) {
        recommendations.push({
            level: 'INFO',
            message: 'Multiple user accounts are currently locked.',
            action: 'Review locked accounts and verify if lockouts are legitimate'
        });
    }
    
    if (activeAlerts === 0 && criticalAlerts === 0) {
        recommendations.push({
            level: 'SUCCESS',
            message: 'System is operating normally with no active security concerns.',
            action: 'Continue monitoring for any anomalies'
        });
    }
    
    return recommendations;
}

module.exports = router;
