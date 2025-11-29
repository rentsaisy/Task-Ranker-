"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, Clock, Timer, CheckCircle, Settings as SettingsIcon, ChevronUp, ChevronDown } from "lucide-react"

type TimerStatus = 'idle' | 'active' | 'paused'
type SessionType = 'work' | 'break'

export default function FocusModePage() {
  // Timer state
  const [workDurationSeconds, setWorkDurationSeconds] = useState(1 * 60) // seconds
  const [breakDurationSeconds, setBreakDurationSeconds] = useState(1 * 60) // seconds
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [sessionType, setSessionType] = useState<SessionType>('work')
  const [remainingSeconds, setRemainingSeconds] = useState(1 * 60)
  const [repeating, setRepeating] = useState(false)
  
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
    
    // Initialize alarm audio on user interaction
    const initAudio = () => {
      if (!alarmAudioRef.current && typeof Audio !== 'undefined') {
        try {
          const audio = new Audio('/alarm.mp3')
          audio.volume = 0.5
          
          audio.addEventListener('loadeddata', () => {
            console.log('Alarm audio loaded successfully')
            // Limit to 10 seconds
            audio.addEventListener('timeupdate', () => {
              if (audio.currentTime >= 10) {
                audio.pause()
                audio.currentTime = 0
              }
            })
          })
          
          audio.addEventListener('error', (e) => {
            console.warn('Could not load alarm audio')
          })
          
          alarmAudioRef.current = audio
        } catch (error) {
          console.warn('Audio not supported')
        }
      }
    }
    
    // Initialize on mount
    initAudio()
    
    // Also try to initialize on first user click
    const handleFirstClick = () => {
      initAudio()
      document.removeEventListener('click', handleFirstClick)
    }
    document.addEventListener('click', handleFirstClick)
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      document.removeEventListener('click', handleFirstClick)
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
      const currentDuration = sessionType === 'work' ? workDurationSeconds : breakDurationSeconds
      setRemainingSeconds(currentDuration)
    }
  }, [workDurationSeconds, breakDurationSeconds, sessionType, status])

  /**
   * Load user settings
   */
  async function loadSettings() {
    try {
      const response = await fetch(`/api/pomodoro/settings?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        // Only load if settings exist, otherwise keep default 1 minute
        if (data.default_duration && data.default_duration !== 25) {
          setWorkDurationSeconds(data.default_duration * 60)
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
          default_duration: Math.floor(workDurationSeconds / 60),
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
    const currentDuration = sessionType === 'work' ? workDurationSeconds : breakDurationSeconds
    
    try {
      const response = await fetch('/api/pomodoro/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          taskId: null,
          duration: Math.floor(currentDuration / 60),
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
    const currentDuration = workDurationSeconds
    setRemainingSeconds(currentDuration)
    setCurrentSessionId(null)
  }

  /**
   * Timer completion
   */
  async function handleTimerComplete() {
    setStatus('idle')
    
    const currentDuration = sessionType === 'work' ? workDurationSeconds : breakDurationSeconds

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
        ? `Work session complete! Time for a ${Math.floor(breakDurationSeconds / 60)} minute break.`
        : `Break is over! Ready for another ${Math.floor(workDurationSeconds / 60)} minute work session?`
      
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
      setRemainingSeconds(breakDurationSeconds)
      
      // Play alarm sound when switching to break
      if (enableSound && alarmAudioRef.current) {
        try {
          alarmAudioRef.current.currentTime = 0
          alarmAudioRef.current.play()
        } catch (error) {
          console.error('Error playing alarm:', error)
        }
      }
      
      // Auto-start break if repeating enabled - start immediately without idle state
      if (repeating) {
        // Start break session immediately
        setTimeout(async () => {
          const response = await fetch('/api/pomodoro/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              taskId: null,
              duration: Math.floor(breakDurationSeconds / 60),
            }),
          })

          if (response.ok) {
            const data = await response.json()
            setCurrentSessionId(data.sessionId)
            setStatus('active')
          }
        }, 1000)
      }
    } else {
      setSessionType('work')
      setRemainingSeconds(workDurationSeconds)
      
      // Play alarm sound when switching to work
      if (enableSound && alarmAudioRef.current) {
        try {
          alarmAudioRef.current.currentTime = 0
          alarmAudioRef.current.play()
        } catch (error) {
          console.error('Error playing alarm:', error)
        }
      }
      
      // Auto-start work if repeating enabled - start immediately without idle state
      if (repeating) {
        // Start work session immediately
        setTimeout(async () => {
          const response = await fetch('/api/pomodoro/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              taskId: null,
              duration: Math.floor(workDurationSeconds / 60),
            }),
          })

          if (response.ok) {
            const data = await response.json()
            setCurrentSessionId(data.sessionId)
            setStatus('active')
          }
        }, 1000)
      }
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
  const hours = Math.floor(remainingSeconds / 3600)
  const minutes = Math.floor((remainingSeconds % 3600) / 60)
  const seconds = remainingSeconds % 60
  const timeDisplay = hours > 0 
    ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  const currentDuration = sessionType === 'work' ? workDurationSeconds : breakDurationSeconds
  const progressPercentage = ((currentDuration - remainingSeconds) / currentDuration) * 100

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-background via-secondary/20 to-background neural-bg" style={{ height: '88vh' }}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Main Timer Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Timer Display */}
            <div className="text-center">
              <div className="relative inline-block">
                {/* Circular Progress */}
                  <svg className="w-72 h-72 transform -rotate-90">
                    <circle
                      cx="144"
                      cy="144"
                      r="136"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-secondary"
                    />
                    <circle
                      cx="144"
                      cy="144"
                      r="136"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 136}`}
                      strokeDashoffset={`${2 * Math.PI * 136 * (1 - progressPercentage / 100)}`}
                      className={`transition-all duration-1000 ${sessionType === 'work' ? 'text-primary' : 'text-green-500'}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  
                  {/* Time Text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      {/* Session Type Badge */}
                      <span className={`inline-block px-4 py-1.5 rounded-full font-semibold text-xs mb-3 ${
                        sessionType === 'work' 
                          ? 'bg-primary/20 text-primary border-2 border-primary'
                          : 'bg-green-500/20 text-green-600 border-2 border-green-500'
                      }`}>
                        {sessionType === 'work' ? 'Work Session' : 'Break Session'}
                      </span>
                      <div className="text-5xl font-bold text-foreground font-mono">
                        {timeDisplay}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        {status === 'active' ? (sessionType === 'work' ? 'Focus' : 'Rest') : status === 'paused' ? 'Paused' : 'Ready'}
                      </div>
                    </div>
                  </div>
                </div>
              
              {/* Stats Card Below Timer */}
              <div className="mt-4">
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 justify-center mb-1">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Total Hours Today</span>
                  </div>
                    <p className="text-xl font-bold text-foreground text-center">{totalMinutesToday > 0 ? (Math.ceil((totalMinutesToday / 60) * 100) / 100).toFixed(2) : '-'}</p>
                </div>
              </div>
            </div>

            {/* Right: Duration Selectors or Animation */}
            {status === 'idle' && (
              <div className="space-y-5">
                {/* Work Duration */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Work Session
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-2 rounded-lg bg-input border border-border text-foreground text-center text-lg font-semibold font-mono">
                        {workDurationSeconds >= 3600
                          ? `${Math.floor(workDurationSeconds / 3600).toString().padStart(2, '0')}:${Math.floor((workDurationSeconds % 3600) / 60).toString().padStart(2, '0')}:${(workDurationSeconds % 60).toString().padStart(2, '0')}`
                          : `${Math.floor(workDurationSeconds / 60).toString().padStart(2, '0')}:${(workDurationSeconds % 60).toString().padStart(2, '0')}`
                        }
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            const newSeconds = Math.min(28800, workDurationSeconds + 1)
                            setWorkDurationSeconds(newSeconds)
                            if (sessionType === 'work') {
                              setRemainingSeconds(newSeconds)
                            }
                          }}
                          onMouseDown={(e) => {
                            let timeout = setTimeout(() => {
                              const interval = setInterval(() => {
                                setWorkDurationSeconds(prev => {
                                  const updated = Math.min(28800, prev + 1)
                                  if (sessionType === 'work') {
                                    setRemainingSeconds(updated)
                                  }
                                  return updated
                                })
                              }, 100)
                              const handleMouseUp = () => {
                                clearInterval(interval)
                                document.removeEventListener('mouseup', handleMouseUp)
                              }
                              document.addEventListener('mouseup', handleMouseUp)
                            }, 500)
                            const handleMouseUp = () => {
                              clearTimeout(timeout)
                              document.removeEventListener('mouseup', handleMouseUp)
                            }
                            document.addEventListener('mouseup', handleMouseUp)
                          }}
                          className="px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground font-bold transition-all text-sm"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            const newSeconds = Math.max(60, workDurationSeconds - 1)
                            setWorkDurationSeconds(newSeconds)
                            if (sessionType === 'work') {
                              setRemainingSeconds(newSeconds)
                            }
                          }}
                          onMouseDown={(e) => {
                            let timeout = setTimeout(() => {
                              const interval = setInterval(() => {
                                setWorkDurationSeconds(prev => {
                                  const updated = Math.max(60, prev - 1)
                                  if (sessionType === 'work') {
                                    setRemainingSeconds(updated)
                                  }
                                  return updated
                                })
                              }, 100)
                              const handleMouseUp = () => {
                                clearInterval(interval)
                                document.removeEventListener('mouseup', handleMouseUp)
                              }
                              document.addEventListener('mouseup', handleMouseUp)
                            }, 500)
                            const handleMouseUp = () => {
                              clearTimeout(timeout)
                              document.removeEventListener('mouseup', handleMouseUp)
                            }
                            document.addEventListener('mouseup', handleMouseUp)
                          }}
                          className="px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground font-bold transition-all text-sm"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[15, 25, 30, 45, 60, 90, 120].map((min) => (
                        <button
                          key={min}
                          onClick={() => {
                            setWorkDurationSeconds(min * 60)
                            if (sessionType === 'work') {
                              setRemainingSeconds(min * 60)
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            workDurationSeconds === min * 60
                              ? 'bg-primary text-foreground shadow-md'
                              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                          }`}
                        >
                          {min >= 60 ? `${min / 60}h` : `${min}m`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Break Duration */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Break Session
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-2 rounded-lg bg-input border border-border text-foreground text-center text-lg font-semibold font-mono">
                        {breakDurationSeconds >= 3600
                          ? `${Math.floor(breakDurationSeconds / 3600).toString().padStart(2, '0')}:${Math.floor((breakDurationSeconds % 3600) / 60).toString().padStart(2, '0')}:${(breakDurationSeconds % 60).toString().padStart(2, '0')}`
                          : `${Math.floor(breakDurationSeconds / 60).toString().padStart(2, '0')}:${(breakDurationSeconds % 60).toString().padStart(2, '0')}`
                        }
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            const newSeconds = Math.min(3600, breakDurationSeconds + 1)
                            setBreakDurationSeconds(newSeconds)
                            if (sessionType === 'break') {
                              setRemainingSeconds(newSeconds)
                            }
                          }}
                          onMouseDown={(e) => {
                            let timeout = setTimeout(() => {
                              const interval = setInterval(() => {
                                setBreakDurationSeconds(prev => {
                                  const updated = Math.min(3600, prev + 1)
                                  if (sessionType === 'break') {
                                    setRemainingSeconds(updated)
                                  }
                                  return updated
                                })
                              }, 100)
                              const handleMouseUp = () => {
                                clearInterval(interval)
                                document.removeEventListener('mouseup', handleMouseUp)
                              }
                              document.addEventListener('mouseup', handleMouseUp)
                            }, 500)
                            const handleMouseUp = () => {
                              clearTimeout(timeout)
                              document.removeEventListener('mouseup', handleMouseUp)
                            }
                            document.addEventListener('mouseup', handleMouseUp)
                          }}
                          className="px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground font-bold transition-all text-sm"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            const newSeconds = Math.max(60, breakDurationSeconds - 1)
                            setBreakDurationSeconds(newSeconds)
                            if (sessionType === 'break') {
                              setRemainingSeconds(newSeconds)
                            }
                          }}
                          onMouseDown={(e) => {
                            let timeout = setTimeout(() => {
                              const interval = setInterval(() => {
                                setBreakDurationSeconds(prev => {
                                  const updated = Math.max(60, prev - 1)
                                  if (sessionType === 'break') {
                                    setRemainingSeconds(updated)
                                  }
                                  return updated
                                })
                              }, 100)
                              const handleMouseUp = () => {
                                clearInterval(interval)
                                document.removeEventListener('mouseup', handleMouseUp)
                              }
                              document.addEventListener('mouseup', handleMouseUp)
                            }, 500)
                            const handleMouseUp = () => {
                              clearTimeout(timeout)
                              document.removeEventListener('mouseup', handleMouseUp)
                            }
                            document.addEventListener('mouseup', handleMouseUp)
                          }}
                          className="px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground font-bold transition-all text-sm"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[3, 5, 10, 15, 20, 30].map((min) => (
                        <button
                          key={min}
                          onClick={() => {
                            setBreakDurationSeconds(min * 60)
                            if (sessionType === 'break') {
                              setRemainingSeconds(min * 60)
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            breakDurationSeconds === min * 60
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

                {/* Repeating mode option */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={repeating}
                      onChange={(e) => setRepeating(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <span className="text-sm text-foreground">Repeating</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableSound}
                      onChange={(e) => setEnableSound(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <span className="text-sm text-foreground">Completion sound</span>
                  </label>
                </div>
              </div>
            )}

            {/* Right: Animation GIF - shown when session is active */}
            {status === 'active' && (
              <div className="flex items-center justify-center">
                <img 
                  src={sessionType === 'work' ? '/work-animation.gif' : '/break-animation.gif'} 
                  alt={sessionType === 'work' ? 'Work animation' : 'Break animation'}
                  className="w-80 h-80 object-contain rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3 justify-center flex-wrap mt-6">
            {status === 'idle' && (
              <button
                onClick={handleStart}
                className={`flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-lg hover:shadow-lg transition-all active:scale-95 ${
                  sessionType === 'work'
                    ? 'bg-gradient-to-r from-primary to-accent text-foreground'
                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                }`}
              >
                <Play className="w-5 h-5" />
                Start
              </button>
            )}

            {status === 'active' && (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-6 py-3 text-base bg-yellow-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all active:scale-95"
              >
                <Pause className="w-5 h-5" />
                Pause
              </button>
            )}

            {status === 'paused' && (
              <button
                onClick={handleResume}
                className="flex items-center gap-2 px-6 py-3 text-base bg-gradient-to-r from-primary to-accent text-foreground font-semibold rounded-lg hover:shadow-lg transition-all active:scale-95"
              >
                <Play className="w-5 h-5" />
                Resume
              </button>
            )}

            {status !== 'idle' && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 text-base bg-red-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all active:scale-95"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}