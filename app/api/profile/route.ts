import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// GET profile by user ID from localStorage (client-side session)
export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || '1'
    
    const [rows]: any = await pool.query(
      'SELECT id, name, email, image FROM users WHERE id = ?',
      [userId]
    )
    
    if (rows.length === 0) {
      return NextResponse.json({ name: 'Student', image: null }, { status: 200 })
    }
    
    return NextResponse.json(rows[0], { status: 200 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { name: 'Student', image: null },
      { status: 200 }
    )
  }
}

// POST/PUT update profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, image } = body
    
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
      // Update existing user
      await pool.query(
        'UPDATE users SET name = ?, image = ? WHERE id = ?',
        [name, image, id]
      )
    }
    
    return NextResponse.json({ success: true, name, image }, { status: 200 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
