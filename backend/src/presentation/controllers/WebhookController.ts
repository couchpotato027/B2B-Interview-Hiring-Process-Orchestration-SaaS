import { Request, Response } from 'express';
import { logger } from '../../infrastructure/logging/logger';
import { PrismaCandidateRepository } from '../../infrastructure/repositories/PrismaCandidateRepository';
import { Candidate } from '../../domain/entities/Candidate';

const candidateRepository = new PrismaCandidateRepository();

export const handleWebhook = async (req: Request, res: Response) => {
    const provider = req.params.provider; // e.g. 'greenhouse', 'lever'
    const event = req.header('X-Event-Type') || 'unknown';
    const payload = req.body;

    logger.info(`[Webhook] Received ${event} from ${provider}`);

    try {
        switch (provider) {
            case 'greenhouse':
                await handleGreenhouseWebhook(event, payload);
                break;
            case 'lever':
                await handleLeverWebhook(event, payload);
                break;
            default:
                logger.warn(`[Webhook] Unhandled provider: ${provider}`);
        }

        return res.status(200).json({ status: 'PROCESSED' });
    } catch (error: any) {
        logger.error(`[Webhook] Processing failed: ${error.message}`);
        return res.status(500).json({ error: 'PROCESSING_FAILED' });
    }
};

async function handleGreenhouseWebhook(event: string, payload: any) {
    if (event === 'candidate_created') {
        const { candidate } = payload;
        // Logic to insert into HireFlow
        await candidateRepository.save(new Candidate({
            id: `gh_${candidate.id}`,
            name: `${candidate.first_name} ${candidate.last_name}`,
            email: candidate.email_addresses[0]?.value,
            phone: candidate.phone_numbers[0]?.value || '000-000-0000',
            organizationId: 'greenhouse-sync-org',
            pipelineId: 'greenhouse-sync-pipeline',
            resumeId: 'pending-sync',
            skills: [],
            yearsOfExperience: 0,
            education: [{ institution: 'External Import', degree: 'N/A', fieldOfStudy: 'N/A' }],
            projects: [],
            status: 'active'
        }));
    }
}

async function handleLeverWebhook(event: string, payload: any) {
    // Implement Lever logic
}
