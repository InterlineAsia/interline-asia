#!/usr/bin/env node
// 🕒 Nightly System Check Scheduler
// Runs comprehensive system health checks at 3:00 AM daily

const schedule = require('node-schedule');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'nightly-log.txt');

function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  console.log(logEntry.trim());
  fs.appendFileSync(logFile, logEntry);
}

function runNightlyCheck() {
  logMessage('🕒 STARTING NIGHTLY SYSTEM CHECK');
  logMessage('Scheduler: Triggering nightly-system-check.js');
  
  const checkScript = path.join(process.cwd(), 'nightly-system-check.cjs');
  
  // Spawn the system check process
  const child = spawn('node', [checkScript], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env }
  });
  
  // Capture stdout and log it
  child.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      logMessage(`CHECK: ${output}`);
    }
  });
  
  // Capture stderr and log it
  child.stderr.on('data', (data) => {
    const error = data.toString().trim();
    if (error) {
      logMessage(`ERROR: ${error}`);
    }
  });
  
  // Handle process completion
  child.on('close', (code) => {
    if (code === 0) {
      logMessage('✅ NIGHTLY CHECK COMPLETED SUCCESSFULLY');
    } else {
      logMessage(`❌ NIGHTLY CHECK FAILED WITH CODE: ${code}`);
    }
    logMessage('Scheduler: Waiting for next scheduled run at 3:00 AM');
    logMessage('─'.repeat(80));
  });
  
  // Handle process errors
  child.on('error', (error) => {
    logMessage(`🚨 SCHEDULER ERROR: ${error.message}`);
  });
}

// Schedule the job for 3:00 AM daily
const job = schedule.scheduleJob('0 3 * * *', () => {
  runNightlyCheck();
});

// Log scheduler startup
logMessage('🚀 NIGHTLY SYSTEM CHECK SCHEDULER STARTED');
logMessage('Schedule: Daily at 3:00 AM (0 3 * * *)');
logMessage('Script: nightly-system-check.js');
logMessage(`Log File: ${logFile}`);
logMessage('Status: Waiting for first scheduled run...');

// Handle graceful shutdown
process.on('SIGINT', () => {
  logMessage('📴 SCHEDULER SHUTDOWN REQUESTED');
  if (job) {
    job.cancel();
    logMessage('Cancelled scheduled job');
  }
  logMessage('Scheduler stopped gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logMessage('📴 SCHEDULER TERMINATION REQUESTED');
  if (job) {
    job.cancel();
    logMessage('Cancelled scheduled job');
  }
  logMessage('Scheduler terminated gracefully');
  process.exit(0);
});

// Keep the process alive
console.log('Nightly System Check Scheduler is running...');
console.log('Press Ctrl+C to stop');