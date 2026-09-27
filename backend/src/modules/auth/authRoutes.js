const express = require('express');
const router = express.Router();
const authController = require('./authController');
const validate = require('../../middleware/validateMiddleware');
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  googleAuthSchema,
} = require('./authValidators');
const { authenticate, optionalAuthenticate } = require('../../middleware/authMiddleware');
const { authRateLimiter } = require('../../middleware/securityMiddleware');

router.post('/register', authRateLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', authRateLimiter, validate({ body: loginSchema }), authController.login);
router.post('/refresh', validate({ body: refreshTokenSchema }), authController.refresh);
router.post('/logout', optionalAuthenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.post('/google', authRateLimiter, validate({ body: googleAuthSchema }), authController.googleAuth);

module.exports = router;
