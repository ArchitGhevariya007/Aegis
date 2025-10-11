const SecurityAlert = require('../models/SecurityAlert');
const LoginLocation = require('../models/LoginLocation');

// Helper to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Check for brute force attacks (multiple failed login attempts)
async function checkBruteForce(email, ipAddress) {
    try {
        // Check failed attempts in last 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        
        const recentFailures = await LoginLocation.countDocuments({
            userEmail: email,
            ipAddress: ipAddress,
            loginType: 'failed',
            timestamp: { $gte: fifteenMinutesAgo }
        });

        if (recentFailures >= 5) {
            await SecurityAlert.create({
                alertType: 'BRUTE_FORCE_DETECTED',
                title: 'BRUTE FORCE DETECTED',
                description: 'Multiple failed login attempts detected',
                severity: 'HIGH',
                userEmail: email,
                ipAddress: ipAddress,
                metadata: {
                    attemptCount: recentFailures,
                    timeWindow: '15 minutes'
                },
                status: 'ACTIVE'
            });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error checking brute force:', error);
        return false;
    }
}

// Check for impossible travel (login from geographically distant locations in short time)
async function checkImpossibleTravel(userId, userEmail, currentLocation) {
    try {
        // Get the most recent successful login
        const previousLogin = await LoginLocation.findOne({
            $or: [{ userId }, { userEmail }],
            loginType: 'login',
            _id: { $ne: currentLocation._id }
        }).sort({ timestamp: -1 });

        if (!previousLogin || !previousLogin.latitude || !previousLogin.longitude) {
            return false;
        }

        if (!currentLocation.latitude || !currentLocation.longitude) {
            return false;
        }

        // Calculate distance and time difference
        const distance = calculateDistance(
            previousLogin.latitude,
            previousLogin.longitude,
            currentLocation.latitude,
            currentLocation.longitude
        );

        const timeDiff = (currentLocation.timestamp - previousLogin.timestamp) / 1000 / 3600; // hours
        
        // Average commercial flight speed is around 900 km/h
        // If travel speed > 900 km/h, it's impossible
        const travelSpeed = distance / timeDiff;

        if (travelSpeed > 900 && distance > 500) {
            await SecurityAlert.create({
                alertType: 'IMPOSSIBLE_TRAVEL',
                title: 'IMPOSSIBLE TRAVEL',
                description: 'Login from impossible geographic location',
                severity: 'CRITICAL',
                userEmail: userEmail,
                userId: userId,
                ipAddress: currentLocation.ipAddress,
                location: {
                    city: currentLocation.city,
                    country: currentLocation.country,
                    coordinates: [currentLocation.longitude, currentLocation.latitude]
                },
                metadata: {
                    previousLocation: {
                        city: previousLogin.city,
                        country: previousLogin.country,
                        timestamp: previousLogin.timestamp
                    },
                    currentLocation: {
                        city: currentLocation.city,
                        country: currentLocation.country,
                        timestamp: currentLocation.timestamp
                    },
                    distance: Math.round(distance),
                    travelTime: Math.round(timeDiff * 100) / 100,
                    travelSpeed: Math.round(travelSpeed)
                },
                status: 'ACTIVE'
            });
            return true;
        }

        // Check for impossible location switch (same account, different locations, short time)
        if (distance > 100 && timeDiff < 1) { // >100km in <1 hour
            await SecurityAlert.create({
                alertType: 'IMPOSSIBLE_LOCATION_SWITCH',
                title: 'IMPOSSIBLE LOCATION SWITCH',
                description: 'Login attempts with impossible different location with same account',
                severity: 'HIGH',
                userEmail: userEmail,
                userId: userId,
                ipAddress: currentLocation.ipAddress,
                location: {
                    city: currentLocation.city,
                    country: currentLocation.country,
                    coordinates: [currentLocation.longitude, currentLocation.latitude]
                },
                metadata: {
                    previousLocation: {
                        city: previousLogin.city,
                        country: previousLogin.country,
                        timestamp: previousLogin.timestamp
                    },
                    currentLocation: {
                        city: currentLocation.city,
                        country: currentLocation.country,
                        timestamp: currentLocation.timestamp
                    },
                    distance: Math.round(distance),
                    travelTime: Math.round(timeDiff * 100) / 100
                },
                status: 'ACTIVE'
            });
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error checking impossible travel:', error);
        return false;
    }
}

// Check for anomalous login pattern
async function checkAnomalousLogin(userId, userEmail, currentLocation) {
    try {
        // Check if this is a new country for the user
        const loginFromCountry = await LoginLocation.findOne({
            $or: [{ userId }, { userEmail }],
            country: currentLocation.country,
            loginType: 'login',
            _id: { $ne: currentLocation._id }
        });

        if (!loginFromCountry) {
            // First time login from this country
            const totalLogins = await LoginLocation.countDocuments({
                $or: [{ userId }, { userEmail }],
                loginType: 'login'
            });

            if (totalLogins > 5) {
                await SecurityAlert.create({
                    alertType: 'ANOMALOUS_LOGIN_PATTERN',
                    title: 'LOW PRIORITY ANOMALOUS LOGIN',
                    description: 'Unusual login pattern detected',
                    severity: 'LOW',
                    userEmail: userEmail,
                    userId: userId,
                    ipAddress: currentLocation.ipAddress,
                    location: {
                        city: currentLocation.city,
                        country: currentLocation.country,
                        coordinates: [currentLocation.longitude, currentLocation.latitude]
                    },
                    metadata: {
                        additionalInfo: {
                            reason: 'First time login from new country',
                            country: currentLocation.country
                        }
                    },
                    status: 'ACTIVE'
                });
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error checking anomalous login:', error);
        return false;
    }
}

// Check for unauthorized access attempt
async function checkUnauthorizedAccess(email, reason = 'Insider attempted unauthorized data access') {
    try {
        await SecurityAlert.create({
            alertType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
            title: 'UNAUTHORIZED ACCESS ATTEMPT',
            description: reason,
            severity: 'CRITICAL',
            userEmail: email,
            metadata: {
                additionalInfo: {
                    reason: reason
                }
            },
            status: 'ACTIVE'
        });
        return true;
    } catch (error) {
        console.error('Error creating unauthorized access alert:', error);
        return false;
    }
}

// Main security check function
async function performSecurityChecks(userId, userEmail, locationData, ipAddress, checkType = 'login') {
    try {
        const checks = [];

        if (checkType === 'failed_login') {
            // Check for brute force
            checks.push(checkBruteForce(userEmail, ipAddress));
        } else if (checkType === 'login' && locationData) {
            // Check for impossible travel and location switch
            checks.push(checkImpossibleTravel(userId, userEmail, locationData));
            // Check for anomalous login patterns
            checks.push(checkAnomalousLogin(userId, userEmail, locationData));
        }

        await Promise.all(checks);
    } catch (error) {
        console.error('Error performing security checks:', error);
    }
}

module.exports = {
    performSecurityChecks,
    checkBruteForce,
    checkImpossibleTravel,
    checkUnauthorizedAccess,
    checkAnomalousLogin
};

