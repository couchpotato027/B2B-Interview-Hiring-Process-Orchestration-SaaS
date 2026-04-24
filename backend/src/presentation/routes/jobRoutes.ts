import { Router } from 'express';
import { z } from 'zod';
import { JobController } from '../controllers/JobController';
import { validateRequestBody } from '../middleware/validationMiddleware';

const createJobSchema = z.object({
  title: z.string().trim().min(1),
  department: z.string().trim().min(1),
  description: z.string().trim().min(1),
  requiredSkills: z.array(z.string().trim().min(1)).min(1),
  preferredSkills: z.array(z.string().trim().min(1)).default([]),
  requiredExperience: z.number().min(0),
});

const jobRouter = Router();

/**
 * @openapi
 * /jobs:
 *   post:
 *     tags: [Jobs]
 *     summary: Create a new job posting
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, department, description, requiredSkills, requiredExperience]
 *             properties:
 *               title: { type: string }
 *               department: { type: string }
 *               description: { type: string }
 *               requiredSkills: { type: array, items: { type: string } }
 *               preferredSkills: { type: array, items: { type: string } }
 *               requiredExperience: { type: number }
 *     responses:
 *       201:
 *         description: Job created
 */
jobRouter.post('/', validateRequestBody(createJobSchema), (req, res, next) =>
  new JobController().createJob(req, res, next),
);

/**
 * @openapi
 * /jobs/{id}:
 *   get:
 *     tags: [Jobs]
 *     summary: Get job details by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Job details
 *       404:
 *         description: Job not found
 */
jobRouter.get('/:id', (req, res, next) => new JobController().getJobById(req, res, next));

/**
 * @openapi
 * /jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: List all jobs
 *     responses:
 *       200:
 *         description: List of jobs
 */
jobRouter.get('/', (req, res, next) => new JobController().getJobs(req, res, next));

/**
 * @openapi
 * /jobs/{id}/market-insights:
 *   get:
 *     tags: [Jobs]
 *     summary: Generate job market insights
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Market insights data
 */
jobRouter.get('/:id/market-insights', (req, res, next) => new JobController().getMarketInsights(req, res, next));

/**
 * @openapi
 * /jobs/{id}/comparative-analysis:
 *   get:
 *     tags: [Jobs]
 *     summary: Generate comparative analysis for multiple candidates
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *       - name: candidateIds
 *         in: query
 *         required: true
 *         schema: { type: string }
 *         description: Comma-separated candidate IDs
 *     responses:
 *       200:
 *         description: Comparative analysis data
 */
jobRouter.get('/:id/comparative-analysis', (req, res, next) => new JobController().getComparativeAnalysis(req, res, next));

/**
 * @openapi
 * /jobs/{id}/configure-scoring:
 *   post:
 *     tags: [Jobs]
 *     summary: Update job scoring weights
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               weights:
 *                 type: object
 *     responses:
 *       200:
 *         description: Weights updated successfully
 */
jobRouter.post('/:id/configure-scoring', (req, res, next) => new JobController().configureScoring(req, res, next));

export { jobRouter };
