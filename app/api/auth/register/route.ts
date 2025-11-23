import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const [existingUsers]: any = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert new user
    const [result]: any = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    )

    // Return user data (image will be handled on frontend as default person icon)
    return NextResponse.json(
      { 
        success: true,
        user: {
          id: result.insertId,
          name,
          email
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'An error occurred during registration'
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Database connection failed. Make sure MySQL is running in Laragon.'
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Database tables not found. Please run the database setup SQL.'
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      errorMessage = 'Database "taskranker_db" not found. Please create it in Laragon.'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error.code || error.message },
      { status: 500 }
    )
  }
}
