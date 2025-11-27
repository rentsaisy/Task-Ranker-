import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, timeRemaining } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE pomodoro_sessions 
       SET status = 'paused', paused_at = NOW(), time_remaining_seconds = ?
       WHERE id = ?`,
      [timeRemaining, sessionId]
    );

    return NextResponse.json({
      success: true,
      message: 'Timer paused',
    });

  } catch (error: any) {
    console.error('Error pausing timer:', error);
    return NextResponse.json(
      { error: 'Failed to pause timer', details: error.message },
      { status: 500 }
    );
  }
}
