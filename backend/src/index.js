require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { logger } = require('./utils/logger');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const departmentRoutes = require('./routes/department.routes');
const designationRoutes = require('./routes/designation.routes');
const leavePolicyRoutes = require('./routes/leavePolicy.routes');
const payrollRoutes = require('./routes/payroll.routes');
const holidayRoutes = require('./routes/holiday.routes');
const reportsRoutes = require('./routes/reports.routes');
const auditRoutes = require('./routes/audit.routes');
const companyRoutes = require('./routes/company.routes');
const lifecycleRoutes = require('./routes/lifecycle.routes');
const employeeRoutes = require('./routes/employee.routes');

const app = express();
const PORT = process.env.PORT || 8001;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin/users', userRoutes);
app.use('/api/v1/admin/departments', departmentRoutes);
app.use('/api/v1/admin/designations', designationRoutes);
app.use('/api/v1/admin/leave-policy', leavePolicyRoutes);
app.use('/api/v1/admin/payroll', payrollRoutes);
app.use('/api/v1/admin/holidays', holidayRoutes);
app.use('/api/v1/admin/reports', reportsRoutes);
app.use('/api/v1/admin/audit', auditRoutes);
app.use('/api/v1/admin/company', companyRoutes);
app.use('/api/v1/admin/lifecycle', lifecycleRoutes);
app.use('/api/v1/employee', employeeRoutes);

// Error Handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Prakura HRMS Backend running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
