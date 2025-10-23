const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');

const authRoutes = require('./routes/auth');
const kycRoutes = require('./routes/kyc');
const aiRoutes = require('./routes/ai');
const ocrRoutes = require('./routes/ocr');
const adminRoutes = require('./routes/adminRoutes');
const securityAlertRoutes = require('./routes/securityAlertRoutes');
const roleRoutes = require('./routes/roleRoutes');
const emergencyControlRoutes = require('./routes/emergencyControlRoutes');
const locationTrackingRoutes = require('./routes/locationTrackingRoutes');
const insiderMonitoringRoutes = require('./routes/insiderMonitoringRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const votingRoutes = require('./routes/votingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/security-alerts', securityAlertRoutes);
app.use('/api/roles', roleRoutes);
// Debug middleware for emergency routes
app.use('/api/emergency', (req, res, next) => {
  // console.log('[DEBUG] Emergency route hit:', {
  //   method: req.method,
  //   path: req.path,
  //   body: req.body,
  //   headers: req.headers['content-type']
  // });
  next();
});
app.use('/api/emergency', emergencyControlRoutes);
app.use('/api/locations', locationTrackingRoutes);
app.use('/api/insider', insiderMonitoringRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/voting', votingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Import admin initialization
const { initializeAdmin } = require('./models/Admin');
const { initializeDepartments } = require('./models/Department');

// Start server after database connection
const startServer = async () => {
  try {
    // Connect to database (aegis)
    await connectDB();
    
    // Initialize admin account
    await initializeAdmin();
    
    // Initialize departments
    await initializeDepartments();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log('🚀 Aegis Server running on port', PORT);
      console.log('📡 API available at: http://localhost:' + PORT);
      console.log('📊 Database: aegis (MongoDB)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
