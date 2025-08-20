import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Handle POST requests from worker when job is completed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id, result_cid, status, ipfs_url } = body;
    
    console.log(`[Frontend API] Received job completion notification: Job ${job_id}, CID: ${result_cid}`);
    
    // Store the completion notification (optional - you could also just log it)
    // The main source of truth is the JSON file created by the worker
    
    return NextResponse.json({ 
      success: true, 
      message: `Job ${job_id} completion received` 
    });
  } catch (error) {
    console.error('[Frontend API] Error handling job completion:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process job completion' 
    }, { status: 500 });
  }
}
