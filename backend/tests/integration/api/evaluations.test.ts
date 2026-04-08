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
import type { IJobRepository } from '../../../src/domain/repositories/IJobRepository';
import type { IEvaluationRepository } from '../../../src/domain/repositories/IEvaluationRepository';
import { setupTestContainer } from '../../helpers/TestContainer';
import { TestDataBuilder } from '../../helpers/TestDataBuilder';

describe('Evaluation API', () => {
  beforeEach(() => {
    setupTestContainer();
  });

  it('POST /api/evaluations creates an evaluation', async () => {
    const app = createServer();
    const container = Container.getInstance();
    const candidateRepository = container.resolve<ICandidateRepository>('CandidateRepository');
    const jobRepository = container.resolve<IJobRepository>('JobRepository');
    const candidate = await candidateRepository.save(TestDataBuilder.candidate());
    const job = await jobRepository.save(TestDataBuilder.job());

    const response = await request(app).post('/api/evaluations').send({
      candidateId: candidate.getId(),
      jobId: job.getId(),
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.overallScore ?? response.body.data).toBeDefined();
  });

  it('GET /api/evaluations/job/:jobId/rankings returns rankings', async () => {
    const app = createServer();
    const container = Container.getInstance();
    const candidateRepository = container.resolve<ICandidateRepository>('CandidateRepository');
    const jobRepository = container.resolve<IJobRepository>('JobRepository');
    const evaluationRepository = container.resolve<IEvaluationRepository>('EvaluationRepository');
    const job = await jobRepository.save(TestDataBuilder.job());
    const candidate = await candidateRepository.save(TestDataBuilder.candidate());
    await evaluationRepository.save(
      TestDataBuilder.evaluation({
        candidateId: candidate.getId(),
        jobId: job.getId(),
      }),
    );

    const response = await request(app).get(`/api/evaluations/job/${job.getId()}/rankings`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data[0].rank).toBe(1);
  });
});
