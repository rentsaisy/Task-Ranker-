"use client"

import { Bell, Moon, Sun, Clock, MessageCircle, CheckCircle2, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const [settings, setSettings] = useState({
    notifications: true,
    reminderTime: "1hour",
    discordUserId: "",
  })

  useEffect(() => {
    setMounted(true)
    
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem("taskRankerSettings")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  const handleSaveSettings = async () => {
    setSaving(true)
    setSaveStatus("idle")
    
    try {
      // Save to localStorage
      localStorage.setItem("taskRankerSettings", JSON.stringify(settings))
      
      // Get user from localStorage
      const userStr = localStorage.getItem("user")
      let user = null
      try {
        user = userStr ? JSON.parse(userStr) : null
      } catch {
        // Ignore parse errors
      }
      const userId = user?.id
      
      // If user is logged in, save Discord User ID to profile
      if (userId && settings.discordUserId) {
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            discordUserId: settings.discordUserId,
          }),
        })
        
        if (!response.ok) {
          throw new Error("Failed to save Discord User ID")
        }
      }
      
      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch {
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } finally {
      setSaving(false)
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-secondary/20 to-background">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-6">
            {/* Skeleton loading state */}
            <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-secondary/20 to-background neural-bg">
      <div className="max-w-2xl mx-auto space-y-8">

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

          {/* Discord Integration */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Discord Notifications</h3>
                <p className="text-xs text-muted-foreground">Connect to receive task reminders via Discord</p>
              </div>
            </div>
            <div className="space-y-3">
              <label htmlFor="discordUserId" className="text-sm text-muted-foreground">
                Discord User ID
              </label>
              <input
                id="discordUserId"
                type="text"
                value={settings.discordUserId}
                onChange={(e) => setSettings({ ...settings, discordUserId: e.target.value })}
                placeholder="Enter your Discord User ID (e.g., 123456789012345678)"
                className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                To find your Discord User ID: Enable Developer Mode in Discord Settings → User Settings → Advanced, then right-click your username and select &quot;Copy User ID&quot;.
              </p>
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
          <button 
            onClick={handleSaveSettings}
            disabled={saving}
            className="w-full bg-gradient-to-r from-primary to-accent text-foreground font-semibold py-3 rounded-lg hover:shadow-lg smooth-transition active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              "Saving..."
            ) : saveStatus === "success" ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Settings Saved!
              </>
            ) : saveStatus === "error" ? (
              <>
                <AlertCircle className="w-5 h-5" />
                Failed to Save
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
