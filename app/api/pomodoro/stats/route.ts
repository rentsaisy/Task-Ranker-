import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get today's completed sessions
    const [stats] = await pool.query<any[]>(
      `SELECT 
         COUNT(*) as completed_today,
         SUM(duration_minutes) as total_minutes
       FROM pomodoro_sessions
       WHERE user_id = ? 
         AND DATE(start_time) = CURDATE()
         AND status = 'completed'`,
      [userId]
    );

    return NextResponse.json({
      completed_today: stats[0]?.completed_today || 0,
      total_minutes: stats[0]?.total_minutes || 0,
    });

  } catch (error: any) {
    console.error('Error getting stats:', error);
    return NextResponse.json(
      { error: 'Failed to get stats', details: error.message },
      { status: 500 }
    );
  }
}
