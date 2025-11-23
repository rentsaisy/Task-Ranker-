import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier, password } = body

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Username/Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email or name
    const [rows]: any = await pool.query(
      'SELECT * FROM users WHERE email = ? OR name = ?',
      [identifier, identifier]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid username/email or password' },
        { status: 401 }
      )
    }

    const user = rows[0]

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid username/email or password' },
        { status: 401 }
      )
    }

    // Return user data (exclude password)
    const { password_hash: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { 
        success: true,
        user: userWithoutPassword
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
