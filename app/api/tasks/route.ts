import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// Helper function to retry database operations
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error | null = null
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      // Only retry on connection errors, not on validation errors
      if (error?.code !== 'P1001' && error?.code !== 'P1002') {
        throw error
      }
      // Exponential backoff: 100ms, 200ms, 400ms
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)))
      }
    }
  }
  
  throw lastError
}

// Helper function to calculate priority
// Using formula: base + difficulty_weight + deadline_urgency
function calculatePriority(taskData: { due_date: string; difficulty: number; weight: number }): number {
  // Base priority from difficulty and weight (0-50)
  const difficultyScore = Math.min(taskData.difficulty * 5, 50)
  const weightScore = Math.min(taskData.weight * 5, 50)
  const baseScore = Math.min((difficultyScore + weightScore) / 2, 50)
  
  // Deadline urgency bonus (0-50)
  let deadlineScore = 0
  if (taskData.due_date) {
    const dueDate = new Date(taskData.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    // More urgent = higher score
    // Due today or overdue = 50
    // Due tomorrow = 40
    // Due in 3 days = 30
    // Due in 7+ days = 10
    if (daysUntilDue <= 0) {
      deadlineScore = 50
    } else if (daysUntilDue === 1) {
      deadlineScore = 40
    } else if (daysUntilDue <= 3) {
      deadlineScore = 30
    } else if (daysUntilDue <= 7) {
      deadlineScore = 20
    } else {
      deadlineScore = 10
    }
  } else {
    deadlineScore = 5 // Low priority if no deadline
  }
  
  // Combined priority (0-100)
  return Math.min(Math.round(baseScore + deadlineScore), 100)
}

// GET all tasks (with priority_score from database)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    const tasks = await withRetry(() =>
      prisma.task.findMany({
        where: userId ? { userId } : {},
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ]
      })
    )
    
    // Map tasks to include task type name with retry
    const tasksWithTypeNames = await Promise.all(
      tasks.map(async (task) => {
        let taskTypeName = 'N/A'
        if (task.taskType) {
          try {
            const taskTypeObj = await withRetry(() =>
              prisma.taskType.findUnique({
                where: { 
                  id: task.taskType || undefined
                }
              })
            )
            if (taskTypeObj) {
              taskTypeName = taskTypeObj.name
            }
          } catch (error) {
            console.error('Failed to fetch task type for id:', task.taskType, error)
            // Keep 'N/A' as fallback
          }
        }
        
        return {
          id: task.id,
          title: task.title,
          description: task.description,
          priority_score: task.priority,
          task_type_id: task.taskType,
          task_type_name: taskTypeName,
          due_date: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
          completed: task.completed,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          userId: task.userId
        }
      })
    )
    
    return NextResponse.json(tasksWithTypeNames, { status: 200 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST create new task (with priority calculation)
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
      const taskType = await withRetry(() =>
        prisma.taskType.findUnique({
          where: { id: task_type_id }
        })
      )
      if (taskType && taskType.userId === user_id) {
        difficulty = taskType.defaultDifficulty
        weight = taskType.defaultWeight
      } else if (!taskType) {
        console.warn(`Task type with id ${task_type_id} not found`)
      }
    }
    
    // Calculate priority using simple formula
    const priority_score = calculatePriority({
      due_date,
      difficulty,
      weight
    })

    // Create task
    const task = await withRetry(() =>
      prisma.task.create({
        data: {
          userId: user_id,
          taskType: task_type_id || null,
          title,
          dueDate: due_date ? new Date(due_date) : null,
          priority: Math.round(priority_score)
        }
      })
    )

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
    
    await withRetry(() =>
      prisma.task.delete({
        where: { id }
      })
    )
    
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
      const taskType = await withRetry(() =>
        prisma.taskType.findUnique({
          where: { id: task_type_id }
        })
      )
      if (taskType) {
        difficulty = taskType.defaultDifficulty
        weight = taskType.defaultWeight
      }
    }
    
    // Recalculate priority using simple formula
    const priority_score = calculatePriority({
      due_date,
      difficulty,
      weight
    })
    
    await withRetry(() =>
      prisma.task.update({
        where: { id },
        data: {
          taskType: task_type_id || null,
          title,
          dueDate: due_date ? new Date(due_date) : null,
          priority: Math.round(priority_score)
        }
      })
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
