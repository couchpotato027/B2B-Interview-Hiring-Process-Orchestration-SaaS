#!/bin/bash
echo "🔧 Fixing HireFlow Backend..."

# 1. Clean build
echo "1. Cleaning old builds..."
rm -rf dist/

# 2. Install dependencies
echo "2. Installing dependencies..."
# Use --no-audit to speed up
npm install --no-audit

# 3. Generate Prisma client
echo "3. Generating Prisma client..."
npx prisma generate

# 4. Push database schema
echo "4. Pushing database schema..."
# Attempt to use local environment from .env
npx prisma db push --accept-data-loss

# 5. Seed database
echo "5. Seeding database..."
npm run db:seed

# 6. Build TypeScript
echo "6. Building TypeScript..."
npm run build

echo ""
echo "✅ All fixes applied!"
echo "Run: npm run dev"
