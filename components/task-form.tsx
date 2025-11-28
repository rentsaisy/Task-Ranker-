"use client"

import type * as React from "react"

import { useState, useEffect } from "react"
import { Calendar, Brain, Sparkles, X } from "lucide-react"

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
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")

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
        
        // Don't auto-select, leave empty for placeholder
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, task_type_id: "" }))
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
      if (!formData.name) {
        showAlertPopup("Please enter a task name")
      } else if (!formData.task_type_id) {
        showAlertPopup("Please select a task type")
      } else if (!formData.deadline) {
        showAlertPopup("Please select a deadline")
      }
      return
    }
    onAddTask({
      ...formData,
      task_type_id: parseInt(formData.task_type_id)
    })
    setFormData({ 
      name: "", 
      task_type_id: "", 
      deadline: "" 
    })
  }

  const showAlertPopup = (message: string) => {
    setAlertMessage(message)
    setShowAlert(true)
    setTimeout(() => {
      setShowAlert(false)
    }, 3000)
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow smooth-transition h-fit">
      
      {/* Alert Popup */}
      {showAlert && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
            <div className="flex-1">
              <p className="font-semibold">{alertMessage}</p>
            </div>
            <button
              onClick={() => setShowAlert(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task Name */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Task Name</label>
          <input
            type="text"
            placeholder="Project or subject title, etc."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all smooth-transition"
          />
        </div>

        {/* Task Type */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Task Type</label>
          <select
            value={formData.task_type_id}
            onChange={(e) => setFormData({ ...formData, task_type_id: e.target.value })}
            className="w-full px-3.5 py-2.5 pr-8 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all smooth-transition appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat [background-image:url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2716%27%20height=%2716%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%23000000%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpolyline%20points=%276%209%2012%2015%2018%209%27%3E%3C/polyline%3E%3C/svg%3E')] dark:[background-image:url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2716%27%20height=%2716%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%23ffffff%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpolyline%20points=%276%209%2012%2015%2018%209%27%3E%3C/polyline%3E%3C/svg%3E')]"
            disabled={loading || taskTypes.length === 0}
          >
            {loading ? (
              <option value="">Loading...</option>
            ) : taskTypes.length === 0 ? (
              <option value="">No task types available - Create one first</option>
            ) : (
              <>
                <option value="">Choose task types</option>
                {taskTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} 
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Deadline</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all smooth-transition"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg text-foreground font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 smooth-transition flex items-center justify-center gap-2 mt-5 hover:brightness-110 active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          Generate Priority
        </button>
      </form>

    </div>
  )
}
