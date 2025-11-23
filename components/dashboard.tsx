"use client"

import type React from "react"

import { useState } from "react"
import { Brain, TrendingUp, Zap, Calendar } from "lucide-react"
import TaskForm from "./task-form"
import PriorityTable from "./priority-table"
import PriorityChart from "./priority-chart"

export default function Dashboard() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      name: "Advanced Calculus Assignment",
      deadline: "2024-12-20",
      difficulty: 4,
      weight: 8,
      priority: 92,
    },
    {
      id: 2,
      name: "Physics Lab Report",
      deadline: "2024-12-18",
      difficulty: 3,
      weight: 6,
      priority: 78,
    },
    {
      id: 3,
      name: "Literature Essay",
      deadline: "2024-12-22",
      difficulty: 2,
      weight: 5,
      priority: 58,
    },
  ])

  const handleAddTask = (newTask: any) => {
    setTasks([...tasks, { ...newTask, id: tasks.length + 1, priority: Math.random() * 100 }])
  }

  const highPriorityCount = tasks.filter((t) => t.priority >= 80).length
  const avgPriority = Math.round(tasks.reduce((a, b) => a + b.priority, 0) / tasks.length)

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-secondary/20 to-background neural-bg">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-md smooth-transition">
              <Brain className="w-6 h-6 text-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          </div>
          <p className="text-muted-foreground ml-13">AI-powered academic task prioritization at a glance</p>
        </div>

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
            {/* Priority Chart */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow smooth-transition">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Priority Distribution</h2>
                  <p className="text-sm text-muted-foreground">ML-Ranked Tasks</p>
                </div>
              </div>
              <PriorityChart tasks={tasks} />
            </div>

            {/* Priority Table */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow smooth-transition">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Task Priorities</h2>
                  <p className="text-sm text-muted-foreground">Sorted by ML Priority Score</p>
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
