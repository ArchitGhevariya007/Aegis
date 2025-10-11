const express = require('express');
const router = express.Router();
const { Department } = require('../models/Department');
const adminAuth = require('../middleware/adminAuth');

// Get all departments with their permissions
router.get('/', adminAuth, async (req, res) => {
    try {
        const departments = await Department.find({ isActive: true })
            .select('-__v')
            .sort({ name: 1 });

        res.json({
            success: true,
            departments
        });
    } catch (error) {
        console.error('[DEPARTMENTS] Fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// Get single department by ID
router.get('/:id', adminAuth, async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }

        res.json({
            success: true,
            department
        });
    } catch (error) {
        console.error('[DEPARTMENTS] Fetch single error:', error);
        res.status(500).json({ error: 'Failed to fetch department' });
    }
});

// Update department permissions
router.put('/:id/permissions', adminAuth, async (req, res) => {
    try {
        const { permissions } = req.body;

        const department = await Department.findByIdAndUpdate(
            req.params.id,
            {
                permissions,
                updatedBy: req.admin._id,
                lastModified: new Date()
            },
            { new: true }
        );

        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }

        console.log(`[DEPARTMENTS] Permissions updated for ${department.name} by ${req.admin.email}`);

        res.json({
            success: true,
            message: 'Permissions updated successfully',
            department
        });
    } catch (error) {
        console.error('[DEPARTMENTS] Update error:', error);
        res.status(500).json({ error: 'Failed to update permissions' });
    }
});

// Toggle specific permission field
router.patch('/:id/permissions/toggle', adminAuth, async (req, res) => {
    try {
        const { categoryIndex, fieldIndex, enabled } = req.body;

        console.log(`[DEPARTMENTS] Toggle field request:`, { 
            departmentId: req.params.id, 
            categoryIndex, 
            fieldIndex,
            enabled 
        });

        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }

        // Validate indices
        if (!department.permissions || !department.permissions[categoryIndex]) {
            console.error(`[DEPARTMENTS] Invalid categoryIndex: ${categoryIndex}`);
            return res.status(400).json({ error: 'Invalid category index' });
        }

        if (!department.permissions[categoryIndex].fields || !department.permissions[categoryIndex].fields[fieldIndex]) {
            console.error(`[DEPARTMENTS] Invalid fieldIndex: ${fieldIndex}`);
            return res.status(400).json({ error: 'Invalid field index' });
        }

        // Update specific field
        department.permissions[categoryIndex].fields[fieldIndex].enabled = enabled;
        department.updatedBy = req.admin._id;
        department.lastModified = new Date();

        await department.save();

        console.log(`[DEPARTMENTS] Permission toggled for ${department.name}, category ${categoryIndex}, field ${fieldIndex}`);

        res.json({
            success: true,
            message: 'Permission toggled successfully',
            department
        });
    } catch (error) {
        console.error('[DEPARTMENTS] Toggle error:', error);
        res.status(500).json({ error: 'Failed to toggle permission', message: error.message });
    }
});

// Enable/Disable entire category
router.patch('/:id/permissions/category', adminAuth, async (req, res) => {
    try {
        const { categoryIndex, enabled } = req.body;

        console.log(`[DEPARTMENTS] Toggle category request:`, { 
            departmentId: req.params.id, 
            categoryIndex, 
            enabled 
        });

        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }

        // Validate categoryIndex
        if (!department.permissions || !department.permissions[categoryIndex]) {
            console.error(`[DEPARTMENTS] Invalid categoryIndex: ${categoryIndex}, total categories: ${department.permissions?.length || 0}`);
            return res.status(400).json({ error: 'Invalid category index' });
        }

        // Update all fields in category
        if (department.permissions[categoryIndex].fields && Array.isArray(department.permissions[categoryIndex].fields)) {
            department.permissions[categoryIndex].fields.forEach(field => {
                field.enabled = enabled;
            });
        } else {
            console.error(`[DEPARTMENTS] No fields found in category ${categoryIndex}`);
            return res.status(400).json({ error: 'No fields found in category' });
        }

        department.updatedBy = req.admin._id;
        department.lastModified = new Date();

        await department.save();

        console.log(`[DEPARTMENTS] Category permissions updated for ${department.name}, category ${categoryIndex}`);

        res.json({
            success: true,
            message: 'Category permissions updated successfully',
            department
        });
    } catch (error) {
        console.error('[DEPARTMENTS] Category update error:', error);
        res.status(500).json({ error: 'Failed to update category permissions', message: error.message });
    }
});

// Get permissions summary (for analytics)
router.get('/:id/summary', adminAuth, async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }

        const summary = {
            departmentName: department.name,
            totalCategories: department.permissions.length,
            totalFields: 0,
            enabledFields: 0,
            disabledFields: 0,
            categorySummary: []
        };

        department.permissions.forEach(category => {
            const enabled = category.fields.filter(f => f.enabled).length;
            const total = category.fields.length;

            summary.totalFields += total;
            summary.enabledFields += enabled;
            summary.disabledFields += (total - enabled);

            summary.categorySummary.push({
                category: category.category,
                total,
                enabled,
                disabled: total - enabled,
                percentage: Math.round((enabled / total) * 100)
            });
        });

        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('[DEPARTMENTS] Summary error:', error);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
});

module.exports = router;

