"use client"

import { Info, Github, Globe, Heart } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-secondary/20 to-background neural-bg">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-md">
              <Info className="w-6 h-6 text-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">About</h1>
          </div>
          <p className="text-muted-foreground ml-13">Learn more about Task Prioritization System</p>
        </div>

        {/* About Content */}
        <div className="space-y-6">
          {/* Main Card */}
          <div className="bg-card rounded-xl border border-border p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Academic Task Prioritization System</h2>
              <p className="text-muted-foreground leading-relaxed">
                A modern, AI-powered dashboard designed to help university students manage their academic workload
                efficiently. By leveraging machine learning algorithms, our system analyzes task complexity, deadlines,
                and importance to provide optimal prioritization recommendations.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Key Features</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>ML-powered task prioritization</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Real-time priority visualization</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">✓</span>
                  <span>Intuitive task management interface</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">✓</span>
                  <span>Academic-focused design</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Version Information</h3>
              <p className="text-muted-foreground">
                <strong>Version:</strong> 1.0.0
                <br />
                <strong>Release Date:</strong> 2024
                <br />
                <strong>Status:</strong> Production Ready
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="#"
              className="bg-card border border-border rounded-xl p-4 hover:shadow-md smooth-transition flex items-center gap-3"
            >
              <Github className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground text-sm">GitHub</p>
                <p className="text-xs text-muted-foreground">View Source</p>
              </div>
            </a>
            <a
              href="#"
              className="bg-card border border-border rounded-xl p-4 hover:shadow-md smooth-transition flex items-center gap-3"
            >
              <Globe className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground text-sm">Website</p>
                <p className="text-xs text-muted-foreground">Learn More</p>
              </div>
            </a>
            <a
              href="#"
              className="bg-card border border-border rounded-xl p-4 hover:shadow-md smooth-transition flex items-center gap-3"
            >
              <Heart className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground text-sm">Support</p>
                <p className="text-xs text-muted-foreground">Help Us</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
