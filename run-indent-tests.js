
// Script to run tests for Record Indent functionality
const { execSync } = require('child_process');

try {
  console.log('Running Record Indent tests...');
  
  // Run React component tests
  console.log('\n🧪 Running component tests:');
  execSync('npx jest "indent/__tests__" "pages/__tests__/RecordIndent.test.tsx"', { stdio: 'inherit' });
  
  // Run integration tests
  console.log('\n🧪 Running integration tests:');
  execSync('npx jest "integrations/__tests__/indents.test.ts"', { stdio: 'inherit' });
  
  // Run backend API tests
  console.log('\n🧪 Running backend API tests:');
  execSync('npx jest "backend/__tests__/app.test.js"', { stdio: 'inherit' });
  
  console.log('\n✅ All tests completed successfully!');
} catch (error) {
  console.error('\n❌ Tests failed.');
  process.exit(1);
}
