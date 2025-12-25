import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

// GET - Fetch all task types
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    if (!userId) {
      return NextResponse.json([], { status: 200 })
    }
    
    const taskTypes = await prisma.taskType.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(taskTypes)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      { error: "Failed to fetch task types" },
      { status: 500 }
    )
  }
}

// POST - Create a new task type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, default_difficulty, default_weight, user_id } = body

    if (!name || !default_difficulty || !default_weight || !user_id) {
      return NextResponse.json(
        { error: "Name, difficulty, weight, and user_id are required" },
        { status: 400 }
      )
    }

    const taskType = await prisma.taskType.create({
      data: {
        name,
        defaultDifficulty: default_difficulty,
        defaultWeight: default_weight,
        userId: user_id
      }
    })

    return NextResponse.json(taskType, { status: 201 })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      { error: "Failed to create task type" },
      { status: 500 }
    )
  }
}

// PUT - Update a task type
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, default_difficulty, default_weight } = body

    if (!id || !name || !default_difficulty || !default_weight) {
      return NextResponse.json(
        { error: "ID, name, difficulty, and weight are required" },
        { status: 400 }
      )
    }

    const taskType = await prisma.taskType.update({
      where: { id },
      data: {
        name,
        defaultDifficulty: default_difficulty,
        defaultWeight: default_weight
      }
    })

    return NextResponse.json(taskType)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      { error: "Failed to update task type" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a task type
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      )
    }

    // Check if any tasks are using this task type
    const taskCount = await prisma.task.count({
      where: { typeId: id }
    })
    
    if (taskCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete task type. ${taskCount} task(s) are using this type.` },
        { status: 400 }
      )
    }

    await prisma.taskType.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      { error: "Failed to delete task type" },
      { status: 500 }
    )
  }
}
