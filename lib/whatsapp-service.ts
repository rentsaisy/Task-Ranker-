/**
 * WhatsApp Service
 * 
 * Handles sending WhatsApp messages via Twilio API
 * and logging message history to database
 */

import twilio from 'twilio';
import pool from './db';

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

// Initialize Twilio client (mock if credentials not available)
let twilioClient: any = null;

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
} else {
  console.warn('⚠️  Twilio credentials not found. WhatsApp messages will be mocked.');
}

/**
 * Message Templates
 */
const MESSAGE_TEMPLATES = {
  TASK_LIST: (tasks: Array<{title: string, priority_score: number, due_date: string, taskType: string}>) => {
    if (tasks.length === 0) {
      return `📋 *Your Task List*\n\nNo tasks found. Add tasks to get started! 🎯`;
    }
    
    let message = `📋 *Your Task List* (${tasks.length} tasks)\n\n`;
    tasks.forEach((task, index) => {
      const priority = task.priority_score >= 8 ? '🔴' : task.priority_score >= 5 ? '🟡' : '🟢';
      const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No deadline';
      message += `${index + 1}. ${priority} *${task.title}*\n`;
      message += `   Type: ${task.taskType} | Due: ${dueDate}\n`;
      message += `   Priority: ${task.priority_score.toFixed(1)}/10\n\n`;
    });
    message += `💪 Stay focused and complete your tasks!`;
    return message;
  },
  
  DAILY_SUMMARY: (completedTasks: number, pendingTasks: number) => 
    `📊 *Daily Summary*\n\n✅ Completed: ${completedTasks} tasks\n⏳ Pending: ${pendingTasks} tasks\n\nKeep up the great work! 🌟`,
  
  WELCOME: () => 
    `👋 Welcome to TaskRanker!\n\n*Commands:*\n• LIST - View all your tasks\n• TODAY - Today's tasks\n• PRIORITY - High priority tasks\n• HELP - Show commands`,
  
  STATUS_REPLY: (totalTasks: number, highPriority: number, dueToday: number) => 
    `📈 *Quick Status*\n\n📋 Total tasks: ${totalTasks}\n🔴 High priority: ${highPriority}\n⏰ Due today: ${dueToday}\n\nReply LIST to see all tasks.`,
  
  SESSION_CANCELLED: () => 
    `🛑 Pomodoro session cancelled. Take a break or start a new one anytime!`,
  
  NO_ACTIVE_SESSION: () => 
    `ℹ️ You don't have an active Pomodoro session. Reply START to begin!`,
  
  TASK_NOT_FOUND: () => 
    `⚠️ No tasks found. Please add tasks in the web app first!`,
};

interface SendMessageParams {
  userId: number;
  phoneNumber: string;
  message: string;
  pomodoroSessionId?: number;
  messageType?: string;
}

interface SendMessageResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage(params: SendMessageParams): Promise<SendMessageResult> {
  const { userId, phoneNumber, message, pomodoroSessionId, messageType } = params;

  try {
    // Format phone number for WhatsApp
    const formattedNumber = phoneNumber.startsWith('whatsapp:') 
      ? phoneNumber 
      : `whatsapp:${phoneNumber}`;

    let messageSid: string | null = null;

    if (twilioClient) {
      // Real Twilio API call
      const twilioMessage = await twilioClient.messages.create({
        body: message,
        from: twilioWhatsAppNumber,
        to: formattedNumber,
      });
      messageSid = twilioMessage.sid;
      console.log(`✅ WhatsApp message sent to ${phoneNumber}: ${messageSid}`);
    } else {
      // Mock mode for development
      messageSid = `MOCK_${Date.now()}`;
      console.log(`📱 [MOCK] WhatsApp to ${phoneNumber}:`);
      console.log(`   ${message}`);
    }

    // Log message to database
    await logWhatsAppMessage({
      userId,
      phoneNumber,
      message,
      messageSid,
      direction: 'outgoing',
      status: twilioClient ? 'sent' : 'queued',
      pomodoroSessionId,
    });

    return { success: true, messageSid: messageSid || undefined };

  } catch (error: any) {
    console.error('❌ Error sending WhatsApp message:', error);

    // Log failed message
    await logWhatsAppMessage({
      userId,
      phoneNumber,
      message,
      direction: 'outgoing',
      status: 'failed',
      errorMessage: error.message,
      pomodoroSessionId,
    });

    return { success: false, error: error.message };
  }
}

/**
 * Log WhatsApp message to database
 */
async function logWhatsAppMessage(params: {
  userId: number;
  phoneNumber: string;
  message: string;
  messageSid?: string | null;
  direction: 'outgoing' | 'incoming';
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'received';
  errorMessage?: string;
  pomodoroSessionId?: number;
  command?: string;
}) {
  const {
    userId,
    phoneNumber,
    message,
    messageSid,
    direction,
    status,
    errorMessage,
    pomodoroSessionId,
    command,
  } = params;

  try {
    await pool.query(
      `INSERT INTO whatsapp_messages 
       (user_id, phone_number, message_body, message_sid, direction, status, 
        error_message, pomodoro_session_id, command, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        phoneNumber,
        message,
        messageSid || null,
        direction,
        status,
        errorMessage || null,
        pomodoroSessionId || null,
        command || null,
      ]
    );
  } catch (error) {
    console.error('Error logging WhatsApp message:', error);
  }
}

/**
 * Send task list via WhatsApp
 */
export async function sendTaskList(
  userId: number,
  phoneNumber: string,
  filterType: 'all' | 'today' | 'priority' = 'all'
) {
  try {
    let query = `
      SELECT t.id, t.title, t.priority_score, t.due_date, tt.name as taskType
      FROM tasks t
      LEFT JOIN task_types tt ON t.task_type_id = tt.id
      WHERE t.user_id = ? AND (t.status IS NULL OR t.status != 'completed')
    `;
    
    const params: any[] = [userId];
    
    if (filterType === 'today') {
      query += ` AND DATE(t.due_date) = CURDATE()`;
    } else if (filterType === 'priority') {
      query += ` AND t.priority_score >= 70`; // High priority threshold (ML score 0-100)
    }
    
    query += ` ORDER BY t.priority_score DESC, t.due_date ASC LIMIT 10`;
    
    const [tasks] = await pool.query(query, params) as any;
    
    const message = MESSAGE_TEMPLATES.TASK_LIST(tasks);
    
    return sendWhatsAppMessage({
      userId,
      phoneNumber,
      message,
      messageType: `task_list_${filterType}`,
    });
  } catch (error) {
    console.error('Error sending task list:', error);
    return { success: false, error: 'Failed to fetch tasks' };
  }
}

/**
 * Send daily summary
 */
export async function sendDailySummary(
  userId: number,
  phoneNumber: string
) {
  try {
    const [completedResult] = await pool.query(
      `SELECT COUNT(*) as count FROM tasks 
       WHERE user_id = ? AND status = 'completed' AND DATE(updated_at) = CURDATE()`,
      [userId]
    ) as any;
    
    const [pendingResult] = await pool.query(
      `SELECT COUNT(*) as count FROM tasks 
       WHERE user_id = ? AND status != 'completed'`,
      [userId]
    ) as any;
    
    const completed = completedResult[0]?.count || 0;
    const pending = pendingResult[0]?.count || 0;
    
    const message = MESSAGE_TEMPLATES.DAILY_SUMMARY(completed, pending);
    
    return sendWhatsAppMessage({
      userId,
      phoneNumber,
      message,
      messageType: 'daily_summary',
    });
  } catch (error) {
    console.error('Error sending daily summary:', error);
    return { success: false, error: 'Failed to fetch summary' };
  }
}

/**
 * Send quick status
 */
export async function sendQuickStatus(
  userId: number,
  phoneNumber: string
) {
  try {
    const [totalResult] = await pool.query(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status != 'completed'`,
      [userId]
    ) as any;
    
    const [highPriorityResult] = await pool.query(
      `SELECT COUNT(*) as count FROM tasks 
       WHERE user_id = ? AND status != 'completed' AND priority_score >= 7`,
      [userId]
    ) as any;
    
    const [dueTodayResult] = await pool.query(
      `SELECT COUNT(*) as count FROM tasks 
       WHERE user_id = ? AND status != 'completed' AND DATE(due_date) = CURDATE()`,
      [userId]
    ) as any;
    
    const total = totalResult[0]?.count || 0;
    const highPriority = highPriorityResult[0]?.count || 0;
    const dueToday = dueTodayResult[0]?.count || 0;
    
    const message = MESSAGE_TEMPLATES.STATUS_REPLY(total, highPriority, dueToday);
    
    return sendWhatsAppMessage({
      userId,
      phoneNumber,
      message,
      messageType: 'status',
    });
  } catch (error) {
    console.error('Error sending status:', error);
    return { success: false, error: 'Failed to fetch status' };
  }
}

/**
 * Verify Twilio webhook signature (for security)
 */
export function verifyWebhookSignature(
  signature: string,
  url: string,
  params: Record<string, any>
): boolean {
  if (!authToken) {
    console.warn('⚠️  Cannot verify webhook signature: Auth token not configured');
    return true; // Allow in development
  }

  try {
    return twilio.validateRequest(authToken, signature, url, params);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Handle incoming WhatsApp message
 */
export async function handleIncomingMessage(params: {
  from: string; // Phone number
  body: string; // Message content
  messageSid: string;
}) {
  const { from, body, messageSid } = params;

  // Remove 'whatsapp:' prefix if present
  const phoneNumber = from.replace('whatsapp:', '');

  // Find user by phone number
  const [users] = await pool.query<any[]>(
    'SELECT id, name FROM users WHERE phone_number = ?',
    [phoneNumber]
  );

  if (users.length === 0) {
    console.log(`⚠️  No user found for phone number: ${phoneNumber}`);
    return { success: false, error: 'User not found' };
  }

  const user = users[0];
  const userId = user.id;

  // Parse command from message
  const command = body.trim().toUpperCase();

  // Log incoming message
  await logWhatsAppMessage({
    userId,
    phoneNumber,
    message: body,
    messageSid,
    direction: 'incoming',
    status: 'received',
    command,
  });

  return { success: true, userId, command, userName: user.name };
}

export { MESSAGE_TEMPLATES };
