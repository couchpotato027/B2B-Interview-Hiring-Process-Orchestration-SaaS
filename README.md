HireFlow - AI-Powered Hiring Pipeline System

1. Introduction

HireFlow is a production-grade, AI-assisted hiring pipeline system designed to streamline recruitment workflows through automation and intelligent decision-making.

It integrates AI-driven resume parsing, candidate evaluation, and ranking while following Clean Architecture principles and modern full-stack practices.

2. Key Features
2.1 Core Functionality
Intelligent Resume Parsing
Extracts structured data from PDF, DOCX, and TXT resumes
AI-Powered Evaluation
Uses LLM APIs (Gemini/Claude) for candidate-job fit analysis
Multi-Stage Pipeline
Kanban board for visual candidate progression tracking
Smart Scoring System
Strategy-based dynamic candidate ranking
Analytics Dashboard
Real-time hiring insights and metrics
Multi-Tenant Architecture
Secure organization-level data isolation
Role-Based Access Control
Admin, Recruiter, Hiring Manager, Interviewer roles
2.2 Technical Highlights
Clean Architecture with strict separation of concerns
Implementation of 6 design patterns
RESTful APIs with structured error handling
Real-time updates using WebSockets
Fully responsive UI (desktop and mobile)
Dark mode support
3. System Architecture
3.1 Layered Architecture
┌───────────────────────────────────────────────┐
│ Presentation Layer                           │
│ (Express API + Next.js UI)                   │
├───────────────────────────────────────────────┤
│ Application Layer                            │
│ (Use Cases + Business Logic)                 │
├───────────────────────────────────────────────┤
│ Domain Layer                                 │
│ (Entities + Interfaces + Value Objects)      │
├───────────────────────────────────────────────┤
│ Infrastructure Layer                         │
│ (Prisma ORM + AI Services + File Storage)    │
└───────────────────────────────────────────────┘
3.2 Architecture Principles
Dependency Rule enforced (inner layers independent)
Framework-independent business logic
High testability and maintainability
Loose coupling and high cohesion
4. Tech Stack
4.1 Backend
Node.js + TypeScript
Express.js
Prisma ORM
PostgreSQL
Redis and Bull (queues)
JWT Authentication
4.2 Frontend
Next.js 14
Tailwind CSS
Recharts
React DnD Kit
4.3 AI / ML
Google Gemini API
NLP-based skill extraction
4.4 DevOps
Docker
Supabase (optional backend)
Vercel (frontend hosting)
5. Design Patterns Implemented
5.1 Repository Pattern
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  update(id: string, entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}
5.2 Strategy Pattern
interface IScoringStrategy {
  calculate(candidate: Candidate, job: Job): Promise<number>;
  getName(): string;
  getWeight(): number;
}
5.3 Factory Pattern
class ResumeParserFactory {
  getParser(fileName: string): IResumeParser {
    if (fileName.endsWith('.pdf')) return new PDFResumeParser();
    if (fileName.endsWith('.docx')) return new DOCXResumeParser();
    if (fileName.endsWith('.txt')) return new TXTResumeParser();
    throw new Error('Unsupported file type');
  }
}
5.4 Observer Pattern

Event-driven updates:

CandidateCreated
EvaluationCompleted
StageChanged
5.5 Singleton Pattern

Used for:

DI Container
Config Manager
Event Emitter
5.6 Dependency Injection

Constructor-based dependency injection for loose coupling and testability.

6. Getting Started
6.1 Prerequisites
Node.js 20+
PostgreSQL 15+
Redis 7+
6.2 Installation
git clone https://github.com/couchpotato027/B2B-Interview-Hiring-Process-Orchestration-SaaS.git
cd B2B-Interview-Hiring-Process-Orchestration-SaaS
cd backend
npm install

cd ../frontend
npm install
6.3 Environment Configuration

Create a .env file in the backend directory:

NODE_ENV=development
PORT=3001
LOG_LEVEL=info

DATABASE_URL="postgresql://username:password@localhost:5432/hireflow?schema=public"
REDIS_URL="redis://localhost:6379"

JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1d"

CORS_ORIGIN="http://localhost:3000"

GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-1.5-flash"
6.4 Database Setup
npx prisma migrate dev
npm run db:seed
6.5 Run Application
# Backend
npm run dev

# Frontend
cd ../frontend
npm run dev
6.6 Access
Frontend: http://localhost:3000
Backend: http://localhost:3001
API Docs: http://localhost:3001/api-docs
7. API Documentation

Available at /api-docs

Key Endpoints
POST /api/v1/candidates/upload
GET /api/v1/candidates
POST /api/v1/evaluations
GET /api/v1/pipelines/:id/board
GET /api/v1/analytics/dashboard
8. Testing
npm run test
npm run test:integration
npm run test:coverage
9. Software Design Principles
SOLID Principles
Single Responsibility
Open/Closed
Liskov Substitution
Interface Segregation
Dependency Inversion
Clean Architecture
Independent business logic
Framework decoupling
High testability
UI independence
Additional Principles
DRY
KISS
YAGNI
Separation of Concerns
High Cohesion and Loose Coupling
10. Project Achievements
10+ database tables with relationships
20+ API endpoints
6 design patterns implemented
Clean Architecture with 4 layers
AI integration
Multi-tenant system
Role-based access control
Real-time updates
Responsive UI
80%+ test coverage
11. License

This project is created for academic purposes as part of a Software Design course.

12. Acknowledgments
Course Instructor
Newton School
Google Gemini API
