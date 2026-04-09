# HireFlow API Guide

Welcome to the HireFlow API! This guide provides everything you need to integrate with our AI-powered hiring platform.

## Base URL

- **Production API (V1)**: `http://localhost:3001/api/v1`
- **Clean Architecture API**: `http://localhost:3001/api`
- **Swagger Documentation**: `http://localhost:3001/api-docs`

## Core Requirements

### Multi-Tenancy
Every request must include an organization identifier.
- **Header**: `X-Tenant-Id` (e.g., `org-123`)

### Real-Time Updates (WebSocket)
We use `socket.io` for live updates.
- **URL**: `ws://localhost:3001`
- **Auth**: After connecting, emit `join_tenant` with your `tenantId`.

#### Event Definitions
- `CANDIDATE_ADDED`: A new resume has been processed.
- `EVALUATION_COMPLETED`: An AI evaluation result is ready.
- `RANKINGS_UPDATED`: Candidate rankings for a specific job have changed.

## Key Endpoints

### 1. Resume Processing
Upload a resume to create or update a candidate.
```bash
curl -X POST http://localhost:3001/api/v1/candidates/upload \
  -H "X-Tenant-Id: org-123" \
  -F "resume=@/path/to/resume.pdf"
```

### 2. Candidate Evaluation
Submit a candidate for AI scoring against a specific job.
```bash
curl -X POST http://localhost:3001/api/v1/evaluations \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: org-123" \
  -d '{
    "candidateId": "uuid",
    "jobId": "uuid"
  }'
```

### 3. Job Management
```bash
curl http://localhost:3001/api/v1/jobs?status=open \
  -H "X-Tenant-Id: org-123"
```

## Error Handling
Our API returns standardized error responses:
```json
{
  "success": false,
  "error": {
    "message": "Candidate not found",
    "code": "CANDIDATE_NOT_FOUND"
  }
}
```
