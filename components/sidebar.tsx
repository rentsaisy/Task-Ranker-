"use client"

import { LayoutDashboard, Plus, List, Brain, Info, Sparkles, Zap, ChevronLeft, ChevronRight, Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

interface SidebarProps {
  open: boolean
  currentPage: string
  onNavigate: (page: string) => void
  onToggle: () => void
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tasks", label: "Task List", icon: List },
  { id: "input", label: "Input Task Type", icon: Plus },
  { id: "results", label: "Focus Mode", icon: Brain },
  { id: "about", label: "About", icon: Info },
]

export default function Sidebar({ open, currentPage, onNavigate, onToggle }: SidebarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/20 md:hidden z-40" onClick={() => onNavigate(currentPage)} />}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative ${open ? 'w-64' : 'w-20'} h-screen bg-card border-r border-border transition-all duration-300 z-50 md:z-0 flex flex-col`}
      >
        {/* Toggle button on border */}
        <button
          onClick={onToggle}
          className="hidden md:flex absolute -right-4 top-20 w-8 h-8 bg-card border border-border rounded-full items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 z-50"
        >
          {open ? (
            <ChevronLeft className="w-4 h-4 text-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-foreground" />
          )}
        </button>
        {/* Logo section */}
        <div className="p-6 flex items-center gap-1 smooth-transition mt-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-accent to-ml-accent rounded-lg flex items-center justify-center shadow-lg smooth-transition hover:scale-110 flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            {open && (
              <div className="min-w-0">
                <h2 className="font-bold text-foreground truncate">TASK RANKER</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Prioritize your tasks
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center ${open ? 'gap-3 px-4' : 'justify-center px-3'} py-3 rounded-lg transition-all duration-200 smooth-transition ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-accent text-foreground shadow-md scale-105"
                    : "text-foreground hover:bg-secondary hover:shadow-sm"
                }`}
                title={!open ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {open && <span className="font-medium text-sm">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`w-full flex items-center ${open ? 'gap-3 px-4' : 'justify-center px-3'} py-3 rounded-lg text-foreground hover:bg-secondary hover:shadow-sm transition-all duration-200 smooth-transition`}
              title={!open ? (theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode") : undefined}
            >
              {theme === "dark" ? (
                <Moon className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Sun className="w-5 h-5 flex-shrink-0" />
              )}
              {open && <span className="font-medium text-sm">{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
