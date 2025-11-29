import pool from '@/lib/db'
import fs from 'fs'
import path from 'path'

/**
 * Export tasks for a user to CSV
 * Columns: id, default_difficulty, default_weight, due_date
 */
export async function exportTasksToCSV(userId: number, outFile: string) {
  // Query tasks for user
  const [tasks]: any = await pool.query(
    `SELECT t.id, tt.default_difficulty, tt.default_weight, t.due_date
     FROM tasks t
     LEFT JOIN task_types tt ON t.task_type_id = tt.id
     WHERE t.user_id = ?`,
    [userId]
  )
  // CSV header
  const header = 'id,default_difficulty,default_weight,due_date\n'
  // CSV rows
  const rows = tasks.map((t: any) => `${t.id},${t.default_difficulty || 5},${t.default_weight || 5},${t.due_date}`)
  // Write to file
  fs.writeFileSync(outFile, header + rows.join('\n'))
  return outFile
}

/**
 * Update priority_score in DB from CSV (expects columns: id,priority_score)
 */
export async function updatePriorityFromCSV(csvFile: string) {
  const data = fs.readFileSync(csvFile, 'utf8')
  const lines = data.trim().split('\n')
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const [id, priority_score] = lines[i].split(',')
    await pool.query('UPDATE tasks SET priority_score = ? WHERE id = ?', [parseFloat(priority_score), id])
  }
}

// Example usage:
// await exportTasksToCSV(1, path.join(process.cwd(), 'user_1_tasks.csv'))
// await updatePriorityFromCSV(path.join(process.cwd(), 'user_1_tasks_with_priority.csv'))
