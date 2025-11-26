/**
 * API Route: Pause Pomodoro Session
 * POST /api/pomodoro/pause
 * 
 * Pauses the currently active Pomodoro session
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

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
        `SELECT id, status FROM pomodoro_sessions 
         WHERE user_id = ? AND status = 'active'
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

    // Pause the session
    await pool.query(
      `UPDATE pomodoro_sessions 
       SET status = 'paused', paused_at = NOW()
       WHERE id = ? AND user_id = ? AND status = 'active'`,
      [targetSessionId, userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Pomodoro session paused',
      sessionId: targetSessionId,
      pausedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error pausing Pomodoro:', error);
    return NextResponse.json(
      { error: 'Failed to pause Pomodoro session', details: error.message },
      { status: 500 }
    );
  }
}
