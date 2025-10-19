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
    const domains = ['@immi.com', '@income.com', '@medical.com'];
    return domains.some(domain => email.endsWith(domain));
};

// Helper function to get department type from email
const getDepartmentType = (email) => {
    if (email.endsWith('@immi.com')) return 'Immigration Department';
    if (email.endsWith('@income.com')) return 'Income Tax Department';
    if (email.endsWith('@medical.com')) return 'Medical Department';
    return null;
};

// Department Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!isDepartmentEmail(email)) {
            return res.status(401).json({
                success: false,
                message: 'Invalid department credentials'
            });
        }

        const department = await Department.findOne({ email });
        if (!department) {
            return res.status(401).json({
                success: false,
                message: 'Invalid department credentials'
            });
        }

        const isMatch = await department.comparePassword(password);
        if (!isMatch) {
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
        console.error('Department login error:', error);
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

        // Extract OCR data from first ID document if available
        const idDocument = user.documents.find(doc => 
            doc.type === 'id_document' || doc.type === 'id_card' || doc.type === 'passport'
        );
        const ocrData = idDocument?.ocrData || {};

        // Filter user data based on department permissions
        const allowedData = {};
        
        console.log(`[Department] Fetching user details for department: ${department.name}`);
        console.log(`[Department] Department has ${department.permissions.length} permission categories`);
        console.log(`[Department] OCR Data available:`, ocrData);
        
        department.permissions.forEach(category => {
            // Only process Basic Information category, skip Document Access
            if (category.category !== 'Basic Information') {
                return;
            }
            
            console.log(`[Department] Category: ${category.category}, Fields: ${category.fields.length}`);
            category.fields.forEach(field => {
                if (field.enabled) {
                    console.log(`[Department] Enabled field: ${field.name}`);
                    
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
                    console.log(`[Department] Added ${field.name}: ${value || 'null'}`);
                }
            });
        });

        console.log(`[Department] Returning ${Object.keys(allowedData).length} fields`);

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

        console.log('[Department] Toggle field request:', { 
            departmentId: req.params.id, 
            categoryIndex, 
            fieldIndex, 
            enabled 
        });

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

        console.log('[Department] Field toggled successfully');

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

        console.log('[Department] Toggle category request:', { 
            departmentId: req.params.id, 
            categoryIndex, 
            enabled,
            bodyType: typeof req.body,
            body: req.body
        });

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

        console.log('[Department] Category toggled successfully');

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

module.exports = router;