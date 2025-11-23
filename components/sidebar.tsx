"use client"

import { LayoutDashboard, Plus, List, Brain, Settings, Info, Sparkles, Zap, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

interface SidebarProps {
  open: boolean
  currentPage: string
  onNavigate: (page: string) => void
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "input", label: "Input Task", icon: Plus },
  { id: "tasks", label: "Task List", icon: List },
  { id: "results", label: "ML Priority Results", icon: Brain },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "about", label: "About", icon: Info },
]

export default function Sidebar({ open, currentPage, onNavigate }: SidebarProps) {
  const router = useRouter()
  
  function handleLogout() {
    localStorage.removeItem("user")
    router.push("/login")
  }
  
  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/20 md:hidden z-40" onClick={() => onNavigate(currentPage)} />}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative w-64 h-screen bg-card border-r border-border transition-transform duration-300 z-50 md:z-0 flex flex-col ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo section */}
        <div className="p-6 border-b border-border flex items-center gap-3 smooth-transition">
          <div className="w-10 h-10 bg-gradient-to-br from-primary via-accent to-ml-accent rounded-lg flex items-center justify-center shadow-lg smooth-transition hover:scale-110">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">PRITASK</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Prioritize your tasks
            </p>
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 smooth-transition ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-accent text-foreground shadow-md scale-105"
                    : "text-foreground hover:bg-secondary hover:shadow-sm"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:shadow-sm transition-all duration-200 smooth-transition"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Logout</span>
          </button>
          
          <div className="bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/30 rounded-lg p-4 relative overflow-hidden">
            <div className="absolute inset-0 neural-pattern opacity-30" />
            <div className="relative z-10">
              <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1">
                <Brain className="w-3 h-3" /> ML Engine
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Powered by machine learning for optimal task prioritization
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">Version 1.0.0</p>
        </div>
      </aside>
    </>
  )
}
