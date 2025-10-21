// Metro configuration for the GasSecure app
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add support for TypeScript
config.resolver.sourceExts.push('ts', 'tsx');

module.exports = config;
