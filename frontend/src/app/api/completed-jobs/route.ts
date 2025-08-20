import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Handle GET requests to fetch completed jobs
export async function GET(request: NextRequest) {
  try {
    // Path to the completed jobs file created by the worker
    const resultsFile = path.join(process.cwd(), '..', 'worker', 'src', 'temp', 'completed_jobs.json');
    
    if (!fs.existsSync(resultsFile)) {
      return NextResponse.json({ 
        success: true, 
        jobs: [],
        message: 'No completed jobs found'
      });
    }
    
    const fileContent = fs.readFileSync(resultsFile, 'utf-8');
    const completedJobs = JSON.parse(fileContent);
    
    // Sort by completion time (newest first)
    completedJobs.sort((a: any, b: any) => b.completed_at - a.completed_at);
    
    console.log(`[Frontend API] Returning ${completedJobs.length} completed jobs`);
    
    return NextResponse.json({ 
      success: true, 
      jobs: completedJobs
    });
  } catch (error) {
    console.error('[Frontend API] Error fetching completed jobs:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch completed jobs',
      jobs: []
    }, { status: 500 });
  }
}
