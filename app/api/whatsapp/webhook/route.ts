/**
 * API Route: WhatsApp Webhook
 * POST /api/whatsapp/webhook
 * 
 * Handles incoming WhatsApp messages from Twilio
 * Supports commands: START, STOP, STATUS
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  handleIncomingMessage, 
  verifyWebhookSignature,
  sendWhatsAppMessage,
  MESSAGE_TEMPLATES,
} from '@/lib/whatsapp-service';
import { 
  getActiveSession, 
  getTodaySessionCount,
  startPomodoroSession,
  cancelNotification,
} from '@/lib/pomodoro-scheduler';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Parse incoming webhook data
    const formData = await request.formData();
    const params: Record<string, any> = {};
    
    formData.forEach((value, key) => {
      params[key] = value;
    });

    const from = params.From; // Phone number (whatsapp:+xxx)
    const body = params.Body; // Message text
    const messageSid = params.MessageSid;

    // Verify Twilio signature (security)
    const signature = request.headers.get('X-Twilio-Signature') || '';
    const url = request.url;
    
    if (process.env.NODE_ENV === 'production') {
      const isValid = verifyWebhookSignature(signature, url, params);
      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    // Handle the incoming message
    const result = await handleIncomingMessage({ from, body, messageSid });

    if (!result.success) {
      // User not found - send welcome message
      return NextResponse.json({ success: true, message: 'User not found' });
    }

    const { userId, command, userName } = result;

    // Process command
    let responseMessage = '';

    switch (command) {
      case 'START':
        responseMessage = await handleStartCommand(userId);
        break;

      case 'STOP':
        responseMessage = await handleStopCommand(userId);
        break;

      case 'STATUS':
        responseMessage = await handleStatusCommand(userId);
        break;

      case 'HELP':
        responseMessage = MESSAGE_TEMPLATES.WELCOME();
        break;

      default:
        responseMessage = `Hi ${userName}! 👋\n\nI didn't understand "${body}".\n\n${MESSAGE_TEMPLATES.WELCOME()}`;
    }

    // Send response via WhatsApp
    if (responseMessage) {
      const phoneNumber = from.replace('whatsapp:', '');
      await sendWhatsAppMessage({
        userId,
        phoneNumber,
        message: responseMessage,
      });
    }

    return NextResponse.json({ success: true, command, response: responseMessage });

  } catch (error: any) {
    console.error('Error handling WhatsApp webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle START command - start Pomodoro for highest priority task
 */
async function handleStartCommand(userId: number): Promise<string> {
  try {
    // Check if user already has active session
    const activeSession = await getActiveSession(userId);
    
    if (activeSession) {
      const timeLeft = Math.floor(
        (new Date(activeSession.end_time).getTime() - Date.now()) / 60000
      );
      return `⏳ You already have an active ${activeSession.mode} session for "${activeSession.task_name}"\n\n⏱️ Time remaining: ${timeLeft} minutes`;
    }

    // Get highest priority task
    const [tasks] = await pool.query<any[]>(
      `SELECT id, name, priority 
       FROM tasks 
       WHERE user_id = ? 
       ORDER BY priority DESC 
       LIMIT 1`,
      [userId]
    );

    if (tasks.length === 0) {
      return MESSAGE_TEMPLATES.TASK_NOT_FOUND();
    }

    const task = tasks[0];

    // Get user's Pomodoro settings
    const [settings] = await pool.query<any[]>(
      `SELECT focus_duration FROM pomodoro_settings WHERE user_id = ?`,
      [userId]
    );

    const duration = settings[0]?.focus_duration || 25;

    // Start Pomodoro session
    const sessionId = await startPomodoroSession({
      userId,
      taskId: task.id,
      duration,
      mode: 'focus',
      sessionNumber: 1,
    });

    return `🎯 Pomodoro started!\n\nTask: "${task.name}"\nDuration: ${duration} minutes\n\nStay focused! You'll get a notification when it's done. 💪`;

  } catch (error) {
    console.error('Error handling START command:', error);
    return '❌ Sorry, I couldn\'t start a Pomodoro session. Please try again later.';
  }
}

/**
 * Handle STOP command - cancel active session
 */
async function handleStopCommand(userId: number): Promise<string> {
  try {
    // Get active session
    const activeSession = await getActiveSession(userId);
    
    if (!activeSession) {
      return MESSAGE_TEMPLATES.NO_ACTIVE_SESSION();
    }

    // Cancel the session
    await pool.query(
      `UPDATE pomodoro_sessions 
       SET status = 'cancelled', interrupted = TRUE, actual_end_time = NOW()
       WHERE id = ?`,
      [activeSession.id]
    );

    // Cancel notifications
    await cancelNotification(activeSession.id);

    return `🛑 Pomodoro session for "${activeSession.task_name}" has been cancelled.\n\nTake a break or start a new session anytime!`;

  } catch (error) {
    console.error('Error handling STOP command:', error);
    return '❌ Sorry, I couldn\'t stop the session. Please try again.';
  }
}

/**
 * Handle STATUS command - show today's progress
 */
async function handleStatusCommand(userId: number): Promise<string> {
  try {
    // Get active session
    const activeSession = await getActiveSession(userId);
    
    // Get today's stats
    const stats = await getTodaySessionCount(userId);

    const completedToday = stats.completed_focus || 0;
    const totalMinutes = stats.total_focus_minutes || 0;

    let statusMessage = `📊 Your Pomodoro Status\n\n`;
    statusMessage += `✅ Completed today: ${completedToday} sessions\n`;
    statusMessage += `⏱️ Total focus time: ${totalMinutes} minutes\n\n`;

    if (activeSession) {
      const timeLeft = Math.floor(
        (new Date(activeSession.end_time).getTime() - Date.now()) / 60000
      );
      statusMessage += `🎯 Active: "${activeSession.task_name}"\n`;
      statusMessage += `⏳ Time left: ${timeLeft} minutes`;
    } else {
      statusMessage += `💤 No active session\n\nReply START to begin!`;
    }

    return statusMessage;

  } catch (error) {
    console.error('Error handling STATUS command:', error);
    return '❌ Sorry, I couldn\'t retrieve your status. Please try again.';
  }
}

// Handle GET for webhook verification (Twilio requirement)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'WhatsApp webhook endpoint',
    status: 'active' 
  });
}
