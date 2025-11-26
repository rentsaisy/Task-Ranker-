/**
 * Pomodoro Scheduler Service
 * 
 * Server-side job scheduling for Pomodoro sessions
 * Ensures notifications are sent even if user closes browser
 */

import cron from 'node-cron';
import pool from './db';

/**
 * Job registry to track scheduled cron jobs
 * Key: notification_job_id, Value: cron task
 */
const scheduledJobs = new Map<number, any>();

/**
 * Initialize scheduler - runs every minute to check for pending jobs
 */
export function initializePomodoroScheduler() {
  console.log('🕐 Initializing Pomodoro Scheduler...');

  // Run every minute to check for jobs that need execution
  cron.schedule('* * * * *', async () => {
    await processPendingJobs();
  });

  // Clean up completed sessions older than 7 days (runs daily at 3 AM)
  cron.schedule('0 3 * * *', async () => {
    await cleanupOldSessions();
  });

  console.log('✅ Pomodoro Scheduler initialized');
}

/**
 * Process pending notification jobs that are due
 */
async function processPendingJobs() {
  try {
    // Get jobs that are due for execution
    const [jobs] = await pool.query<any[]>(
      `SELECT nj.*, ps.user_id, ps.task_id, ps.mode, ps.session_number,
              t.name as task_name, u.phone_number, u.whatsapp_verified
       FROM notification_jobs nj
       JOIN pomodoro_sessions ps ON nj.pomodoro_session_id = ps.id
       JOIN tasks t ON ps.task_id = t.id
       JOIN users u ON ps.user_id = u.id
       WHERE nj.status = 'pending'
         AND nj.scheduled_at <= NOW()
         AND u.whatsapp_verified = TRUE
       ORDER BY nj.scheduled_at ASC
       LIMIT 10`
    );

    for (const job of jobs) {
      await executeJob(job);
    }

  } catch (error) {
    console.error('Error processing pending jobs:', error);
  }
}

/**
 * Execute a single notification job
 */
async function executeJob(job: any) {
  const jobId = job.id;
  
  try {
    // Mark job as processing
    await pool.query(
      `UPDATE notification_jobs 
       SET status = 'processing', executed_at = NOW(), attempts = attempts + 1
       WHERE id = ?`,
      [jobId]
    );

    // WhatsApp notifications disabled (now using task list reminders instead)
    // Mark job as completed
    const result = { success: true, messageSid: null };

    if (result?.success) {
      // Mark job as completed
      await pool.query(
        `UPDATE notification_jobs 
         SET status = 'completed', completed_at = NOW(), whatsapp_message_sid = ?
         WHERE id = ?`,
        [result.messageSid, jobId]
      );

      // Update Pomodoro session
      await pool.query(
        `UPDATE pomodoro_sessions 
         SET whatsapp_reminder_sent = TRUE, whatsapp_reminder_sent_at = NOW()
         WHERE id = ?`,
        [job.pomodoro_session_id]
      );

      // Auto-transition to next mode if applicable
      await handleSessionTransition(job);

      console.log(`✅ Job ${jobId} completed successfully`);
    }

  } catch (error: any) {
    console.error(`❌ Job ${jobId} failed:`, error);

    // Check if we should retry
    const shouldRetry = job.attempts < job.max_attempts;
    const newStatus = shouldRetry ? 'pending' : 'failed';

    await pool.query(
      `UPDATE notification_jobs 
       SET status = ?, error_message = ?
       WHERE id = ?`,
      [newStatus, error.message, jobId]
    );
  }
}

/**
 * Handle automatic session transitions (focus → break → focus)
 */
async function handleSessionTransition(job: any) {
  const { pomodoro_session_id, user_id, task_id, mode, session_number } = job;

  try {
    // Mark current session as completed
    await pool.query(
      `UPDATE pomodoro_sessions 
       SET status = 'completed', completed_successfully = TRUE, actual_end_time = NOW()
       WHERE id = ?`,
      [pomodoro_session_id]
    );

    // Get user's Pomodoro settings
    const [settings] = await pool.query<any[]>(
      `SELECT * FROM pomodoro_settings WHERE user_id = ?`,
      [user_id]
    );

    const userSettings = settings[0] || {
      short_break_duration: 5,
      long_break_duration: 15,
      focus_duration: 25,
      sessions_before_long_break: 4,
      enable_auto_start_breaks: true,
    };

    // Determine next mode
    let nextMode: 'focus' | 'short_break' | 'long_break';
    let nextDuration: number;
    let nextSessionNumber: number;

    if (mode === 'focus') {
      // After focus, start break
      if (session_number >= userSettings.sessions_before_long_break) {
        nextMode = 'long_break';
        nextDuration = userSettings.long_break_duration;
        nextSessionNumber = 1; // Reset counter
      } else {
        nextMode = 'short_break';
        nextDuration = userSettings.short_break_duration;
        nextSessionNumber = session_number;
      }
    } else {
      // After break, start focus
      nextMode = 'focus';
      nextDuration = userSettings.focus_duration;
      nextSessionNumber = session_number + 1;
    }

    // Only auto-create next session if user has auto-start enabled
    if (userSettings.enable_auto_start_breaks || mode !== 'focus') {
      // Create next session (but mark as scheduled, not active)
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + nextDuration * 60000);

      const [result] = await pool.query(
        `INSERT INTO pomodoro_sessions 
         (user_id, task_id, mode, session_number, start_time, end_time, 
          duration_minutes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
        [user_id, task_id, nextMode, nextSessionNumber, startTime, endTime, nextDuration]
      );

      const nextSessionId = (result as any).insertId;

      // Schedule notification for next session
      await scheduleNotification({
        userId: user_id,
        pomodoroSessionId: nextSessionId,
        taskId: task_id,
        jobType: nextMode === 'focus' ? 'pomodoro_end' : 'break_end',
        scheduledAt: endTime,
      });

      console.log(`🔄 Auto-scheduled ${nextMode} session ${nextSessionId}`);
    }

  } catch (error) {
    console.error('Error handling session transition:', error);
  }
}

/**
 * Schedule a notification job
 */
export async function scheduleNotification(params: {
  userId: number;
  pomodoroSessionId: number;
  taskId: number;
  jobType: 'pomodoro_end' | 'break_end';
  scheduledAt: Date;
}) {
  const { userId, pomodoroSessionId, taskId, jobType, scheduledAt } = params;

  try {
    const [result] = await pool.query(
      `INSERT INTO notification_jobs 
       (user_id, pomodoro_session_id, task_id, job_type, scheduled_at, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [userId, pomodoroSessionId, taskId, jobType, scheduledAt]
    );

    const jobId = (result as any).insertId;
    console.log(`📅 Scheduled ${jobType} notification (job #${jobId}) for ${scheduledAt.toISOString()}`);

    return jobId;

  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
}

/**
 * Cancel scheduled notification
 */
export async function cancelNotification(pomodoroSessionId: number) {
  try {
    await pool.query(
      `UPDATE notification_jobs 
       SET status = 'cancelled'
       WHERE pomodoro_session_id = ? 
         AND status = 'pending'`,
      [pomodoroSessionId]
    );

    console.log(`❌ Cancelled notifications for session ${pomodoroSessionId}`);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
}

/**
 * Get active Pomodoro session for user
 */
export async function getActiveSession(userId: number) {
  try {
    const [sessions] = await pool.query<any[]>(
      `SELECT ps.*, t.title as task_name, tt.name as task_type
       FROM pomodoro_sessions ps
       LEFT JOIN tasks t ON ps.task_id = t.id
       LEFT JOIN task_types tt ON t.task_type_id = tt.id
       WHERE ps.user_id = ?
         AND ps.status IN ('active', 'paused', 'scheduled')
       ORDER BY ps.start_time DESC
       LIMIT 1`,
      [userId]
    );

    return sessions[0] || null;
  } catch (error) {
    console.error('Error getting active session:', error);
    return null;
  }
}

/**
 * Get today's completed sessions count
 */
export async function getTodaySessionCount(userId: number) {
  try {
    const [result] = await pool.query<any[]>(
      `SELECT 
         COUNT(*) as total_sessions,
         SUM(CASE WHEN mode = 'focus' AND completed_successfully THEN 1 ELSE 0 END) as completed_focus,
         SUM(CASE WHEN mode = 'focus' THEN duration_minutes ELSE 0 END) as total_focus_minutes
       FROM pomodoro_sessions
       WHERE user_id = ?
         AND DATE(start_time) = CURDATE()
         AND status = 'completed'`,
      [userId]
    );

    return result[0] || { total_sessions: 0, completed_focus: 0, total_focus_minutes: 0 };
  } catch (error) {
    console.error('Error getting session count:', error);
    return { total_sessions: 0, completed_focus: 0, total_focus_minutes: 0 };
  }
}

/**
 * Clean up old completed sessions (runs daily)
 */
async function cleanupOldSessions() {
  try {
    const daysToKeep = 30; // Keep 30 days of history
    
    await pool.query(
      `DELETE FROM pomodoro_sessions 
       WHERE status = 'completed' 
         AND start_time < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [daysToKeep]
    );

    await pool.query(
      `DELETE FROM notification_jobs 
       WHERE status IN ('completed', 'failed') 
         AND scheduled_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [daysToKeep]
    );

    console.log(`🧹 Cleaned up sessions older than ${daysToKeep} days`);
  } catch (error) {
    console.error('Error cleaning up old sessions:', error);
  }
}

/**
 * Start Pomodoro session
 */
export async function startPomodoroSession(params: {
  userId: number;
  taskId: number;
  duration: number; // in minutes
  mode: 'focus' | 'short_break' | 'long_break';
  sessionNumber: number;
}) {
  const { userId, taskId, duration, mode, sessionNumber } = params;

  try {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // Create session
    const [result] = await pool.query(
      `INSERT INTO pomodoro_sessions 
       (user_id, task_id, mode, session_number, start_time, end_time, 
        duration_minutes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [userId, taskId, mode, sessionNumber, startTime, endTime, duration]
    );

    const sessionId = (result as any).insertId;

    // Schedule end notification
    const jobType = mode === 'focus' ? 'pomodoro_end' : 'break_end';
    await scheduleNotification({
      userId,
      pomodoroSessionId: sessionId,
      taskId,
      jobType,
      scheduledAt: endTime,
    });

    return sessionId;
  } catch (error) {
    console.error('Error starting Pomodoro session:', error);
    throw error;
  }
}

export default {
  initializePomodoroScheduler,
  scheduleNotification,
  cancelNotification,
  getActiveSession,
  getTodaySessionCount,
  startPomodoroSession,
};
