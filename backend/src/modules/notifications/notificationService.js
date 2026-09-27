const { prisma } = require('../../config/db');
const AppError = require('../../errors/AppError');
const authService = require('../auth/authService');
const emailService = require('../../services/emailService');
const logger = require('../../utils/logger');

// Fallback in-memory notification store
const memoryNotifications = new Map();

// Seed initial demo notifications
const seedDemoNotifications = () => {
  const now = Date.now();
  const demoCandidateId = 'demo-candidate-id-001';
  const demoRecruiterId = 'demo-recruiter-id-002';

  // Demo candidate notifications
  const notif1 = {
    id: 'notif-demo-001',
    userId: demoCandidateId,
    type: 'STATUS_UPDATE',
    title: 'Application Shortlisted! 🎉',
    message: 'TechCorp Solutions shortlisted your application for Senior Full-Stack Engineer.',
    link: '/applications',
    isRead: false,
    createdAt: new Date(now - 12 * 60 * 60 * 1000),
  };

  const notif2 = {
    id: 'notif-demo-002',
    userId: demoCandidateId,
    type: 'MATCH_ALERT',
    title: '95% Job Match Found',
    message: 'New opening matches your React & Node.js skills: Senior Full-Stack Engineer at TechCorp.',
    link: '/jobs/job-demo-001',
    isRead: true,
    createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
  };

  // Demo recruiter notification
  const notif3 = {
    id: 'notif-demo-003',
    userId: demoRecruiterId,
    type: 'APPLICATION',
    title: 'New Applicant Received',
    message: 'Alex Seeker (94% Resume Score) applied for Senior Full-Stack Engineer.',
    link: '/recruiter/applications',
    isRead: false,
    createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
  };

  memoryNotifications.set(notif1.id, notif1);
  memoryNotifications.set(notif2.id, notif2);
  memoryNotifications.set(notif3.id, notif3);
};

seedDemoNotifications();

class NotificationService {
  /**
   * Dispatch an in-app and transactional notification
   */
  async createNotification({ userId, type, title, message, link = null }) {
    const isDbLive = await authService.isPrismaHealthy();
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    if (isDbLive) {
      try {
        return await prisma.notification.create({
          data: {
            userId,
            type,
            title,
            message,
            link,
          },
        });
      } catch (err) {
        logger.warn(`Failed to write notification to DB: ${err.message}`);
      }
    }

    // In-memory fallback
    const newNotif = {
      id: notifId,
      userId,
      type,
      title,
      message,
      link,
      isRead: false,
      createdAt: new Date(),
    };
    memoryNotifications.set(notifId, newNotif);
    return newNotif;
  }

  /**
   * List user's notifications
   */
  async getUserNotifications(userId, { unreadOnly = false, limit = 30 } = {}) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      return await prisma.notification.findMany({
        where: {
          userId,
          ...(unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit, 10),
      });
    }

    // In-memory fallback
    const list = [];
    for (const notif of memoryNotifications.values()) {
      if (notif.userId === userId) {
        if (!unreadOnly || !notif.isRead) {
          list.push(notif);
        }
      }
    }

    return list
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit, 10));
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      return await prisma.notification.count({
        where: { userId, isRead: false },
      });
    }

    // In-memory fallback
    let count = 0;
    for (const notif of memoryNotifications.values()) {
      if (notif.userId === userId && !notif.isRead) {
        count++;
      }
    }
    return count;
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(userId, notificationId) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
      if (!notif || notif.userId !== userId) {
        throw AppError.notFound('Notification not found or unauthorized');
      }

      return await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    }

    // In-memory fallback
    const notif = memoryNotifications.get(notificationId);
    if (!notif || notif.userId !== userId) {
      throw AppError.notFound('Notification not found or unauthorized');
    }
    notif.isRead = true;
    return notif;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    const isDbLive = await authService.isPrismaHealthy();

    if (isDbLive) {
      return await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    }

    // In-memory fallback
    let count = 0;
    for (const notif of memoryNotifications.values()) {
      if (notif.userId === userId && !notif.isRead) {
        notif.isRead = true;
        count++;
      }
    }
    return { count };
  }
}

module.exports = new NotificationService();
