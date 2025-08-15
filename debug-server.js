#!/usr/bin/env node

console.error('Debug: Starting OlaMap MCP Server...');
console.error('Debug: API Key present:', !!process.env.OLAMAP_API_KEY);
console.error('Debug: Node version:', process.version);
console.error('Debug: Arguments:', process.argv);

try {
  // Import and run your server
  import('./dist/index.js');
} catch (error) {
  console.error('Debug: Error importing server:', error);
  process.exit(1);
}