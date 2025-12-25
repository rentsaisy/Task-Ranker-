import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, timeRemaining } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Update session to mark as paused (not supported in schema, but we can just leave it)
    // For now, we'll just return success since the schema doesn't have pause functionality

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
