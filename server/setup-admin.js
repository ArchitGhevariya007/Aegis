/**
 * Admin Setup Script
 * 
 * This script helps you create an admin account.
 * Run: node setup-admin.js
 */

const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

const { Admin } = require('./models/Admin');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aegis', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✓ Connected to MongoDB');

        // Get admin details
        console.log('\n=== Admin Account Setup ===\n');
        const email = await question('Enter admin email: ');
        const password = await question('Enter admin password: ');

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            console.log('\n⚠️  Admin with this email already exists!');
            const overwrite = await question('Do you want to update the password? (yes/no): ');
            
            if (overwrite.toLowerCase() === 'yes') {
                existingAdmin.password = password;
                await existingAdmin.save();
                console.log('\n✓ Admin password updated successfully!');
            } else {
                console.log('\n❌ Setup cancelled.');
            }
        } else {
            // Create new admin
            await Admin.create({ email, password });
            console.log('\n✓ Admin account created successfully!');
        }

        console.log('\nAdmin Email:', email);
        console.log('\nYou can now log in at: http://localhost:3000/login\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        rl.close();
        mongoose.disconnect();
        process.exit(0);
    }
}

setupAdmin();
