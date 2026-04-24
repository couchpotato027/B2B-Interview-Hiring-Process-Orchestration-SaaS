import axios from 'axios';
import { logger } from '../logging/logger';

export interface GreenhouseCandidate {
    id: number;
    first_name: string;
    last_name: string;
    email_addresses: Array<{ value: string; type: string }>;
    phone_numbers: Array<{ value: string; type: string }>;
}

export class IntegrationService {
    /**
     * Poll Greenhouse API for new candidates
     */
    async syncGreenhouseCandidates(apiKey: string, onCandidateFound: (c: GreenhouseCandidate) => Promise<void>) {
        try {
            const response = await axios.get('https://harvest.greenhouse.io/v1/candidates', {
                headers: {
                    'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
                }
            });

            const candidates = response.data as GreenhouseCandidate[];
            for (const candidate of candidates) {
                await onCandidateFound(candidate);
            }
            
            logger.info(`[Greenhouse] Synchronized ${candidates.length} candidates`);
        } catch (error: any) {
            logger.error(`[Greenhouse] Sync failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Push evaluation data back to Greenhouse
     */
    async pushEvaluationToGreenhouse(apiKey: string, candidateId: string, evaluation: any) {
        try {
            await axios.post(`https://harvest.greenhouse.io/v1/candidates/${candidateId}/notes`, {
                body: `HireFlow Evaluation: ${evaluation.score}/100. ${evaluation.summary}`
            }, {
                headers: {
                    'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
                }
            });
            logger.info(`[Greenhouse] Pushed evaluation for candidate ${candidateId}`);
        } catch (error: any) {
            logger.error(`[Greenhouse] Push failed: ${error.message}`);
        }
    }
}
