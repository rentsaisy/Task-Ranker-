"use client"

import { Settings, Bell, Moon, Sun, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState({
    notifications: true,
    reminderTime: "1hour",
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-secondary/20 to-background neural-bg">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-md">
              <Settings className="w-6 h-6 text-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Settings</h1>
          </div>
          <p className="text-muted-foreground ml-13">Customize your preferences</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Theme */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Moon className="w-5 h-5 text-primary" />
                ) : (
                  <Sun className="w-5 h-5 text-primary" />
                )}
                <div>
                  <h3 className="font-semibold text-foreground">Theme</h3>
                  <p className="text-xs text-muted-foreground">Current: {theme === "dark" ? "Dark Mode" : "Light Mode"}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    theme === "light"
                      ? "bg-primary text-foreground"
                      : "bg-input border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sun className="w-4 h-4 inline mr-2" />
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    theme === "dark"
                      ? "bg-primary text-foreground"
                      : "bg-input border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Moon className="w-4 h-4 inline mr-2" />
                  Dark
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Notifications</h3>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-muted-foreground">Enable task reminders</span>
            </label>
          </div>

          {/* Reminder Time */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Reminder Time</h3>
            </div>
            <select 
              value={settings.reminderTime}
              onChange={(e) => setSettings({ ...settings, reminderTime: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="30mins">30 minutes before</option>
              <option value="1hour">1 hour before</option>
              <option value="2hours">2 hours before</option>
              <option value="1day">1 day before</option>
            </select>
          </div>

          {/* Save Button */}
          <button className="w-full bg-gradient-to-r from-primary to-accent text-foreground font-semibold py-3 rounded-lg hover:shadow-lg smooth-transition active:scale-95 transition-all">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
