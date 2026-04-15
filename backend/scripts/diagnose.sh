#!/bin/bash
echo "=== HireFlow System Diagnosis ==="
echo ""
echo "1. Checking Node version..."
node --version

echo "2. Checking npm scripts..."
npm run 2>&1 | head -20

echo "3. Checking .env file..."
[ -f .env ] && echo "✅ .env exists" || echo "❌ .env missing"

echo "4. Checking database connection..."
docker ps | grep postgres

echo "5. Checking Redis..."
docker ps | grep redis

echo "6. Checking Prisma client..."
[ -d node_modules/@prisma/client ] && echo "✅ Prisma client installed" || echo "❌ Prisma client missing"

echo "7. Listing main source files..."
ls -la src/*.ts 2>/dev/null
ls -la src/server.ts src/index.ts src/app.ts 2>/dev/null

echo "8. Checking TypeScript compilation..."
npx tsc --noEmit 2>&1 | head -10

echo "Diagnosis complete."
