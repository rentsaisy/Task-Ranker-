"use client"

import { List, Calendar, CheckCircle, Edit, Sparkles, Trophy } from "lucide-react"
import { useState } from "react"

interface Task {
  id: number
  name: string
  deadline: string
  taskType: string
}

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, name: "Advanced Calculus Assignment", deadline: "2024-12-20", taskType: "Assignment" },
    { id: 2, name: "Physics Lab Report", deadline: "2024-12-18", taskType: "Report" },
    { id: 3, name: "Literature Essay", deadline: "2024-12-22", taskType: "Assignment" },
  ])

  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [finishingTask, setFinishingTask] = useState<Task | null>(null)

  const handleEdit = (task: Task) => {
    setEditingTask({ ...task })
    setShowEditModal(true)
  }

  const handleSaveEdit = () => {
    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? editingTask : t))
      setShowEditModal(false)
      setEditingTask(null)
    }
  }

  const handleFinish = (task: Task) => {
    setFinishingTask(task)
    setShowFinishModal(true)
  }

  const confirmFinish = () => {
    if (finishingTask) {
      setTasks(tasks.filter(t => t.id !== finishingTask.id))
      setTimeout(() => {
        setShowFinishModal(false)
        setFinishingTask(null)
      }, 1500)
    }
  }

  const cancelFinish = () => {
    setShowFinishModal(false)
    setFinishingTask(null)
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
                  <th className="text-left py-4 px-6 font-semibold text-foreground">Deadline</th>
                  <th className="text-center py-4 px-6 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b border-border hover:bg-secondary/50 smooth-transition">
                    <td className="py-4 px-6 font-medium text-foreground">{task.name}</td>
                    <td className="py-4 px-6 text-muted-foreground">{task.taskType}</td>
                    <td className="py-4 px-6 text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(task.deadline).toLocaleDateString()}
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
                ))}
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
                    value={editingTask.name}
                    onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all smooth-transition"
                  />
                </div>

                {/* Task Type */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Task Type
                  </label>
                  <select
                    value={editingTask.taskType}
                    onChange={(e) => setEditingTask({ ...editingTask, taskType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all smooth-transition"
                  >
                    <option value="Assignment">Assignment</option>
                    <option value="PPT/Presentation">PPT/Presentation</option>
                    <option value="Report">Report</option>
                    <option value="Practicum/Lab">Practicum/Lab</option>
                    <option value="Exam/Test">Exam/Test</option>
                    <option value="Project">Project</option>
                    <option value="Reminder">Reminder</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={editingTask.deadline}
                    onChange={(e) => setEditingTask({ ...editingTask, deadline: e.target.value })}
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
                <p className="font-semibold text-foreground text-lg mb-6">{finishingTask.name}</p>
                
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
