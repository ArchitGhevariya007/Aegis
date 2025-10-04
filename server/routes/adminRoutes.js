const express = require('express');
const router = express.Router();
const { Admin } = require('../models/Admin');
const adminAuth = require('../middleware/adminAuth');

// Check if email is admin (for unified login)
router.post('/check', async (req, res) => {
    try {
        const { email } = req.body;
        const admin = await Admin.findOne({ email });
        res.json({ isAdmin: !!admin });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login and location if provided
        admin.lastLogin = new Date();
        if (req.body.location) {
            admin.loginLocation = {
                type: 'Point',
                coordinates: [req.body.location.longitude, req.body.location.latitude]
            };
        }
        await admin.save();

        const token = admin.generateAuthToken();
        res.json({ 
            success: true,
            token,
            user: {
                email: admin.email,
                role: 'admin'
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get admin profile
router.get('/profile', adminAuth, async (req, res) => {
    try {
        const admin = req.admin;
        res.json({
            email: admin.email,
            lastLogin: admin.lastLogin,
            loginLocation: admin.loginLocation
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Change admin password
router.post('/change-password', adminAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const isMatch = await req.admin.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        req.admin.password = newPassword;
        await req.admin.save();
        
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
