const express = require('express');
const router = express.Router();
const interviewController = require('./interviewController');
const { authenticate, authorize } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validateMiddleware');
const { scheduleInterviewSchema, updateInterviewSchema } = require('./interviewValidators');

router.use(authenticate);

router.post(
  '/',
  authorize('RECRUITER', 'ADMIN'),
  validate({ body: scheduleInterviewSchema }),
  interviewController.scheduleInterview
);

router.get(
  '/my-interviews',
  authorize('JOB_SEEKER'),
  interviewController.getCandidateInterviews
);

router.get(
  '/recruiter',
  authorize('RECRUITER', 'ADMIN'),
  interviewController.getRecruiterInterviews
);

router.patch(
  '/:id',
  validate({ body: updateInterviewSchema }),
  interviewController.updateInterview
);

module.exports = router;
