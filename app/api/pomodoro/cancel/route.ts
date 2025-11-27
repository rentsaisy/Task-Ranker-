import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE pomodoro_sessions 
       SET status = 'cancelled', end_time = NOW()
       WHERE id = ?`,
      [sessionId]
    );

    return NextResponse.json({
      success: true,
      message: 'Timer cancelled',
    });

  } catch (error: any) {
    console.error('Error cancelling timer:', error);
    return NextResponse.json(
      { error: 'Failed to cancel timer', details: error.message },
      { status: 500 }
    );
  }
}
