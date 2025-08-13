#!/bin/bash

# Build script for Repair Shop Inventory System
# This script prepares the application for deployment

echo "🔨 Building Repair Shop Inventory System..."

# Create public directory if it doesn't exist
mkdir -p public

# Copy static assets
echo "📁 Copying static assets..."
cp *.js public/ 2>/dev/null || true
cp *.css public/ 2>/dev/null || true
cp *.html public/ 2>/dev/null || true
cp *.json public/ 2>/dev/null || true
cp *.toml public/ 2>/dev/null || true
cp *.svg public/ 2>/dev/null || true
cp _redirects public/ 2>/dev/null || true

# Copy any other important files
echo "📄 Copying configuration files..."
cp firebase-*.js public/ 2>/dev/null || true
cp quick-fix.js public/ 2>/dev/null || true
cp message-channel-fix.js public/ 2>/dev/null || true

# Ensure _redirects file is in public folder
if [ ! -f "public/_redirects" ]; then
    echo "⚠️  _redirects file not found, creating one..."
    cat > public/_redirects << 'EOF'
# Netlify redirects file
# Only redirect specific SPA routes, allowing static assets to be served directly

# Redirect SPA routes to index.html (only routes without file extensions)
/dashboard    /index.html   200
/inventory   /index.html   200
/purchases   /index.html   200
/vendors     /index.html   200
/customers   /index.html   200
/repairs     /index.html   200
/outsource   /index.html   200
/invoices    /index.html   200
/quotations  /index.html   200
/pickdrop    /index.html   200
/delivery    /index.html   200
/payments    /index.html   200
/warranties  /index.html   200
/reports     /index.html   200
/users       /index.html   200

# Note: Static assets (js, css, images) will be served directly by Netlify
# without any redirects, which fixes the MIME type error
EOF
fi

echo "✅ Build completed! Public folder is ready for deployment."
echo "📁 Public folder contents:"
ls -la public/

echo ""
echo "🚀 Next steps:"
echo "1. Deploy the 'public' folder to Netlify"
echo "2. Or run: netlify deploy --dir=public --prod"
echo "3. The MIME type error should now be resolved!"
