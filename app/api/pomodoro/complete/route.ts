import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Mark session as completed
    await prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        completed: true,
        completedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Timer completed',
    });

  } catch (error: any) {
    console.error('Error completing timer:', error);
    return NextResponse.json(
      { error: 'Failed to complete timer', details: error.message },
      { status: 500 }
    );
  }
}
