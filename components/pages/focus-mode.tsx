"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, Clock, Timer, CheckCircle, Settings as SettingsIcon } from "lucide-react"

type TimerStatus = 'idle' | 'active' | 'paused'
type SessionType = 'work' | 'break'

export default function FocusModePage() {
  // Timer state
  const [workDuration, setWorkDuration] = useState(25) // minutes
  const [breakDuration, setBreakDuration] = useState(5) // minutes
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [sessionType, setSessionType] = useState<SessionType>('work')
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60)
  const [autoStartBreak, setAutoStartBreak] = useState(false)
  
  // Session tracking
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [completedToday, setCompletedToday] = useState(0)
  const [totalMinutesToday, setTotalMinutesToday] = useState(0)
  
  // Settings
  const [showSettings, setShowSettings] = useState(false)
  const [enableSound, setEnableSound] = useState(true)
  
  // Audio for alarm
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Mock user ID (in real app, get from auth context)
  const userId = 1

  // Load tasks and settings on mount
  useEffect(() => {
    loadSettings()
    loadTodayStats()
    
    // Try to initialize alarm audio
    if (typeof Audio !== 'undefined') {
      alarmAudioRef.current = new Audio('/alarm.mp3')
    }
    
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

  // Update remaining seconds when duration changes
  useEffect(() => {
    if (status === 'idle') {
      const currentDuration = sessionType === 'work' ? workDuration : breakDuration
      setRemainingSeconds(currentDuration * 60)
    }
  }, [workDuration, breakDuration, sessionType, status])

  /**
   * Load user settings
   */
  async function loadSettings() {
    try {
      const response = await fetch(`/api/pomodoro/settings?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.default_duration) {
          setWorkDuration(data.default_duration)
          setRemainingSeconds(data.default_duration * 60)
        }
        if (typeof data.enable_sound === 'boolean') {
          setEnableSound(data.enable_sound)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  /**
   * Load today's statistics
   */
  async function loadTodayStats() {
    try {
      const response = await fetch(`/api/pomodoro/stats?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setCompletedToday(data.completed_today || 0)
        setTotalMinutesToday(data.total_minutes || 0)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  /**
   * Save settings
   */
  async function saveSettings() {
    try {
      await fetch(`/api/pomodoro/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          default_duration: workDuration,
          enable_sound: enableSound,
        }),
      })
      setShowSettings(false)
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  /**
   * Start timer
   */
  async function handleStart() {
    const currentDuration = sessionType === 'work' ? workDuration : breakDuration
    
    try {
      const response = await fetch('/api/pomodoro/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          taskId: null,
          duration: currentDuration,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setCurrentSessionId(data.sessionId)
        setStatus('active')
      }
    } catch (error) {
      console.error('Error starting session:', error)
      // Start anyway for offline use
      setStatus('active')
    }
  }

  /**
   * Pause timer
   */
  async function handlePause() {
    if (currentSessionId) {
      try {
        await fetch('/api/pomodoro/pause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: currentSessionId,
            timeRemaining: remainingSeconds,
          }),
        })
      } catch (error) {
        console.error('Error pausing session:', error)
      }
    }

    setStatus('paused')
  }

  /**
   * Resume timer
   */
  async function handleResume() {
    if (currentSessionId) {
      try {
        await fetch('/api/pomodoro/resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: currentSessionId,
          }),
        })
      } catch (error) {
        console.error('Error resuming session:', error)
      }
    }

    setStatus('active')
  }

  /**
   * Reset timer
   */
  async function handleReset() {
    if (currentSessionId && (status === 'active' || status === 'paused')) {
      // Cancel the current session
      try {
        await fetch('/api/pomodoro/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: currentSessionId,
          }),
        })
      } catch (error) {
        console.error('Error cancelling session:', error)
      }
    }

    setStatus('idle')
    setSessionType('work')
    const currentDuration = workDuration
    setRemainingSeconds(currentDuration * 60)
    setCurrentSessionId(null)
  }

  /**
   * Timer completion
   */
  async function handleTimerComplete() {
    setStatus('idle')
    
    const currentDuration = sessionType === 'work' ? workDuration : breakDuration

    // Play alarm sound
    if (enableSound && alarmAudioRef.current) {
      try {
        alarmAudioRef.current.play()
      } catch (error) {
        console.error('Error playing alarm:', error)
      }
    }

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const message = sessionType === 'work' 
        ? `Work session complete! Time for a ${breakDuration} minute break.`
        : `Break is over! Ready for another ${workDuration} minute work session?`
      
      new Notification(sessionType === 'work' ? 'Work Complete! 🎉' : 'Break Over! ⚡', {
        body: message,
        icon: '/icon.png',
      })
    }

    // Mark session as completed (only for work sessions)
    if (currentSessionId && sessionType === 'work') {
      try {
        await fetch('/api/pomodoro/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: currentSessionId,
          }),
        })

        // Reload stats
        loadTodayStats()
      } catch (error) {
        console.error('Error completing session:', error)
      }
    }

    setCurrentSessionId(null)

    // Switch between work and break
    if (sessionType === 'work') {
      setSessionType('break')
      setRemainingSeconds(breakDuration * 60)
      
      // Auto-start break if enabled
      if (autoStartBreak) {
        setTimeout(() => {
          handleStart()
        }, 2000)
      }
    } else {
      setSessionType('work')
      setRemainingSeconds(workDuration * 60)
    }
  }

  /**
   * Request notification permission
   */
  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  // Format time display
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  const currentDuration = sessionType === 'work' ? workDuration : breakDuration
  const progressPercentage = ((currentDuration * 60 - remainingSeconds) / (currentDuration * 60)) * 100

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-secondary/20 to-background neural-bg">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center justify-center gap-3">
            <Timer className="w-8 h-8 text-primary" />
            Pomodoro Timer
          </h1>
          <p className="text-muted-foreground">
            Work focused, rest well - stay productive!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Completed Today</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{completedToday}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Minutes Today</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalMinutesToday}</p>
          </div>
        </div>

        {/* Main Timer Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          
          {/* Timer Display */}
          <div className="text-center mb-8">
            {/* Session Type Badge */}
            <div className="mb-4">
              <span className={`inline-block px-6 py-2 rounded-full font-semibold text-sm ${
                sessionType === 'work' 
                  ? 'bg-primary/20 text-primary border-2 border-primary'
                  : 'bg-green-500/20 text-green-600 border-2 border-green-500'
              }`}>
                {sessionType === 'work' ? '🎯 Work Session' : '☕ Break Time'}
              </span>
            </div>

            <div className="relative inline-block">
              {/* Circular Progress */}
              <svg className="w-64 h-64 transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-secondary"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${2 * Math.PI * 120 * (1 - progressPercentage / 100)}`}
                  className={`transition-all duration-1000 ${sessionType === 'work' ? 'text-primary' : 'text-green-500'}`}
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Time Text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-foreground font-mono">
                    {timeDisplay}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {status === 'active' ? (sessionType === 'work' ? 'Stay Focused' : 'Take a Break') : status === 'paused' ? 'Paused' : 'Ready'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Duration Selectors */}
          {status === 'idle' && (
            <>
              {/* Work Duration */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Work Duration (minutes)
                </label>
                <div className="space-y-3">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={workDuration}
                    onChange={(e) => {
                      const newDuration = Math.max(1, Math.min(120, Number(e.target.value)))
                      setWorkDuration(newDuration)
                      if (sessionType === 'work') {
                        setRemainingSeconds(newDuration * 60)
                      }
                    }}
                    className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-center text-xl font-semibold"
                  />
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[15, 25, 30, 45, 60].map((min) => (
                      <button
                        key={min}
                        onClick={() => {
                          setWorkDuration(min)
                          if (sessionType === 'work') {
                            setRemainingSeconds(min * 60)
                          }
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          workDuration === min
                            ? 'bg-primary text-foreground shadow-md'
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {min}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Break Duration */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Break Duration (minutes)
                </label>
                <div className="space-y-3">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={breakDuration}
                    onChange={(e) => {
                      const newDuration = Math.max(1, Math.min(30, Number(e.target.value)))
                      setBreakDuration(newDuration)
                      if (sessionType === 'break') {
                        setRemainingSeconds(newDuration * 60)
                      }
                    }}
                    className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-xl font-semibold"
                  />
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[3, 5, 10, 15].map((min) => (
                      <button
                        key={min}
                        onClick={() => {
                          setBreakDuration(min)
                          if (sessionType === 'break') {
                            setRemainingSeconds(min * 60)
                          }
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          breakDuration === min
                            ? 'bg-green-500 text-white shadow-md'
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {min}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Auto-start break option */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer justify-center">
                  <input
                    type="checkbox"
                    checked={autoStartBreak}
                    onChange={(e) => setAutoStartBreak(e.target.checked)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm text-foreground">Auto-start break after work session</span>
                </label>
              </div>
            </>
          )}

          {/* Controls */}
          <div className="flex gap-4 justify-center flex-wrap">
            {status === 'idle' && (
              <button
                onClick={handleStart}
                className={`flex items-center gap-2 px-8 py-4 font-semibold rounded-lg hover:shadow-lg transition-all active:scale-95 ${
                  sessionType === 'work'
                    ? 'bg-gradient-to-r from-primary to-accent text-foreground'
                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                }`}
              >
                <Play className="w-5 h-5" />
                Start {sessionType === 'work' ? 'Work' : 'Break'}
              </button>
            )}

            {status === 'active' && (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-8 py-4 bg-yellow-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all active:scale-95"
              >
                <Pause className="w-5 h-5" />
                Pause
              </button>
            )}

            {status === 'paused' && (
              <button
                onClick={handleResume}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-accent text-foreground font-semibold rounded-lg hover:shadow-lg transition-all active:scale-95"
              >
                <Play className="w-5 h-5" />
                Resume
              </button>
            )}

            {status !== 'idle' && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-8 py-4 bg-red-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all active:scale-95"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>
            )}

            {status === 'idle' && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-6 py-4 bg-secondary text-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-all"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Settings Panel */}
          {showSettings && status === 'idle' && (
            <div className="mt-6 p-4 bg-secondary/50 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-4">Timer Settings</h3>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSound}
                    onChange={(e) => setEnableSound(e.target.checked)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-foreground">Enable completion sound</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoStartBreak}
                    onChange={(e) => setAutoStartBreak(e.target.checked)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-foreground">Auto-start break after work</span>
                </label>

                <button
                  onClick={requestNotificationPermission}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground hover:bg-secondary transition-all"
                >
                  Enable Browser Notifications
                </button>

                <button
                  onClick={saveSettings}
                  className="w-full px-4 py-3 bg-primary text-foreground font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4">
          <p className="text-sm text-foreground">
            <strong>💡 How it works:</strong> Set your work and break durations, then start! 
            After each work session, the timer will switch to a break session. Complete cycles to stay productive and well-rested.
          </p>
        </div>

      </div>
    </div>
  )
}
