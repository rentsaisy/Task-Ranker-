"use client"

import { Plus, Brain, CheckCircle, Trash2, Edit, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useState, useEffect } from "react"

interface TaskType {
  id: number
  name: string
  default_difficulty: number
  default_weight: number
}

export default function InputTaskTypePage() {
    const [showAlertModal, setShowAlertModal] = useState(false)
    const [alertMessage, setAlertMessage] = useState("")
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
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
        const result = await response.json()
        if (response.ok && !result.error) {
          await fetchTaskTypes()
          setShowDeleteModal(false)
          setDeletingTaskType(null)
        } else if (result.error) {
          // Remove the prefix if present
          const msg = result.error.replace(/^Cannot delete task type\.\s*/, "")
          setAlertMessage(msg)
          setShowAlertModal(true)
          setShowDeleteModal(false)
          setDeletingTaskType(null)
        }
      } catch (error) {
        console.error('Error deleting task type:', error)
        setAlertMessage("Failed to delete task type.")
        setShowAlertModal(true)
        setShowDeleteModal(false)
        setDeletingTaskType(null)
      }
    }
        {/* Alert Modal for delete error */}
  // ...existing code...
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
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[88vh] overflow-hidden p-4 md:p-8 bg-gradient-to-br from-background via-secondary/20 to-background neural-bg">
      {/* Success Popup Top Right - Gradient like Generate Button */}
      {submitted && (
        <div className="fixed top-6 right-8 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-gradient-to-r from-primary to-accent text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 min-w-[220px]">
            <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
            <p className="text-sm font-semibold">
              {editingId ? "Task type updated!" : "Task type added!"}
            </p>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto space-y-8">
        {showAlertModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl border border-border p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-scale-in">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-red-50 to-orange-50 dark:from-orange-950/20 dark:via-red-950/20 dark:to-orange-950/20" />
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-4 animate-pulse">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Cannot Delete Task Type</h2>
                <p className="text-muted-foreground mb-4">{alertMessage}</p>
                <button
                  onClick={() => setShowAlertModal(false)}
                  className="bg-primary text-primary-foreground font-semibold py-2 px-6 rounded-lg transition-all duration-200 smooth-transition hover:bg-primary/80 active:scale-95"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Task Type Form */}
            <div className="bg-card rounded-xl border border-border p-3 shadow-sm hover:shadow-md transition-shadow smooth-transition">
              <div className="mb-3">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  {editingId ? "Edit Task Type" : "Add New Task Type"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Define task types with their default difficulty and weight levels
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Task Type Name */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">
                    Task Type Name
                  </label>
                  <input
                    type="text"
                    placeholder="Practicum report, Reminder, etc."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all smooth-transition"
                    required
                  />
                </div>
                {/* Difficulty */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-foreground">Difficulty Level</label>
                    <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-foreground">Task Weight</label>
                    <span className="text-sm font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
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
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:shadow-lg text-foreground font-semibold py-2 px-3 rounded-lg transition-all duration-200 smooth-transition flex items-center justify-center gap-2 hover:brightness-110 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    {editingId ? "Update Task Type" : "Add Task Type"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3 py-2 bg-secondary text-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-all smooth-transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Success Feedback */}
              {/* Success Popup Top Right - Filled Color */}
            </div>

            {/* Info Box */}
            <div className="bg-card rounded-xl border border-border p-3 space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <Brain className="w-4 h-4 text-primary" />
                About Difficulty & Weight
              </h3>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
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
            <div className="bg-card rounded-xl border border-border p-3.5 shadow-sm hover:shadow-md transition-shadow smooth-transition">
              <div className="mb-3.5">
                <h2 className="text-lg font-bold text-foreground">Task Types</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your task type templates
                </p>
              </div>

              <div className="space-y-4">
                {taskTypes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((taskType) => (
                  <div
                    key={taskType.id}
                    className="bg-secondary/30 border border-border rounded-lg p-2 hover:bg-secondary/50 transition-colors smooth-transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1.5 text-sm">{taskType.name}</h3>
                        <div className="flex gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Difficulty:</span>
                            <div className="flex gap-1">
                              {Array.from({ length: taskType.default_difficulty }).map((_, i) => (
                                <div key={i} className="w-1.5 h-4 bg-primary rounded-sm" />
                              ))}
                            </div>
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

              {/* Pagination Controls */}
              {Math.ceil(taskTypes.length / itemsPerPage) > 1 && (
                <div className="flex items-center justify-center gap-2 pt-3 mt-3 border-t border-border">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="First page"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  
                  <div className="px-3 py-0.5 rounded-lg bg-secondary text-foreground text-xs font-medium">
                    {currentPage}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(taskTypes.length / itemsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(taskTypes.length / itemsPerPage)}
                    className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.ceil(taskTypes.length / itemsPerPage))}
                    disabled={currentPage === Math.ceil(taskTypes.length / itemsPerPage)}
                    className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Last page"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
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
