const express = require('express');
const router = express.Router();
const jobController = require('./jobController');
const { authenticate, authorize, optionalAuthenticate } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validateMiddleware');
const { createJobSchema, updateJobSchema } = require('./jobValidators');

// Public / Discovery routes (optionalAuthenticate allows personalized isSaved flag)
router.get('/', optionalAuthenticate, jobController.listJobs);
router.get('/recruiter/my-jobs', authenticate, authorize('RECRUITER', 'ADMIN'), jobController.listRecruiterJobs);
router.get('/candidate/saved', authenticate, jobController.listSavedJobs);
router.get('/candidate/recommendations', authenticate, authorize('JOB_SEEKER'), jobController.getRecommendedJobs);
router.get('/:id/match-score', authenticate, jobController.getJobMatchScore);
router.get('/:id', optionalAuthenticate, jobController.getJob);

// Recruiter management routes
router.post('/', authenticate, authorize('RECRUITER', 'ADMIN'), validate({ body: createJobSchema }), jobController.createJob);
router.patch('/:id', authenticate, authorize('RECRUITER', 'ADMIN'), validate({ body: updateJobSchema }), jobController.updateJob);
router.patch('/:id/close', authenticate, authorize('RECRUITER', 'ADMIN'), jobController.closeJob);

// Candidate bookmark route
router.post('/:id/save', authenticate, jobController.toggleSaveJob);

module.exports = router;
