
// This file is used to execute scripts without modifying package.json
const { execSync } = require('child_process');
const fs = require('fs');

// Load scripts from .scripts.json
const scriptsConfig = JSON.parse(fs.readFileSync('./.scripts.json', 'utf8'));

// Get the command to run from command line arguments
const scriptToRun = process.argv[2];

if (scriptsConfig.scripts[scriptToRun]) {
  try {
    console.log(`Running script: ${scriptToRun}`);
    execSync(scriptsConfig.scripts[scriptToRun], { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error running script: ${scriptToRun}`);
    process.exit(1);
  }
} else {
  console.error(`Script "${scriptToRun}" not found in .scripts.json`);
  process.exit(1);
}
