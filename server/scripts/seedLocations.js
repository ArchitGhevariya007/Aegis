/**
 * Seed Location Data Script
 * Creates sample login location data for testing
 * Run: node scripts/seedLocations.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const LoginLocation = require('../models/LoginLocation');
const User = require('../models/User');

// Sample locations around the world
const sampleLocations = [
    {
        city: 'Melbourne',
        region: 'Victoria',
        country: 'Australia',
        countryCode: 'AU',
        coordinates: [144.9631, -37.8136], // [longitude, latitude]
        timezone: 'Australia/Melbourne',
        count: 15
    },
    {
        city: 'Sydney',
        region: 'New South Wales',
        country: 'Australia',
        countryCode: 'AU',
        coordinates: [151.2093, -33.8688],
        timezone: 'Australia/Sydney',
        count: 12
    },
    {
        city: 'London',
        region: 'England',
        country: 'United Kingdom',
        countryCode: 'GB',
        coordinates: [-0.1276, 51.5074],
        timezone: 'Europe/London',
        count: 8
    },
    {
        city: 'New York',
        region: 'New York',
        country: 'United States',
        countryCode: 'US',
        coordinates: [-74.0060, 40.7128],
        timezone: 'America/New_York',
        count: 20
    },
    {
        city: 'Tokyo',
        region: 'Tokyo',
        country: 'Japan',
        countryCode: 'JP',
        coordinates: [139.6917, 35.6895],
        timezone: 'Asia/Tokyo',
        count: 10
    },
    {
        city: 'Singapore',
        region: 'Singapore',
        country: 'Singapore',
        countryCode: 'SG',
        coordinates: [103.8198, 1.3521],
        timezone: 'Asia/Singapore',
        count: 7
    },
    {
        city: 'Dubai',
        region: 'Dubai',
        country: 'United Arab Emirates',
        countryCode: 'AE',
        coordinates: [55.2708, 25.2048],
        timezone: 'Asia/Dubai',
        count: 5
    },
    {
        city: 'Paris',
        region: 'Île-de-France',
        country: 'France',
        countryCode: 'FR',
        coordinates: [2.3522, 48.8566],
        timezone: 'Europe/Paris',
        count: 9
    },
    {
        city: 'Toronto',
        region: 'Ontario',
        country: 'Canada',
        countryCode: 'CA',
        coordinates: [-79.3832, 43.6532],
        timezone: 'America/Toronto',
        count: 6
    },
    {
        city: 'Mumbai',
        region: 'Maharashtra',
        country: 'India',
        countryCode: 'IN',
        coordinates: [72.8777, 19.0760],
        timezone: 'Asia/Kolkata',
        count: 11
    },
    {
        city: 'Berlin',
        region: 'Berlin',
        country: 'Germany',
        countryCode: 'DE',
        coordinates: [13.4050, 52.5200],
        timezone: 'Europe/Berlin',
        count: 4
    },
    {
        city: 'São Paulo',
        region: 'São Paulo',
        country: 'Brazil',
        countryCode: 'BR',
        coordinates: [-46.6333, -23.5505],
        timezone: 'America/Sao_Paulo',
        count: 3
    }
];

async function seedLocations() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aegis');
        console.log('✓ Connected to MongoDB');

        // Get a user to associate locations with (or create a dummy one)
        let user = await User.findOne();
        if (!user) {
            console.log('⚠️  No users found. Please create a user first or locations will be created without userId.');
        }

        console.log('\n🌍 Creating sample location data...\n');

        let totalCreated = 0;

        for (const loc of sampleLocations) {
            // Create multiple login records for each location
            for (let i = 0; i < loc.count; i++) {
                const loginLocation = await LoginLocation.create({
                    userId: user ? user._id : new mongoose.Types.ObjectId(),
                    location: {
                        type: 'Point',
                        coordinates: loc.coordinates
                    },
                    ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                    deviceInfo: {
                        type: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
                        os: ['Windows', 'macOS', 'Linux', 'Android', 'iOS'][Math.floor(Math.random() * 5)],
                        device: ['Desktop', 'Mobile', 'Tablet'][Math.floor(Math.random() * 3)]
                    },
                    city: loc.city,
                    region: loc.region,
                    country: loc.country,
                    countryCode: loc.countryCode,
                    timezone: loc.timezone,
                    status: 'success',
                    loginType: Math.random() > 0.3 ? 'login' : 'register',
                    loginTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random time in last 30 days
                });

                totalCreated++;
            }

            console.log(`✓ Created ${loc.count} logins for ${loc.city}, ${loc.country}`);
        }

        console.log(`\n🎉 Successfully created ${totalCreated} location records!`);
        console.log('\n📊 Summary:');
        console.log(`   - Total locations: ${sampleLocations.length} cities`);
        console.log(`   - Total login records: ${totalCreated}`);
        console.log('\n✨ Now check your Admin Dashboard → Location Map tab!');

    } catch (error) {
        console.error('❌ Error seeding locations:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
        process.exit(0);
    }
}

// Run the seeding
seedLocations();

