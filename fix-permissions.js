#!/usr/bin/env node

// Fix permissions script for EAS Build
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing file permissions for EAS Build...');

function fixPermissions(dir) {
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        // Fix directory permissions
        fs.chmodSync(itemPath, 0o755);
        fixPermissions(itemPath);
      } else {
        // Fix file permissions
        fs.chmodSync(itemPath, 0o644);
      }
    }
  } catch (error) {
    console.warn(`⚠️ Could not fix permissions for ${dir}:`, error.message);
  }
}

// Fix permissions for key directories
const keyDirs = [
  '.',
  'app',
  'components',
  'constants',
  'lib',
  'hooks',
  'assets',
  'android'
];

keyDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`🔧 Fixing permissions for ${dir}...`);
    fixPermissions(dir);
  }
});

// Ensure package.json has correct permissions
if (fs.existsSync('package.json')) {
  fs.chmodSync('package.json', 0o644);
  console.log('✅ Fixed package.json permissions');
}

console.log('✅ Permission fix complete');

