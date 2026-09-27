const express = require('express');
const router = express.Router();
const applicationController = require('./applicationController');
const { authenticate, authorize } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validateMiddleware');
const { applyJobSchema, updateStatusSchema } = require('./applicationValidators');

// 1. Candidate Application Endpoints
router.post(
  '/jobs/:jobId',
  authenticate,
  authorize('JOB_SEEKER'),
  validate({ body: applyJobSchema }),
  applicationController.applyForJob
);

router.get(
  '/me',
  authenticate,
  authorize('JOB_SEEKER'),
  applicationController.getMyApplications
);

router.post(
  '/:id/withdraw',
  authenticate,
  authorize('JOB_SEEKER'),
  applicationController.withdrawApplication
);

// 2. Recruiter Application Management Endpoints
router.get(
  '/recruiter',
  authenticate,
  authorize('RECRUITER', 'ADMIN'),
  applicationController.getRecruiterApplications
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('RECRUITER', 'ADMIN'),
  validate({ body: updateStatusSchema }),
  applicationController.updateApplicationStatus
);

// 3. Application Details (Candidate or Recruiter)
router.get(
  '/:id',
  authenticate,
  applicationController.getApplicationDetail
);

module.exports = router;
