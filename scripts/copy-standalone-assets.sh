#!/bin/bash
# Copy static assets to standalone output for Azure deployment

set -e  # Exit on error

echo "📦 Copying assets to standalone output..."

# Wait for build to complete
sleep 1

# Copy public folder
if [ -d "public" ]; then
  echo "✓ Copying public/ to .next/standalone/"
  cp -r public .next/standalone/
else
  echo "⚠ Warning: public/ folder not found"
fi

# Copy static folder
if [ -d ".next/static" ]; then
  echo "✓ Copying .next/static/ to .next/standalone/.next/"
  mkdir -p .next/standalone/.next/
  cp -r .next/static .next/standalone/.next/
else
  echo "⚠ Warning: .next/static/ folder not found"
fi

echo "✅ Assets copied successfully!"
