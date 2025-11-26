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
    taskType: "Assignment",
    deadline: "",
  })

  const taskTypes = [
    "Assignment",
    "PPT/Presentation", 
    "Report",
    "Practicum/Lab",
    "Exam/Test",
    "Project",
    "Reminder",
    "Other"
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.deadline) {
      alert("Please fill in all fields")
      return
    }
    onAddTask(formData)
    setFormData({ name: "", taskType: "Assignment", deadline: "" })
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow smooth-transition h-fit">
      

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

        {/* Task Type */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Task Type</label>
          <select
            value={formData.taskType}
            onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all smooth-transition"
          >
            {taskTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
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

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg text-foreground font-semibold py-3 px-4 rounded-lg transition-all duration-200 smooth-transition flex items-center justify-center gap-2 mt-6 hover:brightness-110 active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          Generate Priority
        </button>
      </form>

    </div>
  )
}
