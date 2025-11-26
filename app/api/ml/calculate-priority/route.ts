/**
 * API Route: Calculate Task Priority using ML Model
 * POST /api/ml/calculate-priority
 * 
 * Executes Python ML model to calculate task priority scores
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, tasks } = body;

    // Validate input
    if (!task && !tasks) {
      return NextResponse.json(
        { error: 'Either task or tasks array is required' },
        { status: 400 }
      );
    }

    // Prepare input for Python script
    const input = task || tasks;
    const inputJson = JSON.stringify(input);

    // Path to Python script
    const scriptPath = path.join(process.cwd(), 'ml_model', 'task_priority_model.py');

    // Execute Python script
    const pythonCommand = `python "${scriptPath}" '${inputJson.replace(/'/g, "\\'")}'`;
    
    try {
      const { stdout, stderr } = await execAsync(pythonCommand, {
        timeout: 10000, // 10 second timeout
        maxBuffer: 1024 * 1024, // 1MB buffer
      });

      if (stderr && !stdout) {
        console.error('Python stderr:', stderr);
        throw new Error('Python script error: ' + stderr);
      }

      // Parse Python output
      const result = JSON.parse(stdout.trim());

      if (result.error) {
        throw new Error(result.error);
      }

      return NextResponse.json({
        success: true,
        data: result,
      });

    } catch (execError: any) {
      console.error('Execution error:', execError);
      
      // Check if Python is not installed
      if (execError.message.includes('python')) {
        return NextResponse.json(
          { 
            error: 'Python is not installed or not in PATH',
            details: 'Please install Python 3.x and ensure it\'s in your system PATH'
          },
          { status: 500 }
        );
      }

      throw execError;
    }

  } catch (error: any) {
    console.error('ML Priority API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate priority',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to calculate priority for a single task
 */
export async function calculateTaskPriority(taskData: {
  due_date: string;
  difficulty: number;
  weight: number;
}): Promise<number> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/ml/calculate-priority`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task: taskData }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data.priority;
  } catch (error) {
    console.error('Error calculating priority:', error);
    // Fallback to simple calculation
    return 50; // Default medium priority
  }
}
