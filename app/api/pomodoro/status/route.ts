/**
 * API Route: Get Pomodoro Status
 * GET /api/pomodoro/status
 * 
 * Returns current session and today's statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveSession, getTodaySessionCount } from '@/lib/pomodoro-scheduler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get active session
    const activeSession = await getActiveSession(Number(userId));

    // Get today's statistics
    const stats = await getTodaySessionCount(Number(userId));

    return NextResponse.json({
      success: true,
      data: {
        activeSession: activeSession ? {
          id: activeSession.id,
          taskId: activeSession.task_id,
          taskName: activeSession.task_name,
          taskType: activeSession.task_type,
          mode: activeSession.mode,
          sessionNumber: activeSession.session_number,
          startTime: activeSession.start_time,
          endTime: activeSession.end_time,
          durationMinutes: activeSession.duration_minutes,
          status: activeSession.status,
          pausedAt: activeSession.paused_at,
          pausedDuration: activeSession.paused_duration_seconds,
        } : null,
        todayStats: {
          totalSessions: stats.total_sessions || 0,
          completedFocus: stats.completed_focus || 0,
          totalFocusMinutes: stats.total_focus_minutes || 0,
        },
      },
    });

  } catch (error: any) {
    console.error('Error getting Pomodoro status:', error);
    return NextResponse.json(
      { error: 'Failed to get Pomodoro status', details: error.message },
      { status: 500 }
    );
  }
}
