const express = require('express');
const router = express.Router();
const healthController = require('./healthController');
const { authenticate, authorize } = require('../../middleware/authMiddleware');
const { successResponse } = require('../../utils/responseUtils');

router.get('/health', healthController.getHealth);

// Test RBAC Guard Routes
router.get(
  '/test-rbac/recruiter-only',
  authenticate,
  authorize('RECRUITER', 'ADMIN'),
  (req, res) => {
    return successResponse(
      res,
      200,
      { user: req.user.email, role: req.user.role },
      'Authorized recruiter access granted'
    );
  }
);

router.get(
  '/test-rbac/admin-only',
  authenticate,
  authorize('ADMIN'),
  (req, res) => {
    return successResponse(
      res,
      200,
      { user: req.user.email, role: req.user.role },
      'Authorized admin access granted'
    );
  }
);

module.exports = router;
