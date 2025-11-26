/**
 * API Route: Send Task List via WhatsApp
 * POST /api/whatsapp/send-tasks
 * 
 * Sends user's task list to their WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendTaskList, sendQuickStatus, sendDailySummary } from '@/lib/whatsapp-service';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, type } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's phone number
    const [users] = await pool.query<any[]>(
      'SELECT phone_number, whatsapp_verified FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    if (!user.phone_number) {
      return NextResponse.json(
        { error: 'Phone number not configured' },
        { status: 400 }
      );
    }

    if (!user.whatsapp_verified) {
      return NextResponse.json(
        { error: 'WhatsApp not verified for this number' },
        { status: 400 }
      );
    }

    // Send based on type
    let result;
    switch (type) {
      case 'all':
        result = await sendTaskList(userId, user.phone_number, 'all');
        break;
      case 'today':
        result = await sendTaskList(userId, user.phone_number, 'today');
        break;
      case 'priority':
        result = await sendTaskList(userId, user.phone_number, 'priority');
        break;
      case 'status':
        result = await sendQuickStatus(userId, user.phone_number);
        break;
      case 'summary':
        result = await sendDailySummary(userId, user.phone_number);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid type' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task list sent to WhatsApp',
      messageSid: result.messageSid,
    });

  } catch (error: any) {
    console.error('Error sending task list:', error);
    return NextResponse.json(
      { error: 'Failed to send task list', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to send task lists',
    availableTypes: ['all', 'today', 'priority', 'status', 'summary'],
  });
}
