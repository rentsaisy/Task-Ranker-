"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, Clock, Target, TrendingUp, Sparkles, CheckCircle } from "lucide-react"

interface Task {
  id: number
  name: string
  taskType: string
  priority: number
}

type PomodoroMode = 'focus' | 'short_break' | 'long_break'
type TimerStatus = 'idle' | 'active' | 'paused'

interface PomodoroSettings {
  focusDuration: number // minutes
  shortBreakDuration: number
  longBreakDuration: number
  sessionsBeforeLongBreak: number
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
}

export default function FocusModePage() {
  // State management
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS)
  
  // Pomodoro state
  const [mode, setMode] = useState<PomodoroMode>('focus')
  const [sessionNumber, setSessionNumber] = useState(1)
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_SETTINGS.focusDuration * 60)
  
  // Session tracking
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [completedToday, setCompletedToday] = useState(0)
  const [totalMinutesToday, setTotalMinutesToday] = useState(0)
  
  // Audio for alarm
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Mock user ID (in real app, get from auth context)
  const userId = 1

  // Load tasks and status on mount
  useEffect(() => {
    loadTasks()
    loadPomodoroStatus()
    
    // Initialize alarm audio
    alarmAudioRef.current = new Audio('/alarm.mp3') // You'll need to add an alarm sound file
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  // Timer countdown logic
  useEffect(() => {
    if (status === 'active') {
      timerIntervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [status])

  /**
   * Load user's tasks
   */
  async function loadTasks() {
    try {
      // Mock data - replace with actual API call
      const mockTasks: Task[] = [
        { id: 1, name: "Advanced Calculus Assignment", taskType: "Assignment", priority: 92 },
        { id: 2, name: "Physics Lab Report", taskType: "Report", priority: 78 },
        { id: 3, name: "Literature Essay", taskType: "Assignment", priority: 58 },
      ]
      setTasks(mockTasks)
      
      // Auto-select highest priority task
      if (mockTasks.length > 0) {
        setSelectedTask(mockTasks[0])
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  /**
   * Load current Pomodoro status from backend
   */
  async function loadPomodoroStatus() {
    try {
      const response = await fetch(`/api/pomodoro/status?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        // Update today's stats
        setCompletedToday(data.data.todayStats.completedFocus)
        setTotalMinutesToday(data.data.todayStats.totalFocusMinutes)

        // If there's an active session, restore it
        if (data.data.activeSession) {
          const session = data.data.activeSession
          setCurrentSessionId(session.id)
          setMode(session.mode)
          setSessionNumber(session.sessionNumber)
          
          // Calculate remaining time
          const endTime = new Date(session.endTime).getTime()
          const now = Date.now()
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
          
          setRemainingSeconds(remaining)
          setStatus(session.status === 'paused' ? 'paused' : 'active')
          
          // Find and select the task
          const task = tasks.find(t => t.id === session.taskId)
          if (task) setSelectedTask(task)
        }
      }
    } catch (error) {
      console.error('Error loading Pomodoro status:', error)
    }
  }

  /**
   * Start Pomodoro session
   */
  async function startPomodoro() {
    if (!selectedTask) {
      alert('Please select a task first!')
      return
    }

    try {
      const response = await fetch('/api/pomodoro/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          taskId: selectedTask.id,
          mode,
          duration: settings.focusDuration,
          sessionNumber,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setCurrentSessionId(data.sessionId)
        setRemainingSeconds(data.data.duration * 60)
        setStatus('active')
        console.log('✅ Pomodoro started:', data)
      } else {
        alert(data.error || 'Failed to start Pomodoro')
      }
    } catch (error) {
      console.error('Error starting Pomodoro:', error)
      alert('Error starting Pomodoro session')
    }
  }

  /**
   * Pause active session
   */
  async function pausePomodoro() {
    try {
      const response = await fetch('/api/pomodoro/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId: currentSessionId }),
      })

      const data = await response.json()

      if (data.success) {
        setStatus('paused')
      }
    } catch (error) {
      console.error('Error pausing Pomodoro:', error)
    }
  }

  /**
   * Resume paused session
   */
  async function resumePomodoro() {
    try {
      const response = await fetch('/api/pomodoro/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId: currentSessionId }),
      })

      const data = await response.json()

      if (data.success) {
        setStatus('active')
      }
    } catch (error) {
      console.error('Error resuming Pomodoro:', error)
    }
  }

  /**
   * Stop/cancel current session
   */
  async function stopPomodoro() {
    if (!confirm('Are you sure you want to stop this Pomodoro session?')) {
      return
    }

    try {
      const response = await fetch('/api/pomodoro/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId: currentSessionId }),
      })

      const data = await response.json()

      if (data.success) {
        resetTimer()
      }
    } catch (error) {
      console.error('Error stopping Pomodoro:', error)
    }
  }

  /**
   * Reset timer to initial state
   */
  function resetTimer() {
    setStatus('idle')
    setRemainingSeconds(settings.focusDuration * 60)
    setMode('focus')
    setSessionNumber(1)
    setCurrentSessionId(null)
  }

  /**
   * Handle timer completion
   */
  function handleTimerComplete() {
    // Play alarm sound
    if (alarmAudioRef.current) {
      alarmAudioRef.current.play().catch(e => console.error('Error playing alarm:', e))
    }

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Complete!', {
        body: mode === 'focus' 
          ? 'Time for a break!' 
          : 'Break is over! Ready to focus?',
        icon: '/icon.png',
      })
    }

    // Auto-transition to next mode
    transitionToNextMode()
  }

  /**
   * Transition to next Pomodoro mode
   */
  function transitionToNextMode() {
    if (mode === 'focus') {
      // Update completed count
      setCompletedToday(prev => prev + 1)
      setTotalMinutesToday(prev => prev + settings.focusDuration)

      // Determine break type
      if (sessionNumber >= settings.sessionsBeforeLongBreak) {
        setMode('long_break')
        setRemainingSeconds(settings.longBreakDuration * 60)
        setSessionNumber(1)
      } else {
        setMode('short_break')
        setRemainingSeconds(settings.shortBreakDuration * 60)
      }
    } else {
      // After break, return to focus
      setMode('focus')
      setRemainingSeconds(settings.focusDuration * 60)
      if (mode === 'short_break') {
        setSessionNumber(prev => prev + 1)
      }
    }

    setStatus('idle')
    setCurrentSessionId(null)
  }

  /**
   * Format seconds to MM:SS
   */
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Get mode display info
   */
  function getModeInfo() {
    switch (mode) {
      case 'focus':
        return { label: 'Focus Time', color: 'text-primary', bgColor: 'bg-primary/10' }
      case 'short_break':
        return { label: 'Short Break', color: 'text-accent', bgColor: 'bg-accent/10' }
      case 'long_break':
        return { label: 'Long Break', color: 'text-blue-500', bgColor: 'bg-blue-500/10' }
    }
  }

  const modeInfo = getModeInfo()
  const progress = mode === 'focus' 
    ? (1 - remainingSeconds / (settings.focusDuration * 60)) * 100
    : mode === 'short_break'
    ? (1 - remainingSeconds / (settings.shortBreakDuration * 60)) * 100
    : (1 - remainingSeconds / (settings.longBreakDuration * 60)) * 100

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-secondary/20 to-background neural-bg">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-6 smooth-transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Today's Sessions</p>
                <p className="text-3xl font-bold text-foreground mt-2">{completedToday}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 smooth-transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Focus Time</p>
                <p className="text-3xl font-bold text-foreground mt-2">{totalMinutesToday}m</p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 smooth-transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Current Session</p>
                <p className="text-3xl font-bold text-foreground mt-2">{sessionNumber}/4</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Pomodoro Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Task Selection */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow smooth-transition">
              <h2 className="text-lg font-bold text-foreground mb-4">Select Task</h2>
              <div className="space-y-2">
                {tasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    disabled={status === 'active'}
                    className={`w-full text-left p-4 rounded-lg border transition-all smooth-transition ${
                      selectedTask?.id === task.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-secondary/30 border-border hover:bg-secondary/50'
                    } ${status === 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-sm mb-1">{task.name}</p>
                        <p className="text-xs text-muted-foreground">{task.taskType}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <TrendingUp className="w-3 h-3 text-primary" />
                        <span className="text-xs font-bold text-primary">{task.priority}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Settings */}
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Focus Duration</label>
                    <input
                      type="number"
                      value={settings.focusDuration}
                      onChange={(e) => setSettings({...settings, focusDuration: Number(e.target.value)})}
                      disabled={status !== 'idle'}
                      className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      min="1"
                      max="60"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Short Break</label>
                    <input
                      type="number"
                      value={settings.shortBreakDuration}
                      onChange={(e) => setSettings({...settings, shortBreakDuration: Number(e.target.value)})}
                      disabled={status !== 'idle'}
                      className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      min="1"
                      max="30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Long Break</label>
                    <input
                      type="number"
                      value={settings.longBreakDuration}
                      onChange={(e) => setSettings({...settings, longBreakDuration: Number(e.target.value)})}
                      disabled={status !== 'idle'}
                      className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      min="1"
                      max="60"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Timer Display */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border p-8 shadow-sm hover:shadow-md transition-shadow smooth-transition">
              {/* Mode Badge */}
              <div className="flex items-center justify-center mb-6">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${modeInfo.bgColor} ${modeInfo.color}`}>
                  {modeInfo.label}
                </span>
              </div>

              {/* Task Name */}
              {selectedTask && (
                <div className="text-center mb-6">
                  <p className="text-muted-foreground text-sm mb-1">Focusing on:</p>
                  <h2 className="text-2xl font-bold text-foreground">{selectedTask.name}</h2>
                </div>
              )}

              {/* Countdown Timer */}
              <div className="relative mb-8">
                <div className="flex items-center justify-center">
                  <div className="text-8xl font-bold text-foreground tabular-nums">
                    {formatTime(remainingSeconds)}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-8 w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      mode === 'focus' ? 'bg-primary' : 
                      mode === 'short_break' ? 'bg-accent' : 
                      'bg-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Session Progress */}
              <div className="text-center mb-8">
                <p className="text-sm text-muted-foreground">
                  Session <span className="font-bold text-foreground">{sessionNumber}</span> of{' '}
                  <span className="font-bold text-foreground">{settings.sessionsBeforeLongBreak}</span>
                </p>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-4">
                {status === 'idle' && (
                  <button
                    onClick={startPomodoro}
                    disabled={!selectedTask}
                    className="px-8 py-4 bg-gradient-to-r from-primary to-accent hover:shadow-lg text-white font-semibold rounded-lg transition-all duration-200 smooth-transition hover:brightness-110 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-5 h-5" />
                    Start
                  </button>
                )}

                {status === 'active' && (
                  <button
                    onClick={pausePomodoro}
                    className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-lg transition-all smooth-transition active:scale-95 flex items-center gap-2"
                  >
                    <Pause className="w-5 h-5" />
                    Pause
                  </button>
                )}

                {status === 'paused' && (
                  <button
                    onClick={resumePomodoro}
                    className="px-8 py-4 bg-gradient-to-r from-primary to-accent hover:shadow-lg text-white font-semibold rounded-lg transition-all duration-200 smooth-transition hover:brightness-110 active:scale-95 flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Resume
                  </button>
                )}

                {status !== 'idle' && (
                  <button
                    onClick={stopPomodoro}
                    className="px-8 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-600 font-semibold rounded-lg transition-all smooth-transition active:scale-95 flex items-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Reset
                  </button>
                )}
              </div>

              {/* Info Box */}
              <div className="mt-8 p-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-foreground font-semibold mb-1">
                      Focus Mode with WhatsApp Reminders
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      When your Pomodoro session ends, you'll receive a WhatsApp notification even if you close this tab.
                      Reply with START, STOP, or STATUS to control your sessions via WhatsApp!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
