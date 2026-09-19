const { spawn, exec, execSync } = require('child_process');

console.log("Starting TradeJournal Server...");
console.log("Please wait while the application boots up...\n");

// Free port 3000 if previously occupied by a stale process on Windows
try {
  const findPortCmd = 'netstat -ano | findstr :3000';
  const stdout = execSync(findPortCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
  const lines = stdout.trim().split('\n');
  for (const line of lines) {
    if (line.includes('LISTENING')) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && pid !== `${process.pid}`) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        } catch (_) {}
      }
    }
  }
} catch (_) {}

const nextProcess = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev'], {
  stdio: 'pipe',
  shell: true
});

let opened = false;
let detectedUrl = 'http://localhost:3000';

nextProcess.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);

  const urlMatch = output.match(/https?:\/\/localhost:\d+/i);
  if (urlMatch) {
    detectedUrl = urlMatch[0];
  }
  
  if (!opened && (output.toLowerCase().includes('ready') || (output.includes('http://localhost') && output.includes('Local:')))) {
    opened = true;
    console.log("\n=============================================");
    console.log(`TradeJournal is ready! Opening in App Mode at ${detectedUrl}...`);
    console.log("Keep this window open while using the app.");
    console.log("Close this window to completely shut down.");
    console.log("=============================================\n");
    
    // Try to open in Brave App Mode, fallback to Chrome, fallback to Edge, fallback to default browser
    exec(`start brave --app=${detectedUrl} || start chrome --app=${detectedUrl} || start msedge --app=${detectedUrl} || start ${detectedUrl}`);
  }
});

nextProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

function cleanup() {
  if (nextProcess && nextProcess.pid) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /F /T /PID ${nextProcess.pid}`, { stdio: 'ignore' });
      } else {
        nextProcess.kill();
      }
    } catch (_) {}
  }
}

process.on('SIGINT', () => {
  cleanup();
  process.exit();
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit();
});

process.on('exit', () => {
  cleanup();
});
