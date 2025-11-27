/**
 * API Route: Start Pomodoro Session
 * POST /api/pomodoro/start
 * 
 * Starts a new Pomodoro session
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { startPomodoroSession } from '@/lib/pomodoro-scheduler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, taskId, mode, duration, sessionNumber } = body;

    // Validation
    if (!userId || !taskId) {
      return NextResponse.json(
        { error: 'userId and taskId are required' },
        { status: 400 }
      );
    }

    // Check if user already has an active session
    const [activeSessions] = await pool.query<any[]>(
      `SELECT id FROM pomodoro_sessions 
       WHERE user_id = ? AND status IN ('active', 'paused')`,
      [userId]
    );

    if (activeSessions.length > 0) {
      return NextResponse.json(
        { error: 'You already have an active Pomodoro session' },
        { status: 400 }
      );
    }

    // Get user's settings or use defaults
    const [settings] = await pool.query<any[]>(
      `SELECT * FROM pomodoro_settings WHERE user_id = ?`,
      [userId]
    );

    const userSettings = settings[0] || {
      focus_duration: 25,
      short_break_duration: 5,
      long_break_duration: 15,
    };

    // Determine duration based on mode
    const sessionDuration = duration || 
      (mode === 'focus' ? userSettings.focus_duration :
       mode === 'short_break' ? userSettings.short_break_duration :
       userSettings.long_break_duration);

    const sessionNum = sessionNumber || 1;

    // Start session (creates DB record and schedules notification)
    const sessionId = await startPomodoroSession({
      userId,
      taskId,
      duration: sessionDuration,
      mode: mode || 'focus',
      sessionNumber: sessionNum,
    });

    // Get task details
    const [tasks] = await pool.query<any[]>(
      `SELECT name FROM tasks WHERE id = ?`,
      [taskId]
    );

    const taskName = tasks[0]?.name || 'Unknown Task';

    // Session started successfully

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Pomodoro session started',
      data: {
        sessionId,
        taskId,
        taskName,
        mode,
        duration: sessionDuration,
        sessionNumber: sessionNum,
        startTime: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Error starting Pomodoro:', error);
    return NextResponse.json(
      { error: 'Failed to start Pomodoro session', details: error.message },
      { status: 500 }
    );
  }
}
