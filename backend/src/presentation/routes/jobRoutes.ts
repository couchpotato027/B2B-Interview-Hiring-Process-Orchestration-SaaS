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

jobRouter.post('/', validateRequestBody(createJobSchema), (req, res, next) =>
  new JobController().createJob(req, res, next),
);
jobRouter.get('/:id', (req, res, next) => new JobController().getJobById(req, res, next));
jobRouter.get('/', (req, res, next) => new JobController().getJobs(req, res, next));

export { jobRouter };
