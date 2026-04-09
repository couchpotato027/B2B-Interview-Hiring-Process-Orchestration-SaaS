import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../../infrastructure/config/env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HireFlow API Documentation',
      version: '1.0.0',
      description: 'Production-grade API for HireFlow AI-powered recruitment platform.',
      contact: {
        name: 'HireFlow Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.port}/api/v1`,
        description: 'V1 API (Module-based)',
      },
      {
        url: `http://localhost:${env.port}/api`,
        description: 'Clean-Arch API (Pipeline)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
                details: { type: 'object', nullable: true },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.ts', './src/presentation/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
