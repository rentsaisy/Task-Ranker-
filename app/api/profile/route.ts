import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET profile by user ID from localStorage (client-side session)
export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || '1'
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return NextResponse.json({ name: 'Student', image: null }, { status: 200 })
    }
    
    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 200 })
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
    
    const id = userId || '1'
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Update existing user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, image }
    })
    
    return NextResponse.json({ success: true, name: updatedUser.name }, { status: 200 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
