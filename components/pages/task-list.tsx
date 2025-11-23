"use client"

import { List, Calendar, Trash2 } from "lucide-react"
import { useState } from "react"

interface Task {
  id: number
  name: string
  deadline: string
  difficulty: number
  weight: number
}

export default function TaskListPage() {
  const [tasks] = useState<Task[]>([
    { id: 1, name: "Advanced Calculus Assignment", deadline: "2024-12-20", difficulty: 4, weight: 8 },
    { id: 2, name: "Physics Lab Report", deadline: "2024-12-18", difficulty: 3, weight: 6 },
    { id: 3, name: "Literature Essay", deadline: "2024-12-22", difficulty: 2, weight: 5 },
  ])

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-secondary/20 to-background neural-bg">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-md">
              <List className="w-6 h-6 text-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Task List</h1>
          </div>
          <p className="text-muted-foreground ml-13">Manage all your academic tasks in one place</p>
        </div>

        {/* Tasks Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Task Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Deadline</th>
                  <th className="text-center py-4 px-6 font-semibold text-foreground">Difficulty</th>
                  <th className="text-center py-4 px-6 font-semibold text-foreground">Weight</th>
                  <th className="text-center py-4 px-6 font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b border-border hover:bg-secondary/50 smooth-transition">
                    <td className="py-4 px-6 font-medium text-foreground">{task.name}</td>
                    <td className="py-4 px-6 text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(task.deadline).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-1">
                        {Array.from({ length: task.difficulty }).map((_, i) => (
                          <div key={i} className="w-1.5 h-5 bg-accent rounded-sm" />
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center font-semibold text-foreground">{task.weight}</td>
                    <td className="py-4 px-6 text-center">
                      <button className="p-2 hover:bg-secondary rounded-lg transition-colors smooth-transition">
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
