"use client"

import type * as React from "react"

import { useState, useEffect } from "react"
import { Calendar, Brain, Sparkles } from "lucide-react"

interface TaskFormProps {
  onAddTask: (task: any) => void
}

interface TaskType {
  id: number
  name: string
  default_difficulty: number
  default_weight: number
}

export default function TaskForm({ onAddTask }: TaskFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    task_type_id: "",
    deadline: "",
  })

  const [taskTypes, setTaskTypes] = useState<TaskType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTaskTypes()
  }, [])

  const fetchTaskTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/task-types')
      
      if (!response.ok) {
        throw new Error('Failed to fetch task types')
      }
      
      const data = await response.json()
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setTaskTypes(data)
        
        // Set first task type as default
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, task_type_id: data[0].id.toString() }))
        }
      } else {
        console.error('Invalid data format:', data)
        setTaskTypes([])
      }
    } catch (error) {
      console.error('Error fetching task types:', error)
      setTaskTypes([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.deadline || !formData.task_type_id) {
      alert("Please fill in all fields")
      return
    }
    onAddTask({
      ...formData,
      task_type_id: parseInt(formData.task_type_id)
    })
    setFormData({ 
      name: "", 
      task_type_id: taskTypes.length > 0 ? taskTypes[0].id.toString() : "", 
      deadline: "" 
    })
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
            value={formData.task_type_id}
            onChange={(e) => setFormData({ ...formData, task_type_id: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all smooth-transition"
            disabled={loading || taskTypes.length === 0}
          >
            {loading ? (
              <option value="">Loading task types...</option>
            ) : taskTypes.length === 0 ? (
              <option value="">No task types available - Create one first</option>
            ) : (
              taskTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} (Difficulty: {type.default_difficulty}/10, Weight: {type.default_weight}/10)
                </option>
              ))
            )}
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
