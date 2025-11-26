import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

// Helper function to calculate priority using ML model
async function calculatePriorityML(taskData: { due_date: string; difficulty: number; weight: number }): Promise<number> {
  try {
    const inputJson = JSON.stringify(taskData)
    const scriptPath = path.join(process.cwd(), 'ml_model', 'task_priority_model.py')
    const pythonCommand = `python "${scriptPath}" '${inputJson.replace(/'/g, "\\'")}'`
    
    const { stdout } = await execAsync(pythonCommand, { timeout: 5000 })
    const result = JSON.parse(stdout.trim())
    
    return result.priority || 50
  } catch (error) {
    console.error('ML calculation error:', error)
    return 50 // Default fallback
  }
}

// GET all tasks (with priority_score from database)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    let query = `
      SELECT t.*, tt.name as task_type_name, tt.default_difficulty, tt.default_weight
      FROM tasks t
      LEFT JOIN task_types tt ON t.task_type_id = tt.id
    `
    const params: any[] = []
    
    if (userId) {
      query += ' WHERE t.user_id = ?'
      params.push(userId)
    }
    
    query += ' ORDER BY t.priority_score DESC, t.due_date ASC'
    
    const [rows] = await pool.query(query, params)
    
    return NextResponse.json(rows, { status: 200 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST create new task (with ML priority calculation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, task_type_id, title, due_date } = body
    
    if (!user_id || !title || !due_date) {
      return NextResponse.json(
        { error: 'user_id, title, and due_date are required' },
        { status: 400 }
      )
    }
    
    // Get difficulty and weight from task_type if provided
    let difficulty = 5
    let weight = 5
    
    if (task_type_id) {
      const [taskTypes]: any = await pool.query(
        'SELECT default_difficulty, default_weight FROM task_types WHERE id = ?',
        [task_type_id]
      )
      if (taskTypes.length > 0) {
        difficulty = taskTypes[0].default_difficulty
        weight = taskTypes[0].default_weight
      }
    }
    
    // Calculate priority using ML model
    const priority_score = await calculatePriorityML({
      due_date,
      difficulty,
      weight
    })
    
    // Insert task into database
    const [result]: any = await pool.query(
      `INSERT INTO tasks (user_id, task_type_id, title, due_date, priority_score, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [user_id, task_type_id || null, title, due_date, priority_score]
    )
    
    return NextResponse.json(
      { 
        success: true, 
        id: result.insertId,
        priority_score 
      },
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

// PUT update task (recalculate priority with ML)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, task_type_id, title, due_date } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }
    
    // Get difficulty and weight from task_type
    let difficulty = 5
    let weight = 5
    
    if (task_type_id) {
      const [taskTypes]: any = await pool.query(
        'SELECT default_difficulty, default_weight FROM task_types WHERE id = ?',
        [task_type_id]
      )
      if (taskTypes.length > 0) {
        difficulty = taskTypes[0].default_difficulty
        weight = taskTypes[0].default_weight
      }
    }
    
    // Recalculate priority using ML model
    const priority_score = await calculatePriorityML({
      due_date,
      difficulty,
      weight
    })
    
    await pool.query(
      `UPDATE tasks 
       SET task_type_id = ?, title = ?, due_date = ?, priority_score = ?, updated_at = NOW()
       WHERE id = ?`,
      [task_type_id || null, title, due_date, priority_score, id]
    )
    
    return NextResponse.json({ success: true, priority_score }, { status: 200 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}
