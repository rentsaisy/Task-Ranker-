"use client"

import { Menu, Brain } from "lucide-react"
import { useState, useEffect } from "react"
import ProfileModal from "./profile-modal"

interface HeaderProps {
  sidebarOpen: boolean
  onToggleSidebar: (open: boolean) => void
}

export default function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  const [profile, setProfile] = useState<{ name?: string; image?: string } | null>(null)

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    const userId = user?.id || 1
    
    // Fetch profile from API on mount
    fetch(`/api/profile?userId=${userId}`)
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => {
        console.error('Failed to load profile:', err)
        setProfile({ name: 'Student' })
      })

    // Listen for profile updates from the modal
    function onProfileUpdated(e: CustomEvent) {
      if (e.detail) {
        setProfile(e.detail)
      } else {
        // Refetch if no detail provided
        fetch(`/api/profile?userId=${userId}`)
          .then(res => res.json())
          .then(data => setProfile(data))
          .catch(err => console.error('Failed to reload profile:', err))
      }
    }

    window.addEventListener("profile:updated", onProfileUpdated as EventListener)

    return () => {
      window.removeEventListener("profile:updated", onProfileUpdated as EventListener)
    }
  }, [])

  const displayName = profile?.name || "Student"
  const initial = (profile?.name || "Student").charAt(0).toUpperCase()

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Menu toggle */}
        <button
          onClick={() => onToggleSidebar(!sidebarOpen)}
          className="p-2 hover:bg-secondary rounded-lg transition-colors md:hidden smooth-transition"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>

        {/* Center - Logo and Title */}
        <div className="flex items-center gap-4 flex-1 md:flex-initial">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary via-accent to-ml-accent rounded-lg flex items-center justify-center shadow-md smooth-transition hover:scale-105">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">Task Prioritization System</h1>
              <p className="text-xs text-muted-foreground">ML-Powered Academic Management</p>
            </div>
          </div>
        </div>

        {/* Right side - User profile */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-sm font-medium text-foreground">{displayName}</span>
            <ProfileModal>
              <button className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-sm font-semibold text-foreground shadow-md">
                {profile?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.image} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <span>{initial}</span>
                )}
              </button>
            </ProfileModal>
          </div>
        </div>
      </div>
    </header>
  )
}
