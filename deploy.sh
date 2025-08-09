#!/bin/bash

# Repair Shop Inventory System - Deployment Script
# This script helps you deploy your application to various platforms

echo "🚀 Repair Shop Inventory System - Deployment Helper"
echo "=================================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Initializing..."
    git init
    git add .
    git commit -m "Initial commit"
    echo "✅ Git repository initialized"
fi

# Check if files are committed
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Uncommitted changes detected. Committing..."
    git add .
    git commit -m "Update before deployment"
    echo "✅ Changes committed"
fi

echo ""
echo "📋 Available Deployment Options:"
echo "1. Netlify (Recommended - Free)"
echo "2. Vercel (Free)"
echo "3. Firebase Hosting (Free)"
echo "4. GitHub Pages (Free)"
echo "5. Manual deployment"
echo ""

read -p "Choose your deployment option (1-5): " choice

case $choice in
    1)
        echo "🌐 Deploying to Netlify..."
        echo "1. Go to https://netlify.com"
        echo "2. Sign up/Login"
        echo "3. Click 'New site from Git'"
        echo "4. Connect your GitHub repository"
        echo "5. Deploy settings:"
        echo "   - Build command: (leave empty)"
        echo "   - Publish directory: ."
        echo "6. Your site will be live at https://your-site-name.netlify.app"
        ;;
    2)
        echo "⚡ Deploying to Vercel..."
        echo "1. Go to https://vercel.com"
        echo "2. Sign up/Login"
        echo "3. Click 'New Project'"
        echo "4. Import your GitHub repository"
        echo "5. Deploy settings will be auto-detected"
        echo "6. Your site will be live at https://your-project-name.vercel.app"
        ;;
    3)
        echo "🔥 Deploying to Firebase Hosting..."
        echo "Installing Firebase CLI..."
        npm install -g firebase-tools
        echo "Logging into Firebase..."
        firebase login
        echo "Initializing Firebase project..."
        firebase init hosting
        echo "Deploying to Firebase..."
        firebase deploy
        ;;
    4)
        echo "📚 Deploying to GitHub Pages..."
        echo "1. Go to your GitHub repository"
        echo "2. Settings → Pages"
        echo "3. Source: Deploy from a branch"
        echo "4. Branch: main"
        echo "5. Your site will be live at https://username.github.io/repository-name"
        ;;
    5)
        echo "📁 Manual Deployment Instructions:"
        echo "1. Upload all files to your web server"
        echo "2. Ensure index.html is in the root directory"
        echo "3. Configure your web server to serve static files"
        echo "4. Set up SSL certificate"
        echo "5. Configure domain DNS settings"
        ;;
    *)
        echo "❌ Invalid option. Please choose 1-5."
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment instructions provided!"
echo ""
echo "🌐 Next Steps:"
echo "1. Follow the deployment instructions above"
echo "2. Test your deployed application"
echo "3. Purchase a domain (optional)"
echo "4. Configure custom domain (optional)"
echo "5. Set up monitoring and analytics"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
echo "🆘 Need help? Check the troubleshooting section in DEPLOYMENT.md"



