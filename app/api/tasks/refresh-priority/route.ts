import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// POST: Trigger full ML refresh for all tasks of a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const user_id = body.user_id
    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    // Get all tasks for user
    const [tasks]: any = await pool.query(
      'SELECT id, due_date, task_type_id FROM tasks WHERE user_id = ?',
      [user_id]
    )
    if (tasks.length === 0) {
      return NextResponse.json({ success: true, message: 'No tasks to refresh.' }, { status: 200 })
    }

    // Get difficulty and weight for each task (type matters)
    const tasksWithFeatures = await Promise.all(
      tasks.map(async (task: any) => {
        let diff = 5, w = 5, typeName = ''
        if (task.task_type_id) {
          const [tt]: any = await pool.query('SELECT name, default_difficulty, default_weight FROM task_types WHERE id = ?', [task.task_type_id])
          if (tt.length > 0) {
            diff = tt[0].default_difficulty
            w = tt[0].default_weight
            typeName = tt[0].name
          }
        }
        return {
          id: task.id,
          due_date: task.due_date,
          difficulty: diff,
          weight: w,
          type: typeName
        }
      })
    )

    // Batch ML prediction (type, deadline, difficulty, weight)
    const inputForML = tasksWithFeatures.map(t => ({ due_date: t.due_date, difficulty: t.difficulty, weight: t.weight, type: t.type }))
    const scriptPath = path.join(process.cwd(), 'ml_model', 'task_priority_model.py')
    const inputJson = JSON.stringify(inputForML)
    // Escape double quotes for shell
    const safeInputJson = inputJson.replace(/"/g, '"')
    const pythonCommand = `python "${scriptPath}" "${safeInputJson}"`
    let priorities: number[] = []
    try {
      const { stdout } = await execAsync(pythonCommand, { timeout: 10000 })
      const result = JSON.parse(stdout.trim())
      priorities = result.priorities || []
      // Always normalize so sum = 100
      const sum = priorities.reduce((a, b) => a + b, 0)
      if (sum !== 100 && priorities.length > 0) {
        priorities = priorities.map(p => +(p * 100 / sum).toFixed(2))
      }
    } catch (err) {
      console.error('Batch ML error:', err)
      priorities = tasksWithFeatures.map(() => +(100 / tasksWithFeatures.length).toFixed(2))
    }

    // Update each task's priority_score
    await Promise.all(
      tasksWithFeatures.map((task, idx) =>
        pool.query('UPDATE tasks SET priority_score = ? WHERE id = ?', [priorities[idx] || 0, task.id])
      )
    )

    return NextResponse.json({ success: true, updated: tasks.length }, { status: 200 })
  } catch (error) {
    console.error('Refresh priority error:', error)
    return NextResponse.json({ error: 'Failed to refresh priorities' }, { status: 500 })
  }
}
