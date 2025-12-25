import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
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
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    })

    // Return user data
    return NextResponse.json(
      { 
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'An error occurred during registration'
    
    if (error.code === 'P2002') {
      errorMessage = 'Email already registered'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error.code || error.message },
      { status: 500 }
    )
  }
}
