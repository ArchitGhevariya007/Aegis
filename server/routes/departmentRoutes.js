const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const User = require('../models/User');
const { Department } = require('../models/Department');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const departmentAuth = require('../middleware/departmentAuth');
const blockchainService = require('../services/blockchainService');

const router = express.Router();

// Helper function to get content type from filename
const getContentType = (fileName) => {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.txt': 'text/plain',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return mimeTypes[ext] || 'application/octet-stream';
};

// Helper function to check department email
const isDepartmentEmail = (email) => {
    // Allow any email format for departments (no domain restriction)
    return email && email.includes('@');
};

// Helper function to get department type from email
const getDepartmentType = (email) => {
    // No longer restricted to specific domains
    return null;
};

// Department Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // console.log('[DEPT LOGIN] Login attempt:', { email });

        if (!isDepartmentEmail(email)) {
            // console.log('[DEPT LOGIN] Invalid email format:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid department credentials'
            });
        }

        const department = await Department.findOne({ email });
        if (!department) {
            // console.log('[DEPT LOGIN] Department not found:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid department credentials'
            });
        }

        // console.log('[DEPT LOGIN] Department found:', { name: department.name, email: department.email });

        const isMatch = await department.comparePassword(password);
        // console.log('[DEPT LOGIN] Password comparison result:', isMatch);
        
        if (!isMatch) {
            // console.log('[DEPT LOGIN] Password mismatch for:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid department credentials'
            });
        }

        const token = jwt.sign(
            { departmentId: department._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Update last login
        department.lastLogin = new Date();
        await department.save();

        // console.log('[DEPT LOGIN] Login successful for:', email);

        res.json({
            success: true,
            token,
            user: {
                role: 'department',
                name: department.name,
                email: department.email,
                departmentId: department._id
            }
        });
    } catch (error) {
        console.error('[DEPT LOGIN] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// Get Department Info
router.get('/info', departmentAuth, async (req, res) => {
    try {
        const department = req.department;
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        res.json({
            success: true,
            name: department.name,
            code: department.code,
            description: department.description,
            permissions: department.permissions
        });
    } catch (error) {
        console.error('Department info fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch department info'
        });
    }
});

// Search Users
router.get('/search-users', departmentAuth, async (req, res) => {
    try {
        const { query } = req.query;
        const users = await User.find({
            $or: [
                { email: { $regex: query, $options: 'i' } },
                { 'documents.fileName': { $regex: query, $options: 'i' } }
            ]
        }).select('email documents');

        res.json({
            success: true,
            users: users.map(user => ({
                _id: user._id,
                email: user.email
            }))
        });
    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed'
        });
    }
});

// Get User Details
router.get('/user-details/:userId', departmentAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const department = req.department;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Extract OCR data from any document that has it
        let ocrData = {};
        let idDocument = user.documents.find(doc => 
            doc.ocrData && Object.keys(doc.ocrData).length > 0
        );
        
        if (idDocument && idDocument.ocrData) {
            ocrData = idDocument.ocrData;
        }

        // Filter user data based on department permissions
        const allowedData = {};
        
        // console.log(`\n========== DEPARTMENT USER DETAILS ==========`);
        // console.log(`[Department] Fetching user details for department: ${department.name}`);
        // console.log(`[Department] User email: ${user.email}`);
        // console.log(`[Department] User has ${user.documents.length} documents`);

        user.documents.forEach((doc, idx) => {
            // console.log(`[Department] Document ${idx}: type=${doc.type}, fileName=${doc.fileName}`);
            if (doc.type === 'id_document' && doc.ocrData) {
                // console.log(`[Department]   OCR Data: name=${doc.ocrData.name}, dob=${doc.ocrData.dob}, address=${doc.ocrData.address}`);
                idDocument = doc;
            }
        });

        // console.log(`[Department] ID Document found:`, !!idDocument);
        // console.log(`[Department] OCR Data:`, JSON.stringify(ocrData, null, 2));
        // console.log(`[Department] User birthDate:`, user.birthDate);
        // console.log(`[Department] User residency:`, user.residency);
        // console.log(`[Department] User phoneNumber:`, user.phoneNumber);
        // console.log(`[Department] Department has ${department.permissions.length} permission categories`);
        // console.log(`=============================================\n`);
        
        department.permissions.forEach(category => {
            // Only process Basic Information category, skip Document Access
            if (category.category !== 'Basic Information') {
                return;
            }
            
            // console.log(`[Department] Category: ${category.category}, Fields: ${category.fields.length}`);
            category.fields.forEach(field => {
                if (field.enabled) {
                    // console.log(`[Department] Enabled field: ${field.name}`);
                    
                    let value = null;
                    
                    // Map field names to user data sources
                    switch(field.name) {
                        case 'Full Name':
                            value = ocrData.name || user.name || null;
                            break;
                        case 'Email':
                            value = user.email;
                            break;
                        case 'Date of Birth':
                            value = ocrData.dob || user.birthDate || null;
                            if (value) {
                                value = new Date(value).toLocaleDateString();
                            }
                            break;
                        case 'Phone Number':
                            value = user.phoneNumber || null;
                            break;
                        case 'Current Address':
                            value = ocrData.address || user.address || null;
                            break;
                        case 'Age':
                            if (ocrData.dob || user.birthDate) {
                                const birthDate = new Date(ocrData.dob || user.birthDate);
                                const today = new Date();
                                let age = today.getFullYear() - birthDate.getFullYear();
                                const monthDiff = today.getMonth() - birthDate.getMonth();
                                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                    age--;
                                }
                                value = age;
                            }
                            break;
                        case 'Blood Type':
                            value = user.bloodType || null;
                            break;
                        case 'Nationality':
                            value = user.residency || user.nationality || null;
                            break;
                        case 'Place of Birth':
                            value = user.placeOfBirth || null;
                            break;
                        default:
                            value = null;
                    }
                    
                    allowedData[field.name] = value;
                    // console.log(`[Department] Added ${field.name}: ${value || 'null'}`);
                }
            });
        });

        // console.log(`[Department] Returning ${Object.keys(allowedData).length} fields`);

        res.json({
            success: true,
            user: allowedData
        });
    } catch (error) {
        console.error('User details fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user details'
        });
    }
});

// Get User Documents
router.get('/user-documents/:userId', departmentAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const department = req.department;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get allowed document types from permissions
        const allowedDocTypes = [];
        department.permissions.forEach(category => {
            if (category.category === 'Document Access') {
                category.fields.forEach(field => {
                    if (field.enabled) {
                        allowedDocTypes.push(field.name);
                    }
                });
            }
        });

        // Filter documents based on department permissions
        const allowedDocuments = user.documents.filter(doc => {
            return allowedDocTypes.includes(doc.documentCategory);
        });

        res.json({
            success: true,
            documents: allowedDocuments
        });
    } catch (error) {
        console.error('User documents fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user documents'
        });
    }
});

// View Document
router.get('/view-document/:documentId', departmentAuth, async (req, res) => {
    try {
        const { documentId } = req.params;
        const department = req.department;
        const user = await User.findOne({ 'documents._id': documentId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        const document = user.documents.id(documentId);
        
        // Get allowed document types from permissions
        const allowedDocTypes = [];
        department.permissions.forEach(category => {
            if (category.category === 'Document Access') {
                category.fields.forEach(field => {
                    if (field.enabled) {
                        allowedDocTypes.push(field.name);
                    }
                });
            }
        });

        // Check if department has permission to view this document type
        if (!allowedDocTypes.includes(document.documentCategory)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if file exists locally
        if (document.filePath && fs.existsSync(document.filePath)) {
            // Set content type header before sending
            const contentType = getContentType(document.fileName);
            res.setHeader('Content-Type', contentType);
            return res.download(document.filePath, document.fileName);
        }

        // If local file doesn't exist, try to fetch from IPFS/blockchain
        const blockchainData = document.blockchainData;
        const ipfsHash = blockchainData?.ipfsHash || document.ipfsHash;
        
        if (ipfsHash) {
            try {
                console.log(`[Department] Local file not found, fetching from IPFS: ${ipfsHash}`);
                
                // Get encryption details
                const encryptionKey = blockchainData?.encryptionKey;
                const encryptionIV = blockchainData?.encryptionIV;
                
                if (!encryptionKey || !encryptionIV) {
                    console.error('[Department] Missing encryption details');
                    return res.status(404).json({
                        success: false,
                        message: 'Document encryption details not found. Cannot decrypt document.'
                    });
                }
                
                // Use blockchain service to retrieve and decrypt document
                const result = await blockchainService.retrieveDocumentFromIPFS(
                    ipfsHash,
                    encryptionKey,
                    encryptionIV,
                    user.email // Use user email as address
                );

                // Determine content type from filename
                const contentType = getContentType(document.fileName);

                // Set appropriate headers
                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
                
                // Send the decrypted file data
                return res.send(result.documentBuffer);
            } catch (ipfsError) {
                console.error('[Department] Failed to fetch/decrypt from IPFS:', ipfsError.message);
                return res.status(404).json({
                    success: false,
                    message: 'Document not available. Local file not found and IPFS fetch/decryption failed.',
                    details: ipfsError.message
                });
            }
        }

        // No local file and no IPFS hash
        return res.status(404).json({
            success: false,
            message: 'Document not available. No local file or blockchain reference found.',
            documentInfo: {
                fileName: document.fileName,
                hasFilePath: !!document.filePath,
                fileExists: document.filePath ? fs.existsSync(document.filePath) : false,
                hasBlockchainData: !!document.blockchainData,
                hasIpfsHash: !!(document.blockchainData?.ipfsHash || document.ipfsHash)
            }
        });

    } catch (error) {
        console.error('Document view error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to view document'
        });
    }
});

// ============================================
// ADMIN ENDPOINTS - Department Management
// ============================================

// Get all departments (for admin)
router.get('/admin/all', adminAuth, async (req, res) => {
    try {
        const departments = await Department.find({});
        
        res.json({
            success: true,
            departments
        });
    } catch (error) {
        console.error('Failed to fetch departments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch departments'
        });
    }
});

// Get department by ID (for admin)
router.get('/admin/:id', adminAuth, async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }
        res.json({
            success: true,
            department
        });
    } catch (error) {
        console.error('Failed to fetch department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch department'
        });
    }
});

// Update department permissions (for admin)
router.put('/admin/:id/permissions', adminAuth, async (req, res) => {
    try {
        const { permissions } = req.body;
        const department = await Department.findByIdAndUpdate(
            req.params.id,
            { permissions },
            { new: true, runValidators: true }
        );

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        res.json({
            success: true,
            message: 'Permissions updated successfully',
            department
        });
    } catch (error) {
        console.error('Failed to update permissions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update permissions'
        });
    }
});

// Toggle specific field permission (for admin)
router.patch('/admin/:id/toggle-field', adminAuth, async (req, res) => {
    try {
        const { categoryIndex, fieldIndex, enabled } = req.body;

        // console.log('[Department] Toggle field request:', { 
        //     departmentId: req.params.id, 
        //     categoryIndex, 
        //     fieldIndex, 
        //     enabled 
        // });

        // Validate inputs
        if (typeof categoryIndex !== 'number' || typeof fieldIndex !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Invalid indices provided'
            });
        }

        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        // Validate category index
        if (categoryIndex < 0 || categoryIndex >= department.permissions.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category index'
            });
        }

        // Validate field index
        const category = department.permissions[categoryIndex];
        if (!category || !category.fields || fieldIndex < 0 || fieldIndex >= category.fields.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid field index'
            });
        }

        // Update the field
        department.permissions[categoryIndex].fields[fieldIndex].enabled = enabled;
        await department.save();

        // console.log('[Department] Field toggled successfully');

        res.json({
            success: true,
            message: 'Field permission updated',
            department
        });
    } catch (error) {
        console.error('Failed to toggle field:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle field permission'
        });
    }
});

// Toggle entire category (for admin)
router.patch('/admin/:id/toggle-category', adminAuth, async (req, res) => {
    try {
        const { categoryIndex, enabled } = req.body;

        // console.log('[Department] Toggle category request:', { 
        //     departmentId: req.params.id, 
        //     categoryIndex, 
        //     enabled,
        //     bodyType: typeof req.body,
        //     body: req.body
        // });

        // Validate inputs
        if (typeof categoryIndex !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Invalid category index provided'
            });
        }

        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        // Validate category index
        if (categoryIndex < 0 || categoryIndex >= department.permissions.length) {
            return res.status(400).json({
                success: false,
                message: `Invalid category index: ${categoryIndex}`
            });
        }

        const category = department.permissions[categoryIndex];
        if (!category || !category.fields) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category structure'
            });
        }

        // Update all fields in the category
        category.fields.forEach(field => {
            field.enabled = enabled;
        });

        await department.save();

        // console.log('[Department] Category toggled successfully');

        res.json({
            success: true,
            message: 'Category permissions updated',
            department
        });
    } catch (error) {
        console.error('Failed to toggle category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle category permissions'
        });
    }
});

// Get department summary (for admin dashboard)
router.get('/admin/summary/all', adminAuth, async (req, res) => {
    try {
        const departments = await Department.find({});
        const summary = departments.map(dept => {
            const totalFields = dept.permissions.reduce((sum, cat) => sum + cat.fields.length, 0);
            const enabledFields = dept.permissions.reduce((sum, cat) => 
                sum + cat.fields.filter(f => f.enabled).length, 0
            );

            return {
                id: dept._id,
                name: dept.name,
                code: dept.code,
                totalFields,
                enabledFields,
                accessRate: totalFields > 0 ? Math.round((enabledFields / totalFields) * 100) : 0
            };
        });

        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('Failed to fetch department summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch department summary'
        });
    }
});

// Create new department (for admin)
router.post('/admin/create', adminAuth, async (req, res) => {
    try {
        const { name, code, email, password, description } = req.body;

        // Validate required fields
        if (!name || !code || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Department name, code, email, and password are required'
            });
        }

        // Check if department already exists
        const existing = await Department.findOne({ 
            $or: [{ name }, { code }, { email }] 
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Department with this name, code, or email already exists'
            });
        }

        // Default permissions structure
        const defaultPermissions = [
            {
                category: 'Basic Information',
                fields: [
                    { name: 'Full Name', enabled: true },
                    { name: 'Email', enabled: true },
                    { name: 'Date of Birth', enabled: true },
                    { name: 'Phone Number', enabled: false },
                    { name: 'Current Address', enabled: false },
                    { name: 'Age', enabled: false },
                    { name: 'Blood Type', enabled: false },
                    { name: 'Nationality', enabled: false },
                    { name: 'Place of Birth', enabled: false }
                ]
            },
            {
                category: 'Document Access',
                fields: [
                    { name: 'Medical History', enabled: false },
                    { name: 'Insurance Policy', enabled: false },
                    { name: 'Tax Returns', enabled: false },
                    { name: 'Payslips', enabled: false },
                    { name: 'Passport', enabled: false },
                    { name: 'Visa', enabled: false },
                    { name: 'Criminal History', enabled: false },
                    { name: 'Work Permit', enabled: false }
                ]
            }
        ];

        const newDepartment = new Department({
            name,
            code,
            email,
            password,
            description: description || '',
            permissions: defaultPermissions,
            isActive: true
        });

        await newDepartment.save();

        // console.log(`[DEPARTMENTS] New department created: ${name}`);

        res.status(201).json({
            success: true,
            message: 'Department created successfully',
            department: {
                id: newDepartment._id,
                name: newDepartment.name,
                code: newDepartment.code,
                email: newDepartment.email,
                password: password  // Return plaintext only in creation response
            }
        });
    } catch (error) {
        console.error('Failed to create department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create department',
            error: error.message
        });
    }
});

// Reset department password (for admin)
router.post('/admin/:id/reset-password', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const department = await Department.findById(id);

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        // Generate a random password
        const newPassword = Math.random().toString(36).slice(-12) + 'A1!';

        department.password = newPassword;
        await department.save();

        // console.log(`[DEPARTMENTS] Password reset for: ${department.name}`);

        res.json({
            success: true,
            message: 'Password reset successfully',
            password: newPassword  // Return plaintext only in response
        });
    } catch (error) {
        console.error('Failed to reset password:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password',
            error: error.message
        });
    }
});

// Get decrypted password for display (admin only)
router.post('/admin/:id/get-password', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const department = await Department.findById(id);

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        // For security, we can't decrypt bcrypt hashes, but we can show that password verification works
        // Instead, we return a message that the password must be reset if forgotten
        res.json({
            success: true,
            message: 'Password stored securely as hash. Use reset function to generate a new password.',
            department: {
                id: department._id,
                name: department.name,
                email: department.email,
                passwordHashed: true
            }
        });
    } catch (error) {
        console.error('Failed to get password:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get password'
        });
    }
});

// Delete department (admin only)
router.delete('/admin/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const department = await Department.findByIdAndDelete(id);

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        // console.log(`[DEPARTMENTS] Department deleted: ${department.name} (ID: ${id})`);

        res.json({
            success: true,
            message: `Department "${department.name}" has been deleted successfully`,
            department: {
                id: department._id,
                name: department.name
            }
        });
    } catch (error) {
        console.error('Failed to delete department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete department',
            error: error.message
        });
    }
});

module.exports = router;