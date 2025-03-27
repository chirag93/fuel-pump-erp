
// Simple script to run tests locally
const { execSync } = require('child_process');

try {
  console.log('Running tests...');
  
  // Run Jest tests with CI=true to ensure they don't hang
  try {
    execSync('CI=true node package-scripts.js test', { stdio: 'inherit' });
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Unexpected error running tests:', error.message);
  process.exit(1);
}
