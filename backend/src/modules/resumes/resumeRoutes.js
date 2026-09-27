const express = require('express');
const router = express.Router();
const resumeController = require('./resumeController');
const { authenticate } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validateMiddleware');
const { createResumeSchema, updateResumeSchema } = require('./resumeValidators');

router.get('/', authenticate, resumeController.listResumes);
router.get('/:id', authenticate, resumeController.getResume);
router.post('/', authenticate, validate({ body: createResumeSchema }), resumeController.createResume);
router.patch('/:id', authenticate, validate({ body: updateResumeSchema }), resumeController.updateResume);
router.patch('/:id/primary', authenticate, resumeController.setPrimary);
router.delete('/:id', authenticate, resumeController.deleteResume);

module.exports = router;
