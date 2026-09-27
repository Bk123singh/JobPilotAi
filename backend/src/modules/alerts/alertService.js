const { prisma } = require('../../config/db');
const AppError = require('../../errors/AppError');
const authService = require('../auth/authService');
const jobService = require('../jobs/jobService');
const profileService = require('../profiles/profileService');
const matchScoreService = require('../../services/matchScoreService');
const notificationService = require('../notifications/notificationService');
const emailService = require('../../services/emailService');

// In-Memory fallback store for job alerts
const memoryJobAlerts = new Map([
  [
    'alert-demo-001',
    {
      id: 'alert-demo-001',
      userId: 'demo-candidate-001',
      title: 'Senior Full-Stack & React Roles',
      keywords: ['React', 'Node.js', 'Full-Stack'],
      location: 'Remote',
      workplaceType: 'REMOTE',
      minSalary: 120000,
      frequency: 'DAILY',
      minMatchScore: 75,
      isActive: true,
      matchesFoundCount: 2,
      lastTriggeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);

// In-Memory fallback store for user notification preferences
const memoryPreferences = new Map([
  [
    'demo-candidate-001',
    {
      userId: 'demo-candidate-001',
      emailNotifications: true,
      matchAlerts: true,
      applicationUpdates: true,
      interviewReminders: true,
      minMatchScore: 75,
      updatedAt: new Date().toISOString(),
    },
  ],
]);

class AlertService {
  /**
   * Helper: Normalize keywords input into array of clean strings
   */
  normalizeKeywords(input) {
    if (Array.isArray(input)) {
      return input.map((k) => String(k).trim()).filter(Boolean);
    }
    if (typeof input === 'string') {
      return input
        .split(/[,+]/)
        .map((k) => k.trim())
        .filter(Boolean);
    }
    return [];
  }

  /**
   * Create new job alert subscription
   */
  async createAlert(userId, data) {
    const isDbLive = await authService.isPrismaHealthy();
    const keywords = this.normalizeKeywords(data.keywords);

    const alertRecord = {
      id: `alert-${Date.now()}`,
      userId,
      title: data.title,
      keywords,
      location: data.location || null,
      workplaceType: data.workplaceType || null,
      minSalary: data.minSalary ? Number(data.minSalary) : null,
      frequency: data.frequency || 'DAILY',
      minMatchScore: data.minMatchScore ? Number(data.minMatchScore) : 70,
      isActive: true,
      matchesFoundCount: 0,
      lastTriggeredAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryJobAlerts.set(alertRecord.id, alertRecord);

    // Initial check to count matching jobs
    try {
      const matches = await this.findMatchingJobsForAlert(userId, alertRecord);
      alertRecord.matchesFoundCount = matches.length;
      memoryJobAlerts.set(alertRecord.id, alertRecord);
    } catch (e) {
      // Ignore initial calculation failure
    }

    return alertRecord;
  }

  /**
   * List all alerts for candidate
   */
  async getUserAlerts(userId) {
    const alerts = [];
    for (const alert of memoryJobAlerts.values()) {
      if (alert.userId === userId) {
        alerts.push(alert);
      }
    }
    alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return alerts;
  }

  /**
   * Get single alert by ID
   */
  async getAlertById(userId, alertId) {
    const alert = memoryJobAlerts.get(alertId);
    if (!alert || alert.userId !== userId) {
      throw AppError.notFound('Job alert subscription not found');
    }
    return alert;
  }

  /**
   * Update alert subscription
   */
  async updateAlert(userId, alertId, data) {
    const alert = await this.getAlertById(userId, alertId);

    const updated = {
      ...alert,
      ...data,
      keywords: data.keywords ? this.normalizeKeywords(data.keywords) : alert.keywords,
      updatedAt: new Date().toISOString(),
    };

    // Recompute matches count if search criteria changed
    try {
      const matches = await this.findMatchingJobsForAlert(userId, updated);
      updated.matchesFoundCount = matches.length;
    } catch (e) {}

    memoryJobAlerts.set(alertId, updated);
    return updated;
  }

  /**
   * Delete alert subscription
   */
  async deleteAlert(userId, alertId) {
    await this.getAlertById(userId, alertId);
    memoryJobAlerts.delete(alertId);
    return { id: alertId, deleted: true };
  }

  /**
   * Internal algorithm: calculate matching jobs for a specific alert
   */
  async findMatchingJobsForAlert(userId, alert) {
    const profile = await profileService.getProfileByUserId(userId);
    const allJobs = await jobService.listJobs({}, userId);

    const matchingJobs = [];

    for (const job of allJobs) {
      // 1. Check workplace compatibility
      if (alert.workplaceType && job.workplaceType !== alert.workplaceType) {
        continue;
      }

      // 2. Check salary compatibility
      if (alert.minSalary && job.maxSalary && job.maxSalary < alert.minSalary) {
        continue;
      }

      // 3. Keyword / title / skill filter
      if (alert.keywords && alert.keywords.length > 0) {
        const textToSearch = `${job.title} ${job.description} ${(job.requiredSkills || []).join(' ')}`.toLowerCase();
        const hasKeywordMatch = alert.keywords.some((k) =>
          textToSearch.includes(k.toLowerCase())
        );
        if (!hasKeywordMatch) {
          continue;
        }
      }

      // 4. Match Score Engine calculation
      let score = 80; // default baseline
      let breakdown = null;
      if (profile) {
        breakdown = matchScoreService.calculateMatchScore(profile, job);
        score = breakdown.overallScore;
      }

      if (score >= (alert.minMatchScore || 70)) {
        matchingJobs.push({
          job,
          overallScore: score,
          tierLabel: breakdown?.tierLabel || 'Strong Match',
          breakdown,
        });
      }
    }

    matchingJobs.sort((a, b) => b.overallScore - a.overallScore);
    return matchingJobs;
  }

  /**
   * Trigger on-demand test digest for an alert
   */
  async triggerAlertDigest(userId, alertId) {
    const alert = await this.getAlertById(userId, alertId);
    const matches = await this.findMatchingJobsForAlert(userId, alert);

    // Update alert status
    alert.matchesFoundCount = matches.length;
    alert.lastTriggeredAt = new Date().toISOString();
    memoryJobAlerts.set(alertId, alert);

    // Trigger in-app notification if matches found
    if (matches.length > 0) {
      await notificationService.createNotification(
        userId,
        'MATCH_ALERT',
        `Job Alert: ${matches.length} Matches Found! 🎯`,
        `We discovered ${matches.length} new position(s) matching your alert "${alert.title}" with scores up to ${matches[0].overallScore}%.`,
        `/jobs?tab=recommended`
      );

      // Trigger simulated email digest
      emailService.sendJobAlertDigest(
        alert.title,
        matches.slice(0, 3).map((m) => ({
          title: m.job.title,
          company: m.job.company?.name || 'Top Employer',
          score: `${m.overallScore}%`,
        }))
      );
    }

    return {
      alert,
      matchesCount: matches.length,
      topMatches: matches.slice(0, 5),
    };
  }

  /**
   * Get notification preferences for candidate
   */
  async getPreferences(userId) {
    let prefs = memoryPreferences.get(userId);
    if (!prefs) {
      prefs = {
        userId,
        emailNotifications: true,
        matchAlerts: true,
        applicationUpdates: true,
        interviewReminders: true,
        minMatchScore: 70,
        updatedAt: new Date().toISOString(),
      };
      memoryPreferences.set(userId, prefs);
    }
    return prefs;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId, data) {
    const current = await this.getPreferences(userId);
    const updated = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    memoryPreferences.set(userId, updated);
    return updated;
  }
}

module.exports = new AlertService();
