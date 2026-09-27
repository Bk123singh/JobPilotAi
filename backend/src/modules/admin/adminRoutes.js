const express = require('express');
const router = express.Router();
const adminController = require('./adminController');
const { authenticate, authorize } = require('../../middleware/authMiddleware');

// All admin routes strictly require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Platform Analytics & Metrics
router.get('/stats', adminController.getPlatformStats);

// Company Verification & Moderation
router.get('/companies', adminController.getCompanies);
router.patch('/companies/:id/verify', adminController.verifyCompany);

// Job Posting Moderation
router.get('/jobs', adminController.getJobs);
router.patch('/jobs/:id/moderate', adminController.moderateJob);

// User Management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

// System Audit Logs Stream
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
