#!/bin/bash

# 1. Initialize and commit
git init
git add .
git commit -m "Initial commit: berrys.ai website"

# 2. Create GitHub repo (replace YOUR_USERNAME)
# Do this manually on github.com or use:
# gh repo create berrys-website --public

# 3. Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/berrys-website.git
git branch -M main
git push -u origin main

# 4. Deploy via Vercel (after connecting on vercel.com)
echo "✅ Repository pushed to GitHub"
echo "🚀 Now go to vercel.com to import and deploy"
echo "📱 Your site will be live at: https://berrys-website.vercel.app"
