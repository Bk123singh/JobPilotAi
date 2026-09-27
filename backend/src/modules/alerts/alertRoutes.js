const express = require('express');
const router = express.Router();
const alertController = require('./alertController');
const {
  createAlertSchema,
  updateAlertSchema,
  updatePreferencesSchema,
} = require('./alertValidators');
const validate = require('../../middleware/validateMiddleware');
const { authenticate, authorize } = require('../../middleware/authMiddleware');

// All alert routes require authentication (Job seekers & Admins)
router.use(authenticate);

// Candidate Notification Preferences
router.get('/preferences', alertController.getPreferences);
router.patch(
  '/preferences',
  validate(updatePreferencesSchema),
  alertController.updatePreferences
);

// Job Alert Subscriptions
router.post(
  '/',
  authorize('JOB_SEEKER', 'ADMIN'),
  validate(createAlertSchema),
  alertController.createAlert
);

router.get('/', authorize('JOB_SEEKER', 'ADMIN'), alertController.getUserAlerts);

router.get('/:id', authorize('JOB_SEEKER', 'ADMIN'), alertController.getAlertById);

router.patch(
  '/:id',
  authorize('JOB_SEEKER', 'ADMIN'),
  validate(updateAlertSchema),
  alertController.updateAlert
);

router.delete('/:id', authorize('JOB_SEEKER', 'ADMIN'), alertController.deleteAlert);

// Immediate Test Trigger for Digest
router.post(
  '/:id/trigger',
  authorize('JOB_SEEKER', 'ADMIN'),
  alertController.triggerAlertDigest
);

module.exports = router;
