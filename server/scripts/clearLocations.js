/**
 * Clear Location Data Script
 * Removes all login location data
 * Run: node scripts/clearLocations.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const LoginLocation = require('../models/LoginLocation');

async function clearLocations() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aegis');
        console.log('✓ Connected to MongoDB');

        // Count existing records
        const count = await LoginLocation.countDocuments();
        console.log(`\n📊 Found ${count} login location records`);

        if (count === 0) {
            console.log('✨ No location data to clear!');
        } else {
            // Ask for confirmation
            console.log('\n⚠️  This will delete all location data!');
            
            // Delete all
            await LoginLocation.deleteMany({});
            console.log(`\n✅ Successfully deleted ${count} location records`);
        }

    } catch (error) {
        console.error('❌ Error clearing locations:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
        process.exit(0);
    }
}

clearLocations();

