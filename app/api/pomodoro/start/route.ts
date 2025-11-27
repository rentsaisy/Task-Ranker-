import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, taskId, duration } = await request.json();

    if (!userId || !duration) {
      return NextResponse.json(
        { error: 'userId and duration are required' },
        { status: 400 }
      );
    }

    const startTime = new Date();

    // Create new session
    const [result] = await pool.query(
      `INSERT INTO pomodoro_sessions 
       (user_id, task_id, duration_minutes, start_time, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [userId, taskId || null, duration, startTime]
    );

    const sessionId = (result as any).insertId;

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Timer started',
    });

  } catch (error: any) {
    console.error('Error starting timer:', error);
    return NextResponse.json(
      { error: 'Failed to start timer', details: error.message },
      { status: 500 }
    );
  }
}
