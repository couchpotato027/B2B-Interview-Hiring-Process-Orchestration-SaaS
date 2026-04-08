jest.mock('../../../src/modules/auth/auth.routes', () => {
  const express = require('express');
  return {
    __esModule: true,
    default: express.Router(),
  };
});

import request from 'supertest';
import { createServer } from '../../../src/presentation/server';
import { Container } from '../../../src/infrastructure/di/Container';
import type { ICandidateRepository } from '../../../src/domain/repositories/ICandidateRepository';
import { setupTestContainer } from '../../helpers/TestContainer';
import { TestDataBuilder } from '../../helpers/TestDataBuilder';

describe('Candidate API', () => {
  beforeEach(() => {
    setupTestContainer();
  });

  it('POST /api/candidates/upload uploads and processes a resume', async () => {
    const app = createServer();

    const response = await request(app)
      .post('/api/candidates/upload')
      .attach('resume', Buffer.from('Jane Doe\njane.doe@example.com\nTypeScript'), {
        filename: 'resume.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.candidate).toBeDefined();
    expect(response.body.data.resume).toBeDefined();
  });

  it('POST /api/candidates/upload rejects an invalid file type', async () => {
    const app = createServer();

    const response = await request(app)
      .post('/api/candidates/upload')
      .attach('resume', Buffer.from('bad file'), {
        filename: 'resume.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('GET /api/candidates/:id returns candidate details when found', async () => {
    const app = createServer();
    const container = Container.getInstance();
    const candidateRepository = container.resolve<ICandidateRepository>('CandidateRepository');
    const candidate = await candidateRepository.save(TestDataBuilder.candidate());

    const response = await request(app).get(`/api/candidates/${candidate.getId()}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.candidate).toBeDefined();
  });

  it('GET /api/candidates/:id returns 404 when missing', async () => {
    const app = createServer();

    const response = await request(app).get('/api/candidates/missing-id');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('CANDIDATE_NOT_FOUND');
  });
});
