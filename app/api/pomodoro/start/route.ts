import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, taskId, duration } = await request.json();

    if (!userId || !duration) {
      return NextResponse.json(
        { error: 'userId and duration are required' },
        { status: 400 }
      );
    }

    // Create new focus session
    const session = await prisma.focusSession.create({
      data: {
        userId,
        taskId: taskId || null,
        duration,
        startedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
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
