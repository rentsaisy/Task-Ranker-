"use client"

import { Menu, Brain, LayoutDashboard, Plus, List, Settings, Info, User, LogOut, XIcon, AlertTriangle } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import ProfileModal from "./profile-modal"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  sidebarOpen: boolean
  onToggleSidebar: (open: boolean) => void
  currentPage: string
}

const pageConfig: Record<string, { label: string; icon: any; description: string }> = {
dashboard: { label: "Dashboard", icon: LayoutDashboard, description: "Overview of your task prioritization at a glance" },
  input: { label: "Input Task Type", icon: Plus, description: "Add new types of tasks" },
  tasks: { label: "Task List", icon: List, description: "View and manage all your tasks" },
  results: { label: "Focus Mode", icon: Brain, description: "Manage your focus and productivity" },
  settings: { label: "Settings", icon: Settings, description: "Customize your preferences" },
  about: { label: "About", icon: Info, description: "Learn more about Task Ranker" }
}

export default function Header({ sidebarOpen, onToggleSidebar, currentPage }: HeaderProps) {
  const [profile, setProfile] = useState<{ name?: string; image?: string } | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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

    // Close menu when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      window.removeEventListener("profile:updated", onProfileUpdated as EventListener)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  function handleSignOut() {
    localStorage.removeItem("user")
    router.push("/login")
  }

  function handleProfileClick() {
    setShowProfileMenu(false)
    setShowProfileModal(true)
  }

  function handleSignOutClick() {
    setShowProfileMenu(false)
    setShowSignOutDialog(true)
  }

  const displayName = profile?.name || "Student"
  const initial = (profile?.name || "Student").charAt(0).toUpperCase()
  
  const currentPageConfig = pageConfig[currentPage] || pageConfig.dashboard
  const PageIcon = currentPageConfig.icon

  return (
    <>
      <header className="bg-card sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        {/* Left side - Menu toggle */}
        <button
          onClick={() => onToggleSidebar(!sidebarOpen)}
          className="p-2 hover:bg-secondary rounded-lg transition-colors md:hidden smooth-transition"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>

        {/* Center - Current Page Title with Icon */}
        <div className="flex items-center gap-4 flex-1 md:flex-initial">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary via-accent to-ml-accent rounded-lg flex items-center justify-center shadow-md smooth-transition">
              <PageIcon className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-foreground">{currentPageConfig.label}</h1>
              <p className="text-xs text-muted-foreground">{currentPageConfig.description}</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-foreground">{currentPageConfig.label}</h1>
            </div>
          </div>
        </div>

        {/* Right side - User profile */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 relative" ref={profileMenuRef}>
            <span className="hidden sm:inline text-sm font-medium text-foreground">{displayName}</span>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-sm font-semibold text-foreground shadow-md hover:scale-105 transition-transform"
            >
              {profile?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.image} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <span>{initial}</span>
              )}
            </button>
            
            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={handleProfileClick}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary hover:scale-[1.02] transition-all duration-150 text-left"
                >
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">Profile</span>
                </button>
                <button
                  onClick={handleSignOutClick}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/20 hover:scale-[1.02] transition-all duration-150 text-left border-t border-border"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-foreground hover:text-red-600 transition-colors">Sign Out</span>
                </button>
              </div>
            )}
            
            {/* Profile Modal */}
            <ProfileModal open={showProfileModal} onOpenChange={setShowProfileModal} />
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation Popup */}
      {showSignOutDialog && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 animate-in fade-in duration-200"
            onClick={() => setShowSignOutDialog(false)}
          />
          
          {/* Popup */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in zoom-in-95 fade-in slide-in-from-top-4 duration-300">
            <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 m-4 relative">
              {/* Close button */}
              <button
                onClick={() => setShowSignOutDialog(false)}
                className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </button>
              
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center animate-in zoom-in duration-500 shadow-lg dark:shadow-yellow-900/20">
                  <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-center text-foreground mb-2">
                Are you sure?
              </h3>
              
              {/* Description */}
              <p className="text-sm text-center text-muted-foreground mb-6">
                Do you really want to sign out? You will be redirected to the login page.
              </p>
              
              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowSignOutDialog(false)}
                  variant="outline"
                  className="flex-1 hover:bg-secondary border-border"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSignOut}
                  className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white shadow-md"
                >
                  Yes, I'm sure
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
      </header>
    </>
  )
}
