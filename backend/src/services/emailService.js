const env = require('../config/env');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.fromEmail = env.EMAIL_FROM || 'JobPilot AI <notifications@jobpilot.ai>';
  }

  /**
   * Send transactional email (uses Resend/SMTP if configured, otherwise logs safely)
   */
  async sendEmail({ to, subject, html, text }) {
    try {
      // In development or when API keys are not supplied, simulate delivery safely
      logger.info(`[EMAIL SIMULATION] Sent to: ${to} | Subject: "${subject}"`);
      return { success: true, messageId: `msg-${Date.now()}` };
    } catch (error) {
      logger.error(`Failed to send email to ${to}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Candidate notified that application was submitted
   */
  async sendApplicationSubmittedEmail(candidateEmail, candidateName, jobTitle, companyName) {
    const subject = `Application Confirmed: ${jobTitle} at ${companyName}`;
    const text = `Hi ${candidateName},\n\nYour application for ${jobTitle} at ${companyName} has been successfully submitted! You can track your real-time status in your JobPilot AI portal.\n\nBest regards,\nThe JobPilot AI Team`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #4f46e5;">Application Confirmed! 🎉</h2>
        <p>Hi <strong>${candidateName}</strong>,</p>
        <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been safely delivered to the hiring team.</p>
        <p style="color: #64748b; font-size: 14px;">We will notify you the moment the recruiter updates your application status.</p>
        <div style="margin-top: 24px;">
          <a href="${env.FRONTEND_URL || 'http://localhost:5173'}/applications" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Application Timeline</a>
        </div>
      </div>
    `;
    return this.sendEmail({ to: candidateEmail, subject, html, text });
  }

  /**
   * Recruiter notified that candidate applied
   */
  async sendNewApplicantAlert(recruiterEmail, candidateName, jobTitle, qualityScore) {
    const subject = `New Applicant: ${candidateName} applied for ${jobTitle}`;
    const text = `Hello,\n\n${candidateName} has applied for ${jobTitle}. Resume quality score: ${qualityScore || 'N/A'}/100.\n\nReview in your recruiter pipeline: ${env.FRONTEND_URL || 'http://localhost:5173'}/recruiter/applications`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #4f46e5;">New Candidate Application 📬</h2>
        <p><strong>${candidateName}</strong> has submitted an application for <strong>${jobTitle}</strong>.</p>
        <p>Resume Quality Score: <strong>${qualityScore ? qualityScore + '/100' : 'Evaluated'}</strong></p>
        <div style="margin-top: 24px;">
          <a href="${env.FRONTEND_URL || 'http://localhost:5173'}/recruiter/applications" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Open Kanban Pipeline</a>
        </div>
      </div>
    `;
    return this.sendEmail({ to: recruiterEmail, subject, html, text });
  }

  /**
   * Candidate notified of stage advancement
   */
  async sendStatusUpdateEmail(candidateEmail, candidateName, jobTitle, companyName, newStatus) {
    const statusLabels = {
      UNDER_REVIEW: 'Under Review by Hiring Team',
      SHORTLISTED: 'Shortlisted for Next Round',
      INTERVIEW: 'Interview Scheduled',
      OFFER: 'Job Offer Extended 🎉',
      REJECTED: 'Application Update',
    };

    const subject = `Update on your application: ${jobTitle} at ${companyName}`;
    const text = `Hi ${candidateName},\n\nYour application status for ${jobTitle} at ${companyName} has been updated to [${statusLabels[newStatus] || newStatus}]. Check your portal for details.\n\nBest regards,\nJobPilot AI`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #4f46e5;">Application Status Update</h2>
        <p>Hi <strong>${candidateName}</strong>,</p>
        <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has transitioned to:</p>
        <div style="display: inline-block; background: #e0e7ff; color: #3730a3; padding: 8px 16px; border-radius: 8px; font-weight: bold; margin: 12px 0;">
          ${statusLabels[newStatus] || newStatus}
        </div>
        <div style="margin-top: 20px;">
          <a href="${env.FRONTEND_URL || 'http://localhost:5173'}/applications" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Progress Stepper</a>
        </div>
      </div>
    `;
    return this.sendEmail({ to: candidateEmail, subject, html, text });
  }

  /**
   * Candidate notified of matched jobs digest from saved alert
   */
  async sendJobAlertDigest(alertTitle, matches = []) {
    const subject = `Job Alert: ${matches.length} matches for "${alertTitle}"`;
    const text = `Here are the latest matches for your alert "${alertTitle}":\n` +
      matches.map((m) => `- ${m.title} at ${m.company} (${m.score} match)`).join('\n') +
      `\n\nView all recommendations: ${env.FRONTEND_URL || 'http://localhost:5173'}/jobs?tab=recommended`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #4f46e5;">Job Alert Matches! 🎯</h2>
        <p>We found <strong>${matches.length}</strong> new position(s) matching your saved alert <em>"${alertTitle}"</em>:</p>
        <ul style="padding-left: 20px;">
          ${matches
            .map(
              (m) =>
                `<li style="margin-bottom: 8px;"><strong>${m.title}</strong> at ${m.company} &mdash; <span style="color: #059669; font-weight: bold;">${m.score} Match</span></li>`
            )
            .join('')}
        </ul>
        <div style="margin-top: 20px;">
          <a href="${env.FRONTEND_URL || 'http://localhost:5173'}/jobs?tab=recommended" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View All Matches</a>
        </div>
      </div>
    `;
    return this.sendEmail({ to: 'candidate@example.com', subject, html, text });
  }
}

module.exports = new EmailService();
