"use client"

import { Plus, Brain, CheckCircle, Trash2, Edit, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"

interface TaskType {
  id: number
  name: string
  default_difficulty: number
  default_weight: number
}

export default function InputTaskTypePage() {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    difficulty: 3,
    weight: 5,
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingTaskType, setDeletingTaskType] = useState<TaskType | null>(null)

  useEffect(() => {
    fetchTaskTypes()
  }, [])

  const fetchTaskTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/task-types?userId=1')
      const data = await response.json()
      setTaskTypes(data)
    } catch (error) {
      console.error('Error fetching task types:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      alert("Please enter a task type name")
      return
    }

    try {
      if (editingId) {
        // Update existing task type
        const response = await fetch('/api/task-types', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            name: formData.name,
            default_difficulty: formData.difficulty,
            default_weight: formData.weight,
          }),
        })

        if (response.ok) {
          await fetchTaskTypes()
          setEditingId(null)
        }
      } else {
        // Add new task type
        const response = await fetch('/api/task-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: 1, // TODO: Get from auth
            name: formData.name,
            default_difficulty: formData.difficulty,
            default_weight: formData.weight,
          }),
        })

        if (response.ok) {
          await fetchTaskTypes()
        }
      }

      setFormData({ name: "", difficulty: 3, weight: 5 })
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 2000)
    } catch (error) {
      console.error('Error saving task type:', error)
    }
  }

  const handleEdit = (taskType: TaskType) => {
    setFormData({
      name: taskType.name,
      difficulty: taskType.default_difficulty,
      weight: taskType.default_weight,
    })
    setEditingId(taskType.id)
  }

  const handleDelete = (taskType: TaskType) => {
    setDeletingTaskType(taskType)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (deletingTaskType) {
      try {
        const response = await fetch(`/api/task-types?id=${deletingTaskType.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchTaskTypes()
        }
      } catch (error) {
        console.error('Error deleting task type:', error)
      }
      
      setShowDeleteModal(false)
      setDeletingTaskType(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setDeletingTaskType(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({ name: "", difficulty: 3, weight: 5 })
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-secondary/20 to-background neural-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading task types...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-secondary/20 to-background neural-bg">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Task Type Form */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow smooth-transition">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  {editingId ? "Edit Task Type" : "Add New Task Type"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Define task types with their default difficulty and weight levels
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Task Type Name */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Task Type Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Quiz, Midterm Exam, Group Project"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all smooth-transition"
                    required
                  />
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

                {/* Submit Buttons */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:shadow-lg text-foreground font-semibold py-3 px-4 rounded-lg transition-all duration-200 smooth-transition flex items-center justify-center gap-2 hover:brightness-110 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    {editingId ? "Update Task Type" : "Add Task Type"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-3 bg-secondary text-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-all smooth-transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Success Feedback */}
              {submitted && (
                <div className="mt-4 bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/50 rounded-xl p-4 flex items-center gap-3 smooth-transition">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {editingId ? "Task type updated!" : "Task type added!"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                About Difficulty & Weight
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Difficulty:</strong> Represents task complexity (1=Easy, 5=Hard)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">•</span>
                  <span><strong>Weight:</strong> Indicates importance/impact (1=Low, 10=High)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>These values will be used as defaults when creating tasks of this type</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Task Types List */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow smooth-transition">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-foreground">Task Types</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your task type templates
                </p>
              </div>

              <div className="space-y-3">
                {taskTypes.map((taskType) => (
                  <div
                    key={taskType.id}
                    className="bg-secondary/30 border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors smooth-transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2">{taskType.name}</h3>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Difficulty:</span>
                            <div className="flex gap-1">
                              {Array.from({ length: taskType.default_difficulty }).map((_, i) => (
                                <div key={i} className="w-1.5 h-4 bg-primary rounded-sm" />
                              ))}
                            </div>
                            <span className="text-primary font-semibold">{taskType.default_difficulty}/10</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Weight:</span>
                            <span className="text-accent font-semibold">{taskType.default_weight}/10</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(taskType)}
                          className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(taskType)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingTaskType && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl border border-border p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-scale-in">
              {/* Warning Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-red-50 dark:from-red-950/20 dark:via-orange-950/20 dark:to-red-950/20" />
              
              {/* Content */}
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full mb-4 animate-pulse">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-foreground mb-2">Delete Task Type?</h2>
                <p className="text-muted-foreground mb-1">Are you sure you want to delete:</p>
                <p className="font-semibold text-foreground text-lg mb-2">{deletingTaskType.name}</p>
                <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground font-semibold py-3 px-4 rounded-lg transition-all duration-200 smooth-transition active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-lg text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 smooth-transition hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
