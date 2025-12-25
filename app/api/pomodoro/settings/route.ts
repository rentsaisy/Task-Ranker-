import { NextRequest, NextResponse } from 'next/server';

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

    // Return default pomodoro settings
    return NextResponse.json({
      default_duration: 25,
      enable_sound: true,
    });

  } catch (error: any) {
    console.error('Error getting settings:', error);
    return NextResponse.json(
      { error: 'Failed to get settings', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, default_duration, enable_sound } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // For now, just return success - implement database storage later
    return NextResponse.json({
      success: true,
      default_duration: default_duration || 25,
      enable_sound: enable_sound !== false
    }, { status: 200 });


    return NextResponse.json({
      success: true,
      message: 'Settings saved',
    });

  } catch (error: any) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings', details: error.message },
      { status: 500 }
    );
  }
}
