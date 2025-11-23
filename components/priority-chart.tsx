"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface Task {
  id: number
  name: string
  priority: number
}

interface PriorityChartProps {
  tasks: Task[]
}

export default function PriorityChart({ tasks }: PriorityChartProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const chartData = [...tasks]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
    .map((task) => ({
      name: task.name.length > 20 ? task.name.substring(0, 20) + "..." : task.name,
      priority: Math.round(task.priority),
      fullName: task.name,
    }))

  // Colors based on theme
  const isDark = theme === "dark"
  const gridStroke = isDark ? "#475569" : "#e2e8f0"
  const textColor = isDark ? "#cbd5e1" : "#64748b"
  const tooltipBg = isDark ? "#1e293b" : "#f8fafc"
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0"
  const barColor = isDark ? "#7ba3c0" : "#a7c7e7"

  if (!mounted) return null

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fontSize: 12, fill: textColor }}
        />
        <YAxis tick={{ fontSize: 12, fill: textColor }} domain={[0, 100]} />
        <Tooltip
          contentStyle={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: "8px",
            color: textColor,
          }}
          labelStyle={{ color: textColor }}
        />
        <Bar dataKey="priority" fill={barColor} radius={[8, 8, 0, 0]} name="Priority Score" />
      </BarChart>
    </ResponsiveContainer>
  )
}
