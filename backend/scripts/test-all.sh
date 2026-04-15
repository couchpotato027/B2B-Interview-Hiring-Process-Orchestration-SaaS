#!/bin/bash
BASE="http://localhost:3001"

echo "=== 🧪 Testing HireFlow Endpoints ==="

echo "1. Health Check..."
curl -s $BASE/api/health
echo -e "\n"

echo "2. Candidates (v1)..."
curl -s $BASE/api/v1/candidates | head -c 100
echo -e "...(truncated)\n"

echo "3. Jobs (v1)..."
curl -s $BASE/api/v1/jobs | head -c 100
echo -e "...(truncated)\n"

echo "4. Pipelines (v1)..."
curl -s $BASE/api/v1/pipelines | head -c 100
echo -e "...(truncated)\n"

echo "5. Dashboard Stats (v1)..."
curl -s $BASE/api/v1/dashboard/stats
echo -e "\n"

echo "6. Debug Routes..."
curl -s $BASE/api/debug/routes | head -c 200
echo -e "...(truncated)\n"

echo "All basic connectivity tests complete!"
