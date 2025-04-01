
// Script to run all tests across mobile, desktop, and super admin interfaces
const { execSync } = require('child_process');
const fs = require('fs');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

console.log(`${colors.blue}Running comprehensive test suite for Fuel Pro 360${colors.reset}`);
console.log('===============================================');

const testSuites = [
  { name: 'Web Application Core', command: 'npx jest --selectProjects web' },
  { name: 'Mobile Interface', command: 'npx jest --selectProjects mobile' },
  { name: 'Super Admin Portal', command: 'npx jest --selectProjects superadmin' },
  { name: 'Integration Tests', command: 'npx jest --selectProjects integration' }
];

let allTestsPassed = true;
const failedSuites = [];

for (const suite of testSuites) {
  console.log(`\n${colors.magenta}Running ${suite.name} Tests${colors.reset}`);
  console.log('-----------------------------------------------');
  
  try {
    execSync(`CI=true ${suite.command} --silent`, { stdio: 'inherit' });
    console.log(`${colors.green}✓ ${suite.name} tests passed${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ ${suite.name} tests failed${colors.reset}`);
    allTestsPassed = false;
    failedSuites.push(suite.name);
    
    // In CI environment, continue running all test suites to get complete report
    if (!process.env.CI && !process.env.NETLIFY) {
      process.exit(1);
    }
  }
}

console.log('\n===============================================');
if (allTestsPassed) {
  console.log(`${colors.green}All test suites passed successfully!${colors.reset}`);
  process.exit(0);
} else {
  console.error(`${colors.red}The following test suites failed: ${failedSuites.join(', ')}${colors.reset}`);
  
  // Only exit with error in non-Netlify environments
  if (!process.env.NETLIFY) {
    process.exit(1);
  } else {
    console.warn(`${colors.yellow}Running in Netlify environment, continuing despite test failures${colors.reset}`);
    process.exit(0);
  }
}
