const express = require('express');
const router = express.Router();
const profileController = require('./profileController');
const { authenticate } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validateMiddleware');
const { updateProfileSchema } = require('./profileValidators');

router.get('/me', authenticate, profileController.getMyProfile);
router.get('/me/skill-gaps', authenticate, profileController.getSkillGapIntelligence);
router.patch('/me', authenticate, validate({ body: updateProfileSchema }), profileController.updateMyProfile);
router.get('/:userId', authenticate, profileController.getPublicProfile);

module.exports = router;
