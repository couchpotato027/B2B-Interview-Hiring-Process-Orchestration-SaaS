import { Request, Response } from 'express';
import { AIService } from '../../infrastructure/services/AIService';
import { logger } from '../../infrastructure/logging/logger';
import { PrismaClient } from '@prisma/client';

const aiService = new AIService(process.env.GEMINI_API_KEY || '');
const prisma = new PrismaClient();

export const parseResume = async (req: Request, res: Response) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Missing resume text' });

        const parsed = await aiService.parseResume(text);
        return res.json(parsed);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const matchJob = async (req: Request, res: Response) => {
    try {
        const { resume, jobId } = req.body;
        if (!resume || !jobId) return res.status(400).json({ error: 'Missing required data' });

        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        // Build a job requirement string from available fields
        const jobRequirement = `
            Job Title: ${job.title}
            Department: ${job.department}
            Required Skills: ${job.requiredSkills.join(', ')}
            Preferred Skills: ${job.preferredSkills.join(', ')}
            Required Experience: ${job.requiredExperience} years
        `;

        const result = await aiService.matchCandidateToJob(resume, jobRequirement);
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const detectDuplicates = async (req: Request, res: Response) => {
    try {
        const { email, name } = req.body;
        const organizationId = (req as any).user.organizationId || (req as any).user.tenantId;

        const exactMatch = await prisma.candidate.findFirst({
            where: { email, tenantId: organizationId }
        });

        if (exactMatch) {
            return res.json({ 
                duplicate: true, 
                type: 'EXACT_EMAIL', 
                candidate: exactMatch 
            });
        }

        const [firstName, lastName] = name.split(' ');
        const similarName = await prisma.candidate.findFirst({
            where: {
                tenantId: organizationId,
                OR: [
                    { firstName: { contains: firstName || '', mode: 'insensitive' } },
                    { lastName: { contains: lastName || '', mode: 'insensitive' } }
                ]
            }
        });

        if (similarName) {
            return res.json({ 
                duplicate: true, 
                type: 'SIMILAR_NAME', 
                candidate: similarName 
            });
        }

        return res.json({ duplicate: false });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
