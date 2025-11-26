/**
 * API Route: Stop/Cancel Pomodoro Session
 * POST /api/pomodoro/stop
 * 
 * Cancels active Pomodoro session and its scheduled notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cancelNotification } from '@/lib/pomodoro-scheduler';
import { sendWhatsAppMessage, MESSAGE_TEMPLATES } from '@/lib/whatsapp-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get active session
    let targetSessionId = sessionId;
    
    if (!targetSessionId) {
      const [sessions] = await pool.query<any[]>(
        `SELECT id FROM pomodoro_sessions 
         WHERE user_id = ? AND status IN ('active', 'paused')
         ORDER BY start_time DESC LIMIT 1`,
        [userId]
      );

      if (sessions.length === 0) {
        return NextResponse.json(
          { error: 'No active Pomodoro session found' },
          { status: 404 }
        );
      }

      targetSessionId = sessions[0].id;
    }

    // Cancel the session
    await pool.query(
      `UPDATE pomodoro_sessions 
       SET status = 'cancelled', interrupted = TRUE, actual_end_time = NOW()
       WHERE id = ? AND user_id = ?`,
      [targetSessionId, userId]
    );

    // Cancel scheduled notifications
    await cancelNotification(targetSessionId);

    // Send WhatsApp notification
    const [users] = await pool.query<any[]>(
      `SELECT phone_number, whatsapp_verified FROM users WHERE id = ?`,
      [userId]
    );

    if (users[0]?.whatsapp_verified && users[0]?.phone_number) {
      await sendWhatsAppMessage({
        userId,
        phoneNumber: users[0].phone_number,
        message: MESSAGE_TEMPLATES.SESSION_CANCELLED(),
        pomodoroSessionId: targetSessionId,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Pomodoro session cancelled',
      sessionId: targetSessionId,
    });

  } catch (error: any) {
    console.error('Error stopping Pomodoro:', error);
    return NextResponse.json(
      { error: 'Failed to stop Pomodoro session', details: error.message },
      { status: 500 }
    );
  }
}
