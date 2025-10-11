const mongoose = require('mongoose');
require('dotenv').config();
const SecurityAlert = require('../models/SecurityAlert');

const sampleAlerts = [
    {
        alertType: 'BRUTE_FORCE_DETECTED',
        title: 'BRUTE FORCE DETECTED',
        description: 'Multiple failed login attempts detected',
        severity: 'HIGH',
        userEmail: 'john.doe@example.com',
        ipAddress: '203.45.67.89',
        location: {
            city: 'Sydney',
            country: 'Australia',
            coordinates: [151.2093, -33.8688]
        },
        deviceInfo: {
            type: 'Desktop',
            browser: 'Chrome 120',
            os: 'Windows 10',
            device: 'Desktop'
        },
        metadata: {
            attemptCount: 8,
            timeWindow: '15 minutes'
        },
        status: 'ACTIVE',
        createdAt: new Date('2024-08-29T14:30:22')
    },
    {
        alertType: 'IMPOSSIBLE_TRAVEL',
        title: 'IMPOSSIBLE TRAVEL',
        description: 'Login from impossible geographic location',
        severity: 'CRITICAL',
        userEmail: 'sarah.smith@example.com',
        ipAddress: '45.123.89.12',
        location: {
            city: 'Tokyo',
            country: 'Japan',
            coordinates: [139.6917, 35.6895]
        },
        deviceInfo: {
            type: 'Mobile',
            browser: 'Safari 17',
            os: 'iOS 17',
            device: 'iPhone'
        },
        metadata: {
            previousLocation: {
                city: 'New York',
                country: 'United States',
                timestamp: new Date('2024-08-29T12:00:00')
            },
            currentLocation: {
                city: 'Tokyo',
                country: 'Japan',
                timestamp: new Date('2024-08-29T13:45:10')
            },
            distance: 10850,
            travelTime: 1.75,
            travelSpeed: 6200
        },
        status: 'ACTIVE',
        createdAt: new Date('2024-08-29T13:45:10')
    },
    {
        alertType: 'IMPOSSIBLE_LOCATION_SWITCH',
        title: 'IMPOSSIBLE LOCATION SWITCH',
        description: 'Login attempts with impossible different location with same account',
        severity: 'HIGH',
        userEmail: 'mike.wilson@example.com',
        ipAddress: '192.168.1.45',
        location: {
            city: 'London',
            country: 'United Kingdom',
            coordinates: [-0.1276, 51.5074]
        },
        deviceInfo: {
            type: 'Desktop',
            browser: 'Firefox 121',
            os: 'Ubuntu 22.04',
            device: 'Desktop'
        },
        metadata: {
            previousLocation: {
                city: 'Melbourne',
                country: 'Australia',
                timestamp: new Date('2024-08-29T11:45:33')
            },
            currentLocation: {
                city: 'London',
                country: 'United Kingdom',
                timestamp: new Date('2024-08-29T12:15:33')
            },
            distance: 16900,
            travelTime: 0.5
        },
        status: 'ACTIVE',
        createdAt: new Date('2024-08-29T12:15:33')
    },
    {
        alertType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        title: 'UNAUTHORIZED ACCESS ATTEMPT',
        description: 'Insider attempted unauthorized data access',
        severity: 'CRITICAL',
        userEmail: 'admin@system.local',
        ipAddress: '10.0.0.45',
        location: {
            city: 'Singapore',
            country: 'Singapore',
            coordinates: [103.8198, 1.3521]
        },
        deviceInfo: {
            type: 'Desktop',
            browser: 'Chrome 120',
            os: 'macOS Sonoma',
            device: 'MacBook Pro'
        },
        metadata: {
            additionalInfo: {
                reason: 'Attempted to access restricted admin panel',
                targetResource: '/api/admin/users/export'
            }
        },
        status: 'ACTIVE',
        createdAt: new Date('2024-08-29T11:30:45')
    },
    {
        alertType: 'ANOMALOUS_LOGIN_PATTERN',
        title: 'LOW PRIORITY ANOMALOUS LOGIN',
        description: 'Unusual login pattern detected',
        severity: 'LOW',
        userEmail: 'alice.brown@example.com',
        ipAddress: '78.45.123.67',
        location: {
            city: 'Berlin',
            country: 'Germany',
            coordinates: [13.4050, 52.5200]
        },
        deviceInfo: {
            type: 'Tablet',
            browser: 'Safari 17',
            os: 'iPadOS 17',
            device: 'iPad'
        },
        metadata: {
            additionalInfo: {
                reason: 'First time login from new country',
                country: 'Germany'
            }
        },
        status: 'ACTIVE',
        createdAt: new Date('2024-08-29T10:20:15')
    },
    {
        alertType: 'MULTIPLE_DEVICE_LOGIN',
        title: 'MULTIPLE DEVICE LOGIN',
        description: 'Account accessed from multiple devices simultaneously',
        severity: 'MEDIUM',
        userEmail: 'robert.jones@example.com',
        ipAddress: '156.89.45.23',
        location: {
            city: 'Paris',
            country: 'France',
            coordinates: [2.3522, 48.8566]
        },
        deviceInfo: {
            type: 'Mobile',
            browser: 'Chrome Mobile 120',
            os: 'Android 14',
            device: 'Samsung Galaxy'
        },
        metadata: {
            additionalInfo: {
                deviceCount: 3,
                devices: ['iPhone', 'Samsung Galaxy', 'Windows PC']
            }
        },
        status: 'ACTIVE',
        createdAt: new Date('2024-08-29T09:15:00')
    },
    {
        alertType: 'SUSPICIOUS_IP',
        title: 'SUSPICIOUS IP DETECTED',
        description: 'Login attempt from known suspicious IP address',
        severity: 'HIGH',
        userEmail: 'emily.davis@example.com',
        ipAddress: '185.220.101.45',
        location: {
            city: 'Unknown',
            country: 'Russia',
            coordinates: [37.6173, 55.7558]
        },
        deviceInfo: {
            type: 'Desktop',
            browser: 'Tor Browser',
            os: 'Unknown',
            device: 'Unknown'
        },
        metadata: {
            additionalInfo: {
                reason: 'IP flagged in threat intelligence database',
                threatScore: 85
            }
        },
        status: 'ACTIVE',
        createdAt: new Date('2024-08-29T08:45:30')
    },
    {
        alertType: 'FAILED_FACE_VERIFICATION',
        title: 'FAILED FACE VERIFICATION',
        description: 'Multiple failed biometric verification attempts',
        severity: 'MEDIUM',
        userEmail: 'david.miller@example.com',
        ipAddress: '98.234.156.78',
        location: {
            city: 'Los Angeles',
            country: 'United States',
            coordinates: [-118.2437, 34.0522]
        },
        deviceInfo: {
            type: 'Mobile',
            browser: 'Safari 17',
            os: 'iOS 17',
            device: 'iPhone'
        },
        metadata: {
            attemptCount: 4,
            timeWindow: '10 minutes'
        },
        status: 'RESOLVED',
        resolvedAt: new Date('2024-08-29T09:00:00'),
        createdAt: new Date('2024-08-29T08:30:00')
    },
    // Add more recent alerts
    {
        alertType: 'BRUTE_FORCE_DETECTED',
        title: 'BRUTE FORCE DETECTED',
        description: 'Multiple failed login attempts detected',
        severity: 'HIGH',
        userEmail: 'test.user@example.com',
        ipAddress: '123.45.67.89',
        location: {
            city: 'Mumbai',
            country: 'India',
            coordinates: [72.8777, 19.0760]
        },
        metadata: {
            attemptCount: 12,
            timeWindow: '15 minutes'
        },
        status: 'ACTIVE',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
        alertType: 'IMPOSSIBLE_TRAVEL',
        title: 'IMPOSSIBLE TRAVEL',
        description: 'Login from impossible geographic location',
        severity: 'CRITICAL',
        userEmail: 'jane.doe@example.com',
        ipAddress: '89.123.45.67',
        location: {
            city: 'Dubai',
            country: 'United Arab Emirates',
            coordinates: [55.2708, 25.2048]
        },
        metadata: {
            previousLocation: {
                city: 'Toronto',
                country: 'Canada'
            },
            currentLocation: {
                city: 'Dubai',
                country: 'United Arab Emirates'
            },
            distance: 11200,
            travelTime: 2.5,
            travelSpeed: 4480
        },
        status: 'ACTIVE',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
    }
];

async function seedSecurityAlerts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aegis');
        console.log('Connected to MongoDB');

        // Clear existing alerts
        await SecurityAlert.deleteMany({});
        console.log('Cleared existing security alerts');

        // Insert sample alerts
        const inserted = await SecurityAlert.insertMany(sampleAlerts);
        console.log(`✅ Successfully seeded ${inserted.length} security alerts`);

        console.log('\nAlert Summary:');
        const summary = await SecurityAlert.aggregate([
            {
                $group: {
                    _id: '$severity',
                    count: { $sum: 1 }
                }
            }
        ]);
        summary.forEach(item => {
            console.log(`  - ${item._id}: ${item.count} alerts`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error seeding security alerts:', error);
        process.exit(1);
    }
}

seedSecurityAlerts();

