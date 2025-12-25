import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
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
    
    const tasks = await prisma.task.findMany({
      where: userId ? { userId } : {},
      include: { type: true },
      orderBy: [
        { priorityScore: 'desc' },
        { dueDate: 'asc' }
      ]
    })
    
    return NextResponse.json(tasks, { status: 200 })
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
      const taskType = await prisma.taskType.findUnique({
        where: { id: task_type_id }
      })
      if (taskType) {
        difficulty = taskType.defaultDifficulty
        weight = taskType.defaultWeight
      }
    }
    
    // Check task count for this user
    const taskCount = await prisma.task.count({
      where: { userId: user_id }
    })
    const isFirstTask = taskCount === 0

    // Calculate priority using ML model or set to 100 if first task
    let priority_score = 100
    if (!isFirstTask) {
      priority_score = await calculatePriorityML({
        due_date,
        difficulty,
        weight
      })
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        userId: user_id,
        typeId: task_type_id || null,
        title,
        dueDate: new Date(due_date),
        priorityScore: priority_score
      },
      include: { type: true }
    })

    return NextResponse.json(
      { 
        success: true, 
        id: task.id,
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
    
    await prisma.task.delete({
      where: { id }
    })
    
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
      const taskType = await prisma.taskType.findUnique({
        where: { id: task_type_id }
      })
      if (taskType) {
        difficulty = taskType.defaultDifficulty
        weight = taskType.defaultWeight
      }
    }
    
    // Recalculate priority using ML model
    const priority_score = await calculatePriorityML({
      due_date,
      difficulty,
      weight
    })
    
    await prisma.task.update({
      where: { id },
      data: {
        typeId: task_type_id || null,
        title,
        dueDate: new Date(due_date),
        priorityScore: priority_score
      }
    })
    
    return NextResponse.json({ success: true, priority_score }, { status: 200 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}
