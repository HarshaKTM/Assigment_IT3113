const { spawn } = require('child_process');
const path = require('path');

console.log('Starting database seeding...');

// Function to run a script and return a promise
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`Running ${scriptPath}...`);
    
    const process = spawn('node', [scriptPath], {
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`${scriptPath} completed successfully.`);
        resolve();
      } else {
        console.error(`${scriptPath} failed with code ${code}`);
        reject(`Process exited with code ${code}`);
      }
    });

    process.on('error', (err) => {
      console.error(`Failed to start ${scriptPath}:`, err);
      reject(err);
    });
  });
}

async function seedAll() {
  try {
    // Run scripts in sequence
    await runScript(path.join(__dirname, 'seedUsers.js'));
    await runScript(path.join(__dirname, 'seedBooks.js'));
    await runScript(path.join(__dirname, 'seedOrders.js'));
    
    console.log('All seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedAll(); 