
// Script to run tests for Record Indent functionality
const { execSync } = require('child_process');

try {
  console.log('Running Record Indent tests...');
  
  // Run React component tests
  console.log('\n🧪 Running component tests:');
  try {
    execSync('npx jest "indent/__tests__" "pages/__tests__/RecordIndent.test.tsx"', { stdio: 'inherit' });
  } catch (error) {
    console.error('Component tests failed:', error.message);
    process.exit(1);
  }
  
  // Run integration tests
  console.log('\n🧪 Running integration tests:');
  try {
    execSync('npx jest "integrations/__tests__/indents.test.ts"', { stdio: 'inherit' });
  } catch (error) {
    console.error('Integration tests failed:', error.message);
    process.exit(1);
  }
  
  // Run backend API tests
  console.log('\n🧪 Running backend API tests:');
  try {
    execSync('npx jest "backend/__tests__/app.test.js"', { stdio: 'inherit' });
  } catch (error) {
    console.error('Backend API tests failed:', error.message);
    process.exit(1);
  }
  
  console.log('\n✅ All tests completed successfully!');
} catch (error) {
  console.error('\n❌ Tests failed with unexpected error:', error.message);
  process.exit(1);
}
