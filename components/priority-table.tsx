"use client"

import { TrendingUp } from "lucide-react"

interface Task {
  id: number
  title?: string
  name?: string
  due_date?: string
  deadline?: string
  task_type_name?: string
  taskType?: string
  priority_score?: number
  priority?: number
}

interface PriorityTableProps {
  tasks: Task[]
}

export default function PriorityTable({ tasks }: PriorityTableProps) {
  const sortedTasks = [...tasks].sort((a, b) => 
    (b.priority_score || b.priority || 0) - (a.priority_score || a.priority || 0)
  )

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
            <th className="text-left py-3 px-4 font-semibold text-foreground">Task Type</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Deadline</th>
            <th className="text-center py-3 px-4 font-semibold text-foreground">Priority</th>
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((task, index) => {
            const taskName = task.title || task.name || 'Untitled'
            const taskType = task.task_type_name || task.taskType || 'N/A'
            const deadline = task.due_date || task.deadline || ''
            const priority = task.priority_score || task.priority || 0
            
            return (
              <tr key={task.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-start gap-2">
                    <div className="text-xs font-bold text-primary mt-1">#{index + 1}</div>
                    <div>
                      <p className="font-medium text-foreground">{taskName}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{taskType}</td>
                <td className="py-3 px-4 text-muted-foreground">
                  {deadline ? new Date(deadline).toLocaleDateString() : 'No deadline'}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full font-semibold text-xs flex items-center gap-1 ${getPriorityColor(priority)}`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {Math.round(priority)}%
                    </span>
                  </div>
              </td>
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
