import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// GET all tasks
export async function GET() {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tasks ORDER BY priority DESC'
    )
    
    return NextResponse.json(rows, { status: 200 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST create new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, deadline, difficulty, weight, priority } = body
    
    const [result]: any = await pool.query(
      'INSERT INTO tasks (name, deadline, difficulty, weight, priority) VALUES (?, ?, ?, ?, ?)',
      [name, deadline, difficulty, weight, priority || 0]
    )
    
    return NextResponse.json(
      { success: true, id: result.insertId },
      { status: 201 }
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

// DELETE task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }
    
    await pool.query('DELETE FROM tasks WHERE id = ?', [id])
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}

// PUT update task
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, deadline, difficulty, weight, priority } = body
    
    await pool.query(
      'UPDATE tasks SET name = ?, deadline = ?, difficulty = ?, weight = ?, priority = ? WHERE id = ?',
      [name, deadline, difficulty, weight, priority, id]
    )
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}
