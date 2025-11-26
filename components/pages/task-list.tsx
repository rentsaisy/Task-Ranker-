"use client"

import { List, Calendar, CheckCircle, Edit, Sparkles, Trophy } from "lucide-react"
import { useState, useEffect } from "react"

interface Task {
  id: number
  title: string
  due_date: string
  task_type_name: string
  priority_score: number
  task_type_id?: number
}

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskTypes, setTaskTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [finishingTask, setFinishingTask] = useState<Task | null>(null)

  useEffect(() => {
    fetchTasks()
    fetchTaskTypes()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks?userId=1')
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTaskTypes = async () => {
    try {
      const response = await fetch('/api/task-types?userId=1')
      const data = await response.json()
      setTaskTypes(data)
    } catch (error) {
      console.error('Error fetching task types:', error)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask({ ...task })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (editingTask) {
      try {
        const response = await fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingTask.id,
            task_type_id: editingTask.task_type_id,
            title: editingTask.title,
            due_date: editingTask.due_date,
          }),
        })

        const result = await response.json()
        
        if (result.success) {
          await fetchTasks()
          setShowEditModal(false)
          setEditingTask(null)
        }
      } catch (error) {
        console.error('Error updating task:', error)
      }
    }
  }

  const handleFinish = (task: Task) => {
    setFinishingTask(task)
    setShowFinishModal(true)
  }

  const confirmFinish = async () => {
    if (finishingTask) {
      try {
        const response = await fetch(`/api/tasks?id=${finishingTask.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setTimeout(() => {
            fetchTasks()
            setShowFinishModal(false)
            setFinishingTask(null)
          }, 1500)
        }
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }

  const cancelFinish = () => {
    setShowFinishModal(false)
    setFinishingTask(null)
  }

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
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Tasks Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Task Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Task Type</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Priority</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Deadline</th>
                  <th className="text-center py-4 px-6 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No tasks found. Create your first task!
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className="border-b border-border hover:bg-secondary/50 smooth-transition">
                      <td className="py-4 px-6 font-medium text-foreground">{task.title}</td>
                      <td className="py-4 px-6 text-muted-foreground">{task.task_type_name || 'N/A'}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          (task.priority_score || 0) >= 80 ? 'bg-red-500/20 text-red-400' :
                          (task.priority_score || 0) >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {Math.round(task.priority_score || 0)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleEdit(task)}
                            className="p-2 hover:bg-primary/10 rounded-lg transition-colors smooth-transition"
                            title="Edit task"
                          >
                            <Edit className="w-4 h-4 text-primary" />
                          </button>
                          <button 
                            onClick={() => handleFinish(task)}
                            className="p-2 hover:bg-accent/10 rounded-lg transition-colors smooth-transition"
                            title="Mark as finished"
                          >
                            <CheckCircle className="w-4 h-4 text-accent" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && editingTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full shadow-2xl">
              <h2 className="text-lg font-bold text-foreground mb-4">Edit Task</h2>
              
              <div className="space-y-4">
                {/* Task Name */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Task Name
                  </label>
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all smooth-transition"
                  />
                </div>

                {/* Task Type */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Task Type
                  </label>
                  <select
                    value={editingTask.task_type_id || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, task_type_id: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all smooth-transition"
                  >
                    <option value="">Select task type</option>
                    {taskTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={editingTask.due_date}
                    onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all smooth-transition"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:shadow-lg text-foreground font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 smooth-transition hover:brightness-110 active:scale-95"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingTask(null)
                    }}
                    className="px-4 py-2.5 bg-secondary text-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-all smooth-transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Finish Confirmation Modal */}
        {showFinishModal && finishingTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl border border-border p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-primary/20 to-accent/20 animate-pulse" />
              
              {/* Sparkle Effects */}
              <div className="absolute top-4 left-4 animate-bounce">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <div className="absolute top-8 right-8 animate-bounce" style={{ animationDelay: "0.2s" }}>
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="absolute bottom-8 left-12 animate-bounce" style={{ animationDelay: "0.4s" }}>
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              
              {/* Content */}
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-accent to-primary rounded-full mb-4 animate-scale-in shadow-lg">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-foreground mb-2">Task Completed!</h2>
                <p className="text-muted-foreground mb-1">Great job finishing:</p>
                <p className="font-semibold text-foreground text-lg mb-6">{finishingTask.title}</p>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={confirmFinish}
                    className="flex-1 bg-gradient-to-r from-accent to-primary hover:shadow-lg text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 smooth-transition hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Confirm
                  </button>
                  <button
                    onClick={cancelFinish}
                    className="px-6 py-3 bg-secondary text-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-all smooth-transition"
                  >
                    Cancel
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
