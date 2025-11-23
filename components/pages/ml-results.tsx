"use client"

import { Brain, TrendingUp, Zap, AlertCircle } from "lucide-react"
import PriorityChart from "../priority-chart"

const mockTasks = [
  { id: 1, name: "Advanced Calculus Assignment", priority: 92 },
  { id: 2, name: "Physics Lab Report", priority: 78 },
  { id: 3, name: "Literature Essay", priority: 58 },
]

export default function MLResultsPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-secondary/20 to-background neural-bg">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-md">
              <Brain className="w-6 h-6 text-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">ML Priority Results</h1>
          </div>
          <p className="text-muted-foreground ml-13">Machine learning analysis of your task priorities</p>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Chart */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-6">Priority Distribution</h2>
            <PriorityChart tasks={mockTasks} />
          </div>

          {/* Insights */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 dark:from-red-900/20 dark:to-red-900/10 border border-red-500/30 dark:border-red-700/30 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Critical Priority</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced Calculus Assignment requires immediate attention with a 92% priority score.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/15 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/30 dark:border-primary/40 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Trending Tasks</h3>
                  <p className="text-sm text-muted-foreground">
                    3 tasks currently require focus. Physics Lab Report approaching deadline.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-accent/15 to-accent/5 dark:from-accent/20 dark:to-accent/10 border border-accent/30 dark:border-accent/40 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">ML Optimization</h3>
                  <p className="text-sm text-muted-foreground">
                    Algorithm suggests completing high-weight tasks first for maximum GPA impact.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
