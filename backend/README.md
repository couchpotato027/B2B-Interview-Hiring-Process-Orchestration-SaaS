# HireFlow Backend

Production-grade Node.js and TypeScript backend scaffold for the HireFlow hiring pipeline system. The project uses a layered clean architecture so business logic stays isolated from frameworks and infrastructure concerns.

## Project Structure

```text
backend/
├── .env.example
├── .eslintrc.cjs
├── .prettierignore
├── .prettierrc
├── README.md
├── package.json
├── tsconfig.json
└── src/
    ├── application/
    │   └── use-cases/
    │       └── get-health-status.use-case.ts
    ├── domain/
    │   └── entities/
    │       └── health-status.entity.ts
    ├── infrastructure/
    │   ├── config/
    │   │   └── env.ts
    │   └── logging/
    │       └── logger.ts
    ├── presentation/
    │   ├── controllers/
    │   │   └── health.controller.ts
    │   ├── middleware/
    │   │   ├── error-handler.middleware.ts
    │   │   └── not-found.middleware.ts
    │   ├── routes/
    │   │   ├── health.routes.ts
    │   │   └── index.ts
    │   ├── app.ts
    │   └── server.ts
    └── shared/
        ├── errors/
        │   └── app-error.ts
        └── types/
            └── api-error-response.type.ts
```

## How To Run

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables if needed:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

5. Run the compiled server:

```bash
npm start
```

The API starts on `http://localhost:3001` by default and exposes `GET /health`.

## Architecture Layers

### `src/domain/`

Contains the core business model and enterprise rules. This layer should not depend on Express, databases, or external SDKs.

### `src/application/`

Contains use cases that orchestrate domain behavior. Application services coordinate workflows and define what the system does for a request.

### `src/infrastructure/`

Contains adapters for external concerns such as configuration, logging, databases, AI providers, queues, and storage. This layer implements technical details that support the application.

### `src/presentation/`

Contains the HTTP API entrypoints: Express app setup, routes, controllers, and middleware. It translates transport-level requests into application use cases.

### `src/shared/`

Contains cross-cutting utilities, shared types, and reusable error abstractions used by multiple layers.

## Tooling

- TypeScript runs in strict mode.
- Express powers the HTTP server.
- ESLint enforces code quality.
- Prettier handles formatting.
- `dotenv` manages environment configuration.
