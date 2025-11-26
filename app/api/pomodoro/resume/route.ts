/**
 * API Route: Resume Pomodoro Session
 * POST /api/pomodoro/resume
 * 
 * Resumes a paused Pomodoro session
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

    // Get paused session
    let targetSessionId = sessionId;
    
    if (!targetSessionId) {
      const [sessions] = await pool.query<any[]>(
        `SELECT id, paused_at, paused_duration_seconds FROM pomodoro_sessions 
         WHERE user_id = ? AND status = 'paused'
         ORDER BY start_time DESC LIMIT 1`,
        [userId]
      );

      if (sessions.length === 0) {
        return NextResponse.json(
          { error: 'No paused Pomodoro session found' },
          { status: 404 }
        );
      }

      targetSessionId = sessions[0].id;
      
      // Calculate how long it was paused
      const pausedAt = new Date(sessions[0].paused_at);
      const now = new Date();
      const pauseDuration = Math.floor((now.getTime() - pausedAt.getTime()) / 1000);
      const totalPausedDuration = sessions[0].paused_duration_seconds + pauseDuration;

      // Update session with accumulated pause time
      await pool.query(
        `UPDATE pomodoro_sessions 
         SET status = 'active', paused_duration_seconds = ?
         WHERE id = ?`,
        [totalPausedDuration, targetSessionId]
      );
    } else {
      // Just resume without calculating pause duration
      await pool.query(
        `UPDATE pomodoro_sessions 
         SET status = 'active'
         WHERE id = ? AND user_id = ? AND status = 'paused'`,
        [targetSessionId, userId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pomodoro session resumed',
      sessionId: targetSessionId,
      resumedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error resuming Pomodoro:', error);
    return NextResponse.json(
      { error: 'Failed to resume Pomodoro session', details: error.message },
      { status: 500 }
    );
  }
}
