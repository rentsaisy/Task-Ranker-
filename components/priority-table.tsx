"use client"

import { TrendingUp } from "lucide-react"

interface Task {
  id: number
  name: string
  deadline: string
  difficulty: number
  weight: number
  priority: number
}

interface PriorityTableProps {
  tasks: Task[]
}

export default function PriorityTable({ tasks }: PriorityTableProps) {
  const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority)

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return "bg-red-100 text-red-700"
    if (priority >= 60) return "bg-accent/20 text-foreground"
    return "bg-secondary text-muted-foreground"
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 80) return "Critical"
    if (priority >= 60) return "Medium"
    return "Low"
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-semibold text-foreground">Task Name</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Deadline</th>
            <th className="text-center py-3 px-4 font-semibold text-foreground">Difficulty</th>
            <th className="text-center py-3 px-4 font-semibold text-foreground">Weight</th>
            <th className="text-center py-3 px-4 font-semibold text-foreground">Priority</th>
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((task, index) => (
            <tr key={task.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-start gap-2">
                  <div className="text-xs font-bold text-primary mt-1">#{index + 1}</div>
                  <div>
                    <p className="font-medium text-foreground">{task.name}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-muted-foreground">{new Date(task.deadline).toLocaleDateString()}</td>
              <td className="py-3 px-4 text-center">
                <div className="flex justify-center gap-1">
                  {Array.from({ length: task.difficulty }).map((_, i) => (
                    <div key={i} className="w-1.5 h-5 bg-accent rounded-sm" />
                  ))}
                </div>
              </td>
              <td className="py-3 px-4 text-center font-semibold text-foreground">{task.weight}</td>
              <td className="py-3 px-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full font-semibold text-xs flex items-center gap-1 ${getPriorityColor(task.priority)}`}
                  >
                    <TrendingUp className="w-3 h-3" />
                    {Math.round(task.priority)}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
