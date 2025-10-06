#!/bin/bash

# FlowMail Production Deployment Script
# This script helps you deploy FlowMail to production

echo "🚀 FlowMail Production Deployment Script"
echo "========================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if all required files exist
echo "📋 Checking required files..."

required_files=(
    "package.json"
    "next.config.ts"
    "vercel.json"
    "env.example"
    "update-pricing-plans-safe.sql"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
done

echo "✅ All required files found"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cp env.example .env.local
    echo "📝 Please update .env.local with your development values"
fi

# Check if .gitignore includes environment files
if ! grep -q ".env" .gitignore; then
    echo "⚠️  Adding .env files to .gitignore..."
    echo "" >> .gitignore
    echo "# Environment files" >> .gitignore
    echo ".env" >> .gitignore
    echo ".env.local" >> .gitignore
    echo ".env.production" >> .gitignore
fi

echo ""
echo "🎯 Next Steps for Production Deployment:"
echo "========================================"
echo ""
echo "1. 📦 Push to GitHub:"
echo "   git add ."
echo "   git commit -m 'Production ready'"
echo "   git push origin main"
echo ""
echo "2. 🚀 Deploy to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Import your GitHub repository"
echo "   - Configure environment variables"
echo "   - Deploy!"
echo ""
echo "3. 🗄️  Set up Supabase Production:"
echo "   - Create new Supabase project"
echo "   - Run update-pricing-plans-safe.sql"
echo "   - Configure RLS policies"
echo ""
echo "4. 🔐 Configure Whop Production:"
echo "   - Create production Whop app"
echo "   - Set redirect URLs"
echo "   - Configure webhooks"
echo "   - Create pricing plans"
echo ""
echo "5. 📧 Set up Resend:"
echo "   - Create Resend account"
echo "   - Verify domain"
echo "   - Get API key"
echo ""
echo "📖 For detailed instructions, see:"
echo "   - PRODUCTION-DEPLOYMENT-GUIDE.md"
echo "   - DEPLOYMENT-CHECKLIST.md"
echo ""
echo "🎉 Ready for production deployment!"
