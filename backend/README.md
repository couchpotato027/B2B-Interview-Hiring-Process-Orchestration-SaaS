HireFlow - AI-Powered Hiring Pipeline System

Project Overview

HireFlow is a production-grade, AI-assisted hiring pipeline system designed to streamline recruitment workflows through automation and intelligent decision-making.

It leverages AI-powered resume parsing, candidate evaluation, and ranking while following Clean Architecture principles and modern full-stack practices. This project demonstrates strong software design fundamentals, scalability, and real-world system thinking.

Key Features
Core Functionality
Intelligent Resume Parsing
Extracts structured data from PDF, DOCX, and TXT resumes.
AI-Powered Evaluation
Uses LLM APIs (Gemini/Claude) for candidate-job fit analysis.
Multi-Stage Pipeline
Kanban board for visual candidate progression tracking.
Smart Scoring System
Strategy-based scoring for dynamic candidate ranking.
Analytics Dashboard
Real-time hiring insights and performance metrics.
Multi-Tenant Architecture
Secure organization-level data isolation.
Role-Based Access Control
Admin, Recruiter, Hiring Manager, Interviewer roles.
Technical Highlights
Clean Architecture with strict layer separation
6 Design Patterns implemented
RESTful APIs with structured error handling
Real-time updates using WebSockets
Fully responsive UI (desktop and mobile)
Dark mode support
System Architecture
Layered Architecture
┌─────────────────────────────────────────────────────────┐
│                 Presentation Layer                       │
│              (Express API + Next.js UI)                  │
├─────────────────────────────────────────────────────────┤
│                 Application Layer                        │
│          (Use Cases + Business Logic)                    │
├─────────────────────────────────────────────────────────┤
│                   Domain Layer                           │
│        (Entities + Interfaces + Value Objects)           │
├─────────────────────────────────────────────────────────┤
│               Infrastructure Layer                       │
│    (Prisma ORM + AI Services + File Storage)            │
└─────────────────────────────────────────────────────────┘
Architecture Highlights
Dependency Rule enforced (inner layers independent)
Framework-independent business logic
Highly testable and maintainable structure
Tech Stack
Backend
Node.js + TypeScript
Express.js
Prisma ORM
PostgreSQL
Redis and Bull (queues)
JWT Authentication
Frontend
Next.js 14
Tailwind CSS
Recharts
React DnD Kit
AI / ML
Google Gemini API
NLP-based skill extraction
DevOps
Docker
Supabase (optional backend)
Vercel (frontend hosting)
Design Patterns Implemented
Repository Pattern

Abstracts data access layer.

interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  update(id: string, entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}
Strategy Pattern

Flexible candidate scoring system.

interface IScoringStrategy {
  calculate(candidate: Candidate, job: Job): Promise<number>;
  getName(): string;
  getWeight(): number;
}
Factory Pattern

Dynamic parser selection.

class ResumeParserFactory {
  getParser(fileName: string): IResumeParser {
    if (fileName.endsWith('.pdf')) return new PDFResumeParser();
    if (fileName.endsWith('.docx')) return new DOCXResumeParser();
    if (fileName.endsWith('.txt')) return new TXTResumeParser();
    throw new Error('Unsupported file type');
  }
}
Observer Pattern

Event-driven updates:

CandidateCreated
EvaluationCompleted
StageChanged
Singleton Pattern

Used for:

DI Container
Config Manager
Event Emitter
Dependency Injection

Constructor-based DI for loose coupling and testability.

Getting Started
Prerequisites
Node.js 20+
PostgreSQL 15+
Redis 7+
Installation
git clone https://github.com/yourusername/hireflow.git
cd hireflow
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
Environment Setup

Create a .env file in the backend directory:

# Application Configuration
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/hireflow?schema=public"

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="1d"

# CORS
CORS_ORIGIN="http://localhost:3000"

# AI Configuration
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-1.5-flash"

Update these values according to your local setup before running the application.

Database Setup
npx prisma migrate dev
npm run db:seed
Run Application
# Backend
npm run dev

# Frontend
cd ../frontend
npm run dev
Access
Frontend: http://localhost:3000
Backend: http://localhost:3001
API Docs: http://localhost:3001/api-docs
Screenshots
Dashboard – Real-time analytics
Kanban Board – Candidate pipeline
Candidate Directory – Search and filtering
AI Evaluation – Scoring insights
Reports – Hiring metrics
Testing
npm run test
npm run test:integration
npm run test:coverage
API Documentation

API documentation is available at /api-docs when the server is running.

Key Endpoints
POST /api/v1/candidates/upload
GET /api/v1/candidates
POST /api/v1/evaluations
GET /api/v1/pipelines/:id/board
GET /api/v1/analytics/dashboard
Software Design Principles Demonstrated
SOLID Principles
Single Responsibility
Open/Closed
Liskov Substitution
Interface Segregation
Dependency Inversion
Clean Architecture
Dependency rule enforced
Framework-independent business logic
High testability
UI independence
Additional Principles
DRY (Don't Repeat Yourself)
KISS (Keep It Simple)
YAGNI (You Aren't Gonna Need It)
Separation of Concerns
High Cohesion and Loose Coupling
Project Achievements
10+ database tables with relationships
20+ API endpoints
6 design patterns implemented
Clean Architecture with 4 layers
AI integration with structured outputs
Multi-tenant system
Role-based access control
Real-time updates using WebSocket
Responsive UI
80%+ test coverage
License

This project is created for academic purposes as part of a Software Design course.

Acknowledgments
Course Instructor
Newton School
Google Gemini APIgit 