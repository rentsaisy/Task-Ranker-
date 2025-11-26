/**
 * API Route: WhatsApp Webhook
 * POST /api/whatsapp/webhook
 * 
 * Handles incoming WhatsApp messages from Twilio
 * Supports commands: LIST, TODAY, PRIORITY, STATUS, HELP
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  handleIncomingMessage, 
  verifyWebhookSignature,
  sendWhatsAppMessage,
  sendTaskList,
  sendQuickStatus,
  sendDailySummary,
  MESSAGE_TEMPLATES,
} from '@/lib/whatsapp-service';
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
      case 'LIST':
        await handleListCommand(userId, from.replace('whatsapp:', ''));
        responseMessage = ''; // Response already sent
        break;

      case 'TODAY':
        await handleTodayCommand(userId, from.replace('whatsapp:', ''));
        responseMessage = '';
        break;

      case 'PRIORITY':
        await handlePriorityCommand(userId, from.replace('whatsapp:', ''));
        responseMessage = '';
        break;

      case 'STATUS':
        await handleStatusCommand(userId, from.replace('whatsapp:', ''));
        responseMessage = '';
        break;

      case 'SUMMARY':
        await handleSummaryCommand(userId, from.replace('whatsapp:', ''));
        responseMessage = '';
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
 * Handle LIST command - send all tasks
 */
async function handleListCommand(userId: number, phoneNumber: string): Promise<void> {
  await sendTaskList(userId, phoneNumber, 'all');
}

/**
 * Handle TODAY command - send today's tasks
 */
async function handleTodayCommand(userId: number, phoneNumber: string): Promise<void> {
  await sendTaskList(userId, phoneNumber, 'today');
}

/**
 * Handle PRIORITY command - send high priority tasks
 */
async function handlePriorityCommand(userId: number, phoneNumber: string): Promise<void> {
  await sendTaskList(userId, phoneNumber, 'priority');
}

/**
 * Handle STATUS command - show quick status
 */
async function handleStatusCommand(userId: number, phoneNumber: string): Promise<void> {
  await sendQuickStatus(userId, phoneNumber);
}

/**
 * Handle SUMMARY command - send daily summary
 */
async function handleSummaryCommand(userId: number, phoneNumber: string): Promise<void> {
  await sendDailySummary(userId, phoneNumber);
}

// Handle GET for webhook verification (Twilio requirement)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'WhatsApp webhook endpoint',
    status: 'active' 
  });
}
