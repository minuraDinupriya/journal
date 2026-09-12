const { spawn, exec } = require('child_process');

console.log("Starting TradeJournal Server...");
console.log("Please wait while the application boots up...\n");

const nextProcess = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev'], {
  stdio: 'pipe'
});

let opened = false;

nextProcess.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  
  if (!opened && (output.toLowerCase().includes('ready') || output.includes('http://localhost:3000'))) {
    opened = true;
    console.log("\n=============================================");
    console.log("TradeJournal is ready! Opening in App Mode...");
    console.log("Keep this window open while using the app.");
    console.log("Close this window to completely shut down.");
    console.log("=============================================\n");
    
    // Try to open in Chrome App Mode, fallback to Edge App Mode, fallback to default browser
    exec('start chrome --app=http://localhost:3000 || start msedge --app=http://localhost:3000 || start http://localhost:3000');
  }
});

nextProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});
