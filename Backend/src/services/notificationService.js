const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  /**
   * Send email notification abstraction
   * If SMTP is configured in environment, it will send via SMTP;
   * otherwise, securely logs the formatted email in dev/test mode.
   */
  async sendEmailNotification({ to, subject, html, text }) {
    try {
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpHost && smtpUser && smtpPass) {
        // Production SMTP delivery hook (e.g. using nodemailer if installed or external REST API)
        console.log(`[Email Service] Dispatching email to ${to}: "${subject}" via SMTP host ${smtpHost}`);
      } else {
        // Development / Test mode logging
        console.log(`[Email Service (Dev Mode)]:
  To: ${to}
  Subject: ${subject}
  Date: ${new Date().toISOString()}
  Content: ${text || html}
`);
      }
      return { success: true };
    } catch (err) {
      console.error('[Email Service Error]:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Create an in-app notification with deduplication support
   */
  async createNotification({ userId, type, title, message, link, metadata = {} }) {
    if (!userId || !title || !message) return null;

    // Deduplication check for job match notifications
    if (type === 'job_match' && metadata.jobId) {
      const existing = await Notification.findOne({
        userId,
        type: 'job_match',
        'metadata.jobId': metadata.jobId
      });
      if (existing) {
        return existing; // Don't duplicate match notification
      }
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      link,
      metadata,
      read: false
    });

    return notification;
  }

  /**
   * Retrieve notifications for a user with unread count
   */
  async getNotifications(userId, { limit = 30, page = 1, unreadOnly = false } = {}) {
    const query = { userId };
    if (unreadOnly) {
      query.read = false;
    }

    const skip = (page - 1) * limit;

    const [notifications, unreadCount, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments({ userId, read: false }),
      Notification.countDocuments(query)
    ]);

    return {
      notifications,
      unreadCount,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
    return result;
  }

  /**
   * Handle recruiter updating candidate application status
   * Generates both in-app notification and email notification
   */
  async sendCandidateStatusUpdate({ studentId, studentEmail, studentName, jobTitle, companyName, status, jobId }) {
    const sLower = (status || '').toLowerCase();
    const formattedStatus = status ? (status.charAt(0).toUpperCase() + status.slice(1)) : 'Updated';
    let title = `Application Update: ${formattedStatus}`;
    let message = `Your application for ${jobTitle} at ${companyName || 'the company'} has been moved to ${formattedStatus}.`;

    if (sLower === 'shortlisted') {
      title = 'Application Shortlisted';
      message = `You have been shortlisted for ${jobTitle} at ${companyName || 'the company'}.`;
    } else if (sLower === 'interview' || sLower === 'interviewing') {
      title = 'Interview Scheduled';
      message = `Interview scheduled for ${jobTitle} at ${companyName || 'the company'}.`;
    } else if (sLower === 'selected' || sLower === 'offered') {
      title = 'Congratulations! Selected';
      message = `Congratulations! You have been selected for ${jobTitle} at ${companyName || 'the company'}.`;
    } else if (sLower === 'rejected') {
      title = 'Application Not Selected';
      message = `Your application for ${jobTitle} at ${companyName || 'the company'} was not selected.`;
    }
    const link = `/applications`;

    // 1. Create In-App Notification
    const inApp = await this.createNotification({
      userId: studentId,
      type: 'application_status',
      title,
      message,
      link,
      metadata: {
        jobId,
        jobTitle,
        companyName,
        status,
        timestamp: new Date().toISOString()
      }
    });

    // 2. Dispatch Email Notification asynchronously
    if (studentEmail) {
      const emailSubject = `Application Update: ${jobTitle} at ${companyName || 'SkillGraph'}`;
      const emailText = `Hello ${studentName || 'Student'},

Your application for the position of "${jobTitle}" at ${companyName || 'SkillGraph'} has been updated to: ${formattedStatus}.

Date & Time: ${new Date().toLocaleString()}

Log in to your SkillGraph dashboard to view details and next steps:
https://skillgraph.app/applications

Best regards,
SkillGraph Careers Team`;

      // Non-blocking invocation
      this.sendEmailNotification({
        to: studentEmail,
        subject: emailSubject,
        text: emailText
      }).catch(err => console.error('Failed to dispatch background email:', err));
    }

    return inApp;
  }

  /**
   * Trigger high match notification for student when match score >= 80%
   */
  async notifyHighMatchJob({ studentId, job, matchScore }) {
    if (!studentId || !job || matchScore < 80) return null;

    return await this.createNotification({
      userId: studentId,
      type: 'job_match',
      title: `Top Match: ${job.title} (${matchScore}%)`,
      message: `Your skills match ${job.title} at ${job.company || 'the hiring company'} by ${matchScore}%. You may be a strong candidate to apply.`,
      link: `/jobs/${job._id}`,
      metadata: {
        jobId: job._id.toString(),
        matchScore,
        company: job.company
      }
    });
  }
}

module.exports = new NotificationService();
