"use client"

import type * as React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Upload, Trash2, User, Camera, Pencil, ImagePlus } from "lucide-react"

export default function ProfileModal({ children, open, onOpenChange }: { 
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void 
}) {
  const [name, setName] = useState<string>("")
  const [preview, setPreview] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    const userId = user?.id || 1
    
    // Fetch profile from API
    fetch(`/api/profile?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setName(data.name || "")
        setPreview(data.image || null)
      })
      .catch(err => {
        console.error('Failed to load profile:', err)
        setName("Student")
        setPreview(null)
      })
  }, [])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string | null
      if (result) setPreview(result)
    }
    reader.readAsDataURL(f)
  }

  function generateAvatarDataUrl(displayName: string) {
    const initials = displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s.charAt(0).toUpperCase())
      .join("") || displayName.charAt(0).toUpperCase()

    // pick a muted background color based on a simple hash so it's consistent per name
    let hash = 0
    for (let i = 0; i < displayName.length; i++) {
      hash = displayName.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    const bg = `hsl(${hue} 60% 35%)`
    const fg = `#ffffff`

    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'>` +
      `<rect width='100%' height='100%' fill='${bg}' rx='16'/>` +
      `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Poppins, Inter, system-ui, sans-serif' font-size='52' fill='${fg}'>${initials}</text>` +
      `</svg>`

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  async function handleSave(onClose?: () => void) {
    const imageToSave = preview || generateAvatarDataUrl(name || "Student")
    
    // Get user from localStorage
    const userStr = localStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    const userId = user?.id || 1
    
    const payload = { userId, name, image: imageToSave }
    
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        // Update user in localStorage
        if (user) {
          localStorage.setItem("user", JSON.stringify({ ...user, name, image: imageToSave }))
        }
        // Notify other components that profile was updated
        window.dispatchEvent(new CustomEvent("profile:updated", { detail: { name, image: imageToSave } }))
        if (onClose) onClose()
      } else {
        console.error('Failed to save profile')
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
    }
  }

  function handleDeletePicture(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setPreview(null)
    setShowMenu(false)
  }

  function handleFileClick() {
    setShowMenu(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>Update your display name and profile picture</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 pt-2">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                {preview ? (
                  <img src={preview} alt="avatar preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent">
                    <User className="w-12 h-12 text-foreground" />
                  </div>
                )}
              </Avatar>
              
              {/* Pencil Icon Button */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary hover:bg-accent text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                title="Edit profile picture"
              >
                <Pencil className="w-4 h-4" />
              </button>
              
              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="flex items-center gap-3 px-4 py-3 hover:bg-secondary hover:scale-[1.02] cursor-pointer transition-all duration-150 relative">
                    <ImagePlus className="w-4 h-4 text-primary transition-transform group-hover:scale-110" />
                    <span className="text-sm text-foreground">Change Picture</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => { handleFile(e); handleFileClick(); }} 
                      className="hidden" 
                    />
                  </label>
                  {preview && (
                    <button
                      onClick={handleDeletePicture}
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/20 hover:scale-[1.02] transition-all duration-150 text-left"
                    >
                      <Trash2 className="w-4 h-4 text-red-500 transition-transform hover:scale-110" />
                      <span className="text-sm text-foreground hover:text-red-600 transition-colors">Delete Picture</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="w-full">
              <label className="text-xs text-muted-foreground block mb-1">Display name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button 
              onClick={() => handleSave()} 
              className="bg-primary hover:bg-gradient-to-r hover:from-primary hover:to-accent active:bg-accent active:scale-95 transition-all duration-300"
            >
              Save
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
