"use client"

import type * as React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Upload, Trash2, User } from "lucide-react"

export default function ProfileModal({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState<string>("")
  const [preview, setPreview] = useState<string | null>(null)

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

  function handleDeletePicture() {
    setPreview(null)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
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
              {preview && (
                <button
                  onClick={handleDeletePicture}
                  className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                  title="Delete profile picture"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="w-full">
              <label className="text-xs text-muted-foreground block mb-1">Display name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-2">Profile picture</label>
            <div className="relative">
              <label className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-secondary transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Choose file</span>
                <input type="file" accept="image/*" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Upload an image to personalize your avatar. Changes are stored locally.</p>
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
