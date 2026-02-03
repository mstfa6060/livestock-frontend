#!/usr/bin/env node
/**
 * Development server start script
 * - Kills any process running on port 3000
 * - Removes Next.js lock file
 * - Starts the development server
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PROJECT_ROOT = path.resolve(__dirname, '..');
const LOCK_FILE = path.join(PROJECT_ROOT, '.next', 'dev', 'lock');

function killProcessOnPort(port) {
  try {
    if (process.platform === 'win32') {
      // Windows
      const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      const lines = result.split('\n').filter(line => line.includes('LISTENING'));

      const pids = new Set();
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid)) {
          pids.add(pid);
        }
      });

      pids.forEach(pid => {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          console.log(`✓ Killed process ${pid} on port ${port}`);
        } catch (e) {
          // Process may have already exited
        }
      });
    } else {
      // Linux/Mac
      try {
        execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
        console.log(`✓ Killed process on port ${port}`);
      } catch (e) {
        // No process on port
      }
    }
  } catch (e) {
    // No process found on port - that's fine
    console.log(`✓ Port ${port} is available`);
  }
}

function removeLockFile() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
      console.log('✓ Removed Next.js lock file');
    }
  } catch (e) {
    // Lock file doesn't exist or can't be removed
  }
}

function startDevServer() {
  console.log('✓ Starting development server...\n');

  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npm, ['run', 'dev'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    shell: true
  });

  child.on('error', (err) => {
    console.error('Failed to start dev server:', err);
    process.exit(1);
  });
}

console.log('\n🚀 Starting development environment...\n');
killProcessOnPort(PORT);
removeLockFile();
startDevServer();
