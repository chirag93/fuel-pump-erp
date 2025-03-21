
// Simple script to run tests locally
const { execSync } = require('child_process');

try {
  console.log('Running tests...');
  execSync('node package-scripts.js test', { stdio: 'inherit' });
} catch (error) {
  console.error('Tests failed');
  process.exit(1);
}
