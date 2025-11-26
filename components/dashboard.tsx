"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Brain, TrendingUp, Zap, Calendar } from "lucide-react"
import TaskForm from "./task-form"
import PriorityTable from "./priority-table"
import PriorityChart from "./priority-chart"

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch tasks from database
  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks?userId=1') // TODO: Get userId from auth
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async (newTask: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1, // TODO: Get from auth
          task_type_id: newTask.task_type_id,
          title: newTask.name,
          due_date: newTask.deadline,
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Refresh task list
        fetchTasks()
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const highPriorityCount = tasks.filter((t) => (t.priority_score || 0) >= 80).length
  const avgPriority = tasks.length > 0 
    ? Math.round(tasks.reduce((a, b) => a + (b.priority_score || 0), 0) / tasks.length)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-secondary/20 to-background neural-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-secondary/20 to-background neural-bg">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Tasks"
            value={tasks.length.toString()}
            icon={TrendingUp}
            color="from-primary/20 to-primary/5"
            trend="+2 this week"
          />
          <StatCard
            title="High Priority"
            value={highPriorityCount.toString()}
            icon={Zap}
            color="from-accent/20 to-accent/5"
            trend="Critical tasks"
          />
          <StatCard
            title="Average Priority"
            value={avgPriority.toString()}
            icon={Calendar}
            color="from-blue-200/20 to-blue-200/5"
            trend="Score"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-1">
            <TaskForm onAddTask={handleAddTask} />
          </div>  

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Priority Table */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow smooth-transition">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Ranking</h2>
                  <p className="text-sm text-muted-foreground">Finish it before it finish u</p>
                </div>
              </div>
              <PriorityTable tasks={tasks} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon: React.ComponentType<{ className: string }>
  color: string
  trend: string
}

function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  return (
    <div
      className={`bg-gradient-to-br ${color} border border-border rounded-xl p-6 smooth-transition hover:shadow-md hover:border-primary/30`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
          <p className="text-xs text-muted-foreground mt-2">{trend}</p>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </div>
  )
}
