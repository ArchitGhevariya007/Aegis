const jwt = require('jsonwebtoken');
const { Department } = require('../models/Department');

const departmentAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const department = await Department.findOne({
            _id: decoded.departmentId
        });

        if (!department) {
            return res.status(401).json({
                success: false,
                message: 'Department not found'
            });
        }

        req.department = department;
        next();
    } catch (error) {
        console.error('Department auth error:', error);
        res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

module.exports = departmentAuth;
