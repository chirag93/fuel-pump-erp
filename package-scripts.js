
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
      
      // Use a more detailed output for test runs
      if (scriptToRun === 'test' || scriptToRun.startsWith('test:')) {
        console.log('----------------------------------------------');
        console.log(`RUNNING TESTS: ${scriptsConfig.scripts[scriptToRun]}`);
        console.log('----------------------------------------------');
      }
      
      execSync(scriptsConfig.scripts[scriptToRun], { stdio: 'inherit' });
      
      if (scriptToRun === 'test' || scriptToRun.startsWith('test:')) {
        console.log('----------------------------------------------');
        console.log('TESTS COMPLETED SUCCESSFULLY');
        console.log('----------------------------------------------');
      }
    } catch (error) {
      console.error(`Error running script "${scriptToRun}":`, error.message);
      
      // More detailed error output for tests
      if (scriptToRun === 'test' || scriptToRun.startsWith('test:')) {
        console.error('----------------------------------------------');
        console.error('TESTS FAILED');
        console.error('----------------------------------------------');
      }
      
      // Exit with proper error code to indicate test failure
      process.exit(1); // Signal failure to Netlify
    }
  } else {
    console.error(`Script "${scriptToRun}" not found in .scripts.json`);
    process.exit(1); // Exit with failure code
  }
} catch (error) {
  console.error('Failed to read scripts configuration:', error.message);
  process.exit(1); // Exit with failure code
}
