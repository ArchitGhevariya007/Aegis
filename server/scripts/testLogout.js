const mongoose = require('mongoose');
require('dotenv').config();
const LoginLocation = require('../models/LoginLocation');

async function testLogout() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aegis');
        console.log('✅ Connected to MongoDB\n');

        // Check active sessions
        const activeSessions = await LoginLocation.find({ isActive: true }).sort({ loginTime: -1 });
        console.log(`🟢 Active Sessions: ${activeSessions.length}`);
        activeSessions.forEach((session, index) => {
            console.log(`   ${index + 1}. ${session.userEmail || session.userId}`);
            console.log(`      City: ${session.city}, ${session.country}`);
            console.log(`      SessionID: ${session.sessionId}`);
            console.log(`      Login Time: ${session.loginTime}`);
            console.log(`      Last Activity: ${session.lastActivity}`);
            console.log('');
        });

        // Check inactive sessions
        const inactiveSessions = await LoginLocation.find({ isActive: false }).sort({ logoutTime: -1 }).limit(5);
        console.log(`\n⚫ Recently Inactive Sessions: ${inactiveSessions.length > 5 ? '5 (showing latest)' : inactiveSessions.length}`);
        inactiveSessions.forEach((session, index) => {
            console.log(`   ${index + 1}. ${session.userEmail || session.userId}`);
            console.log(`      City: ${session.city}, ${session.country}`);
            console.log(`      Logout Time: ${session.logoutTime || 'Not set'}`);
            console.log('');
        });

        // Show total counts
        const totalActive = await LoginLocation.countDocuments({ isActive: true });
        const totalInactive = await LoginLocation.countDocuments({ isActive: false });
        
        console.log('\n📊 Summary:');
        console.log(`   🟢 Active: ${totalActive}`);
        console.log(`   ⚫ Inactive: ${totalInactive}`);
        console.log(`   📍 Total: ${totalActive + totalInactive}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testLogout();

