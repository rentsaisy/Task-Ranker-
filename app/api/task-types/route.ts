import { NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "taskranker_db",
}

// GET - Fetch all task types
export async function GET() {
  let connection
  try {
    connection = await mysql.createConnection(dbConfig)
    const [rows] = await connection.execute(
      "SELECT id, name, default_difficulty, default_weight, created_at FROM task_types ORDER BY created_at DESC"
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      { error: "Failed to fetch task types" },
      { status: 500 }
    )
  } finally {
    if (connection) await connection.end()
  }
}

// POST - Create a new task type
export async function POST(request: NextRequest) {
  let connection
  try {
    const body = await request.json()
    const { name, default_difficulty, default_weight } = body

    if (!name || !default_difficulty || !default_weight) {
      return NextResponse.json(
        { error: "Name, difficulty, and weight are required" },
        { status: 400 }
      )
    }

    connection = await mysql.createConnection(dbConfig)
    const [result] = await connection.execute(
      "INSERT INTO task_types (name, default_difficulty, default_weight) VALUES (?, ?, ?)",
      [name, default_difficulty, default_weight]
    )

    const insertId = (result as any).insertId
    const [rows] = await connection.execute(
      "SELECT id, name, default_difficulty, default_weight, created_at FROM task_types WHERE id = ?",
      [insertId]
    ) as any

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      { error: "Failed to create task type" },
      { status: 500 }
    )
  } finally {
    if (connection) await connection.end()
  }
}

// PUT - Update a task type
export async function PUT(request: NextRequest) {
  let connection
  try {
    const body = await request.json()
    const { id, name, default_difficulty, default_weight } = body

    if (!id || !name || !default_difficulty || !default_weight) {
      return NextResponse.json(
        { error: "ID, name, difficulty, and weight are required" },
        { status: 400 }
      )
    }

    connection = await mysql.createConnection(dbConfig)
    await connection.execute(
      "UPDATE task_types SET name = ?, default_difficulty = ?, default_weight = ? WHERE id = ?",
      [name, default_difficulty, default_weight, id]
    )

    const [rows] = await connection.execute(
      "SELECT id, name, default_difficulty, default_weight, created_at FROM task_types WHERE id = ?",
      [id]
    ) as any

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      { error: "Failed to update task type" },
      { status: 500 }
    )
  } finally {
    if (connection) await connection.end()
  }
}

// DELETE - Delete a task type
export async function DELETE(request: NextRequest) {
  let connection
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      )
    }

    connection = await mysql.createConnection(dbConfig)
    
    // Check if any tasks are using this task type
    const [tasks] = await connection.execute(
      "SELECT COUNT(*) as count FROM tasks WHERE task_type_id = ?",
      [id]
    )
    
    const taskCount = (tasks as any)[0].count
    if (taskCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete task type. ${taskCount} task(s) are using this type.` },
        { status: 400 }
      )
    }

    await connection.execute("DELETE FROM task_types WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      { error: "Failed to delete task type" },
      { status: 500 }
    )
  } finally {
    if (connection) await connection.end()
  }
}
