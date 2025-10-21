#!/bin/bash
# Build script for GasSecure app
echo "Starting build process..."
echo "Current directory: $(pwd)"
echo "Checking for package.json..."
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    echo "Installing dependencies..."
    npm install
    echo "Starting build..."
    npx expo build:android
else
    echo "❌ package.json not found"
    echo "Available files:"
    ls -la
    exit 1
fi
