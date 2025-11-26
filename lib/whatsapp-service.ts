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
  POMODORO_END: (taskName: string) => 
    `⏰ Your Pomodoro focus session for "${taskName}" is finished. Time for a break! 🎉`,
  
  SHORT_BREAK_END: (taskName: string) => 
    `✅ Break is over! Ready to start the next focus session for "${taskName}"? 💪`,
  
  LONG_BREAK_END: (taskName: string) => 
    `✅ Long break complete! Great work! Ready to continue with "${taskName}"? 🚀`,
  
  SESSION_STARTED: (taskName: string, duration: number) => 
    `🎯 Pomodoro started for "${taskName}" - ${duration} minutes of focused work ahead!`,
  
  DAILY_SUMMARY: (completedSessions: number, totalMinutes: number) => 
    `📊 Today's Progress:\n✅ ${completedSessions} Pomodoro sessions\n⏱️ ${totalMinutes} minutes of focused work\nKeep it up! 🌟`,
  
  WELCOME: () => 
    `👋 Welcome to TaskRanker Pomodoro!\n\nCommands:\n• START - Begin Pomodoro\n• STOP - Cancel session\n• STATUS - View today's progress`,
  
  STATUS_REPLY: (completedToday: number, activeTask: string | null) => 
    activeTask 
      ? `📈 Status:\n✅ ${completedToday} sessions completed today\n🎯 Currently: ${activeTask}`
      : `📈 Status:\n✅ ${completedToday} sessions completed today\n💤 No active session`,
  
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
 * Send Pomodoro completion notification
 */
export async function sendPomodoroEndNotification(
  userId: number,
  phoneNumber: string,
  taskName: string,
  sessionId: number
) {
  const message = MESSAGE_TEMPLATES.POMODORO_END(taskName);
  return sendWhatsAppMessage({
    userId,
    phoneNumber,
    message,
    pomodoroSessionId: sessionId,
    messageType: 'pomodoro_end',
  });
}

/**
 * Send break completion notification
 */
export async function sendBreakEndNotification(
  userId: number,
  phoneNumber: string,
  taskName: string,
  sessionId: number,
  isLongBreak: boolean = false
) {
  const message = isLongBreak
    ? MESSAGE_TEMPLATES.LONG_BREAK_END(taskName)
    : MESSAGE_TEMPLATES.SHORT_BREAK_END(taskName);
  
  return sendWhatsAppMessage({
    userId,
    phoneNumber,
    message,
    pomodoroSessionId: sessionId,
    messageType: isLongBreak ? 'long_break_end' : 'short_break_end',
  });
}

/**
 * Send session started notification
 */
export async function sendSessionStartedNotification(
  userId: number,
  phoneNumber: string,
  taskName: string,
  duration: number,
  sessionId: number
) {
  const message = MESSAGE_TEMPLATES.SESSION_STARTED(taskName, duration);
  return sendWhatsAppMessage({
    userId,
    phoneNumber,
    message,
    pomodoroSessionId: sessionId,
    messageType: 'session_started',
  });
}

/**
 * Send daily summary
 */
export async function sendDailySummary(
  userId: number,
  phoneNumber: string,
  completedSessions: number,
  totalMinutes: number
) {
  const message = MESSAGE_TEMPLATES.DAILY_SUMMARY(completedSessions, totalMinutes);
  return sendWhatsAppMessage({
    userId,
    phoneNumber,
    message,
    messageType: 'daily_summary',
  });
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
