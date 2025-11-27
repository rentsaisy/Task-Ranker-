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

    // Get user settings
    const [settings] = await pool.query<any[]>(
      `SELECT * FROM pomodoro_settings WHERE user_id = ?`,
      [userId]
    );

    if (settings.length === 0) {
      // Return defaults if no settings exist
      return NextResponse.json({
        default_duration: 25,
        enable_sound: true,
      });
    }

    return NextResponse.json(settings[0]);

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

    // Insert or update settings
    await pool.query(
      `INSERT INTO pomodoro_settings (user_id, default_duration, enable_sound)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         default_duration = VALUES(default_duration),
         enable_sound = VALUES(enable_sound)`,
      [userId, default_duration, enable_sound]
    );

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
