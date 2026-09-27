const express = require('express');
const router = express.Router();
const notificationController = require('./notificationController');
const { authenticate } = require('../../middleware/authMiddleware');

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
