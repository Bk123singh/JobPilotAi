const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const env = require('./config/env');
const { connectDB, prisma } = require('./config/db');
const logger = require('./utils/logger');
const { configureSecurity } = require('./middleware/securityMiddleware');
const { errorMiddleware, notFoundHandler } = require('./middleware/errorMiddleware');

// Import Module Routes
const healthRoutes = require('./modules/health/healthRoutes');
const authRoutes = require('./modules/auth/authRoutes');
const profileRoutes = require('./modules/profiles/profileRoutes');
const resumeRoutes = require('./modules/resumes/resumeRoutes');
const companyRoutes = require('./modules/companies/companyRoutes');
const jobRoutes = require('./modules/jobs/jobRoutes');
const applicationRoutes = require('./modules/applications/applicationRoutes');
const notificationRoutes = require('./modules/notifications/notificationRoutes');
const interviewRoutes = require('./modules/interviews/interviewRoutes');
const alertRoutes = require('./modules/alerts/alertRoutes');
const adminRoutes = require('./modules/admin/adminRoutes');

const app = express();

// 1. Security Headers, CORS & Rate Limiting
configureSecurity(app);

// 2. Request Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 3. HTTP Request Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 4. API Routes Mounting (/api/v1)
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/resumes', resumeRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/interviews', interviewRoutes);
app.use('/api/v1/job-alerts', alertRoutes);
app.use('/api/v1/admin', adminRoutes);

// Root route for general info
app.get('/', (req, res) => {
  res.json({
    name: 'JobPilot AI API',
    version: '1.0.0',
    documentation: '/api/v1/health',
    status: 'Operational',
  });
});

// 5. 404 & Error Handling Middleware
app.use(notFoundHandler);
app.use(errorMiddleware);

// 6. Start Server
const PORT = env.PORT;
let server;

const startServer = async () => {
  await connectDB();

  server = app.listen(PORT, () => {
    logger.info(`JobPilot AI backend running on port ${PORT} in [${env.NODE_ENV}] mode`);
    logger.info(`API Base URL: http://localhost:${PORT}/api/v1`);
  });
};

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Gracefully shutting down...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      if (prisma) {
        await prisma.$disconnect();
        logger.info('Database disconnected.');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

module.exports = app;
