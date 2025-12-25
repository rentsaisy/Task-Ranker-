import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Resume timer - return success for now
    return NextResponse.json({
      success: true,
      message: 'Timer resumed',
    });

  } catch (error: any) {
    console.error('Error resuming timer:', error);
    return NextResponse.json(
      { error: 'Failed to resume timer', details: error.message },
      { status: 500 }
    );
  }
}
