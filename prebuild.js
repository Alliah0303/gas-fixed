#!/usr/bin/env node
// Pre-build script to ensure correct project structure

const fs = require('fs');
const path = require('path');

console.log('🔧 Pre-build: Checking project structure...');

// Check if we're in the correct directory
const packageJsonPath = path.join(__dirname, 'package.json');
const appJsonPath = path.join(__dirname, 'app.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found in current directory');
  console.log('Current directory:', __dirname);
  console.log('Looking for:', packageJsonPath);
  process.exit(1);
}

if (!fs.existsSync(appJsonPath)) {
  console.error('❌ app.json not found in current directory');
  console.log('Current directory:', __dirname);
  console.log('Looking for:', appJsonPath);
  process.exit(1);
}

console.log('✅ package.json found');
console.log('✅ app.json found');
console.log('✅ Project structure is correct');

// Verify key files exist
const requiredFiles = [
  'package.json',
  'app.json',
  'eas.json',
  'tsconfig.json'
];

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.error(`❌ ${file} missing`);
    process.exit(1);
  }
}

console.log('🎉 All required files found. Build can proceed.');
