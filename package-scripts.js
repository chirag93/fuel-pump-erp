
// This file is used to execute scripts without modifying package.json
const { execSync } = require('child_process');
const fs = require('fs');

// Load scripts from .scripts.json
try {
  const scriptsConfig = JSON.parse(fs.readFileSync('./.scripts.json', 'utf8'));

  // Get the command to run from command line arguments
  const scriptToRun = process.argv[2];

  if (!scriptToRun) {
    console.error('Please provide a script name to run');
    process.exit(1); // Exit with failure code to properly signal error
  }

  if (scriptsConfig.scripts[scriptToRun]) {
    try {
      console.log(`Running script: ${scriptToRun}`);
      execSync(scriptsConfig.scripts[scriptToRun], { stdio: 'inherit' });
    } catch (error) {
      console.error(`Error running script "${scriptToRun}":`, error.message);
      // Exit with proper error code to indicate test failure
      if (scriptToRun === 'test') {
        console.error('Tests failed. Check test output for details.');
        process.exit(1); // Signal test failure to Netlify
      }
      // For other scripts, exit with non-zero code
      process.exit(1);
    }
  } else {
    console.error(`Script "${scriptToRun}" not found in .scripts.json`);
    process.exit(1); // Exit with failure code
  }
} catch (error) {
  console.error('Failed to read scripts configuration:', error.message);
  process.exit(1); // Exit with failure code
}
