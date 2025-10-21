// Build configuration for EAS Build
const path = require('path');

module.exports = {
  // Ensure the build process finds the correct files
  projectRoot: __dirname,
  packageJsonPath: path.join(__dirname, 'package.json'),
  
  // Build hooks to fix path issues
  hooks: {
    prebuild: async () => {
      console.log('🔧 Pre-build: Ensuring correct project structure...');
      
      // Check if package.json exists
      const fs = require('fs');
      const packageJsonPath = path.join(__dirname, 'package.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        console.error('❌ package.json not found at:', packageJsonPath);
        process.exit(1);
      }
      
      console.log('✅ package.json found at:', packageJsonPath);
      
      // Ensure proper permissions
      try {
        const stats = fs.statSync(packageJsonPath);
        console.log('✅ package.json permissions:', stats.mode.toString(8));
      } catch (error) {
        console.warn('⚠️ Could not check package.json permissions:', error.message);
      }
    }
  }
};
