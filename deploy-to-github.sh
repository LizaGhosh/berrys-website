#!/bin/bash

# Add GitHub remote with your username
git remote add origin https://github.com/LizaGhosh/berrys-website.git

# Push to GitHub
git branch -M main
git push -u origin main

echo "✅ Code pushed to: https://github.com/LizaGhosh/berrys-website"
echo "🚀 Ready for Vercel deployment!"
