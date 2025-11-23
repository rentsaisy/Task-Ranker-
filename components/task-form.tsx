"use client"

import type * as React from "react"

import { useState } from "react"
import { Calendar, Brain, Sparkles } from "lucide-react"

interface TaskFormProps {
  onAddTask: (task: any) => void
}

export default function TaskForm({ onAddTask }: TaskFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    deadline: "",
    difficulty: 3,
    weight: 5,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.deadline) {
      alert("Please fill in all fields")
      return
    }
    onAddTask(formData)
    setFormData({ name: "", deadline: "", difficulty: 3, weight: 5 })
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow smooth-transition h-fit">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-md">
          <Brain className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Add New Task</h2>
          <p className="text-xs text-muted-foreground">Provide task details for ML analysis</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Task Name */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Task Name</label>
          <input
            type="text"
            placeholder="e.g., Chemistry Project"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all smooth-transition"
            required
          />
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Deadline</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all smooth-transition"
              required
            />
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-foreground">Difficulty Level</label>
            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {formData.difficulty}/5
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: Number.parseInt(e.target.value) })}
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Easy</span>
            <span>Hard</span>
          </div>
        </div>

        {/* Weight */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-foreground">Task Weight</label>
            <span className="text-sm font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">
              {formData.weight}/10
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: Number.parseInt(e.target.value) })}
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Low Impact</span>
            <span>High Impact</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg text-foreground font-semibold py-3 px-4 rounded-lg transition-all duration-200 smooth-transition flex items-center justify-center gap-2 mt-6 hover:brightness-110 active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          Generate Priority
        </button>
      </form>

      {/* ML Info Box */}
      <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 neural-pattern opacity-20" />
        <div className="relative z-10">
          <p className="text-xs text-foreground font-semibold mb-1 flex items-center gap-1">
            <Brain className="w-3 h-3" /> ML Optimization
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Our algorithm analyzes deadline urgency, task complexity, and importance to generate optimal priority
            scores.
          </p>
        </div>
      </div>
    </div>
  )
}
