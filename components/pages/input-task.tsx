"use client"

import { Plus, Brain, CheckCircle } from "lucide-react"
import TaskForm from "../task-form"
import { useState } from "react"

export default function InputTaskPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleAddTask = (task: any) => {
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2000)
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-secondary/20 to-background neural-bg">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-md">
              <Plus className="w-6 h-6 text-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Input New Task</h1>
          </div>
          <p className="text-muted-foreground ml-13">Add and analyze academic tasks with ML-powered prioritization</p>
        </div>

        {/* Main Form Card */}
        <div className="space-y-6">
          <TaskForm onAddTask={handleAddTask} />

          {/* Success Feedback */}
          {submitted && (
            <div className="bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/50 rounded-xl p-6 flex items-center gap-4 smooth-transition">
              <CheckCircle className="w-6 h-6 text-accent flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Task added successfully!</p>
                <p className="text-xs text-muted-foreground">
                  Your task has been analyzed and added to the priority queue.
                </p>
              </div>
            </div>
          )}

          {/* Tips Section */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Tips for Better Prioritization
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Be specific with task names for better ML analysis</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent font-bold">•</span>
                <span>Set realistic deadlines to improve priority predictions</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Adjust weight based on grading impact and requirements</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
