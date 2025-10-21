#!/usr/bin/env node
// Fix build directory structure issue

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing build directory structure...');

// Check if we're in the correct directory
const currentDir = __dirname;
const packageJsonPath = path.join(currentDir, 'package.json');

console.log('Current directory:', currentDir);
console.log('Looking for package.json at:', packageJsonPath);

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found!');
  console.log('Available files in current directory:');
  try {
    const files = fs.readdirSync(currentDir);
    files.forEach(file => {
      console.log('  -', file);
    });
  } catch (error) {
    console.error('Error reading directory:', error.message);
  }
  process.exit(1);
}

console.log('✅ package.json found');

// Verify the package.json content
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log('✅ package.json is valid JSON');
  console.log('Project name:', packageJson.name);
  console.log('Main entry:', packageJson.main);
} catch (error) {
  console.error('❌ package.json is not valid JSON:', error.message);
  process.exit(1);
}

// Check other required files
const requiredFiles = ['app.json', 'eas.json'];
for (const file of requiredFiles) {
  const filePath = path.join(currentDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} found`);
  } else {
    console.error(`❌ ${file} missing`);
    process.exit(1);
  }
}

console.log('🎉 All required files found. Build should work now.');
