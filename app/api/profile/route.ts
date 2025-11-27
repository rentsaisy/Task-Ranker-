import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// GET profile by user ID from localStorage (client-side session)
export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || '1'
    
    const [rows]: any = await pool.query(
      'SELECT id, name, email, discord_user_id FROM users WHERE id = ?',
      [userId]
    )
    
    if (rows.length === 0) {
      return NextResponse.json({ name: 'Student', image: null, discordUserId: null }, { status: 200 })
    }
    
    const user = rows[0]
    return NextResponse.json({
      ...user,
      discordUserId: user.discord_user_id || null
    }, { status: 200 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { name: 'Student', image: null, discordUserId: null },
      { status: 200 }
    )
  }
}

// POST/PUT update profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, image, discordUserId } = body
    
    const id = userId || 1
    
    // Check if user exists
    const [rows]: any = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    )
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    } else {
      // Build update query based on provided fields
      const updates: string[] = []
      const values: any[] = []
      
      if (name !== undefined) {
        updates.push('name = ?')
        values.push(name)
      }
      if (image !== undefined) {
        updates.push('image = ?')
        values.push(image)
      }
      if (discordUserId !== undefined) {
        updates.push('discord_user_id = ?')
        values.push(discordUserId || null)
      }
      
      if (updates.length > 0) {
        values.push(id)
        await pool.query(
          `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
          values
        )
      }
    }
    
    return NextResponse.json({ success: true, name, image, discordUserId }, { status: 200 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
