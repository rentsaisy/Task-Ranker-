"use client"

import { useState } from "react"
import { TrendingUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

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
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const sortedTasks = [...tasks].sort((a, b) => 
    (b.priority_score || b.priority || 0) - (a.priority_score || a.priority || 0)
  )

  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTasks = sortedTasks.slice(startIndex, endIndex)

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
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-1.5 px-2.5 font-semibold text-foreground text-xs">Task Name</th>
              <th className="text-left py-1.5 px-2.5 font-semibold text-foreground text-xs">Task Type</th>
              <th className="text-left py-1.5 px-2.5 font-semibold text-foreground text-xs">Deadline</th>
              <th className="text-center py-1.5 px-2.5 font-semibold text-foreground text-xs">Priority</th>
            </tr>
          </thead>
          <tbody>
            {currentTasks.map((task, index) => {
              const taskName = task.title || task.name || 'Untitled'
              const taskType = task.task_type_name || task.taskType || 'N/A'
              const deadline = task.due_date || task.deadline || ''
              const priority = task.priority_score || task.priority || 0
              const globalIndex = startIndex + index
              
              return (
                <tr key={task.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="py-1.5 px-2.5">
                    <div className="flex items-start gap-1.5">
                      <div className="text-xs font-bold text-primary mt-0.5">#{globalIndex + 1}</div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{taskName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-1.5 px-2.5 text-muted-foreground text-sm">{taskType}</td>
                  <td className="py-1.5 px-2.5 text-muted-foreground text-sm">
                    {deadline ? new Date(deadline).toLocaleDateString() : 'No deadline'}
                  </td>
                  <td className="py-1.5 px-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-xs flex items-center gap-1 ${getPriorityColor(priority)}`}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="px-4 py-1 rounded-lg bg-secondary text-foreground text-sm font-medium">
            {currentPage}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
