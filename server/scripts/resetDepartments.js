const mongoose = require('mongoose');
const { Department, initializeDepartments } = require('../models/Department');
require('dotenv').config();

const resetDepartments = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aegis');
        console.log('Connected to database');

        // Delete all existing departments
        const deleteResult = await Department.deleteMany({});
        console.log(`Deleted ${deleteResult.deletedCount} departments`);

        // Reinitialize with new structure
        await initializeDepartments();
        console.log('Departments reinitialized with new structure');

        process.exit(0);
    } catch (error) {
        console.error('Error resetting departments:', error);
        process.exit(1);
    }
};

resetDepartments();

