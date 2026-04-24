import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/prisma.client';

export const apiKeyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.header('X-API-Key');

    if (!apiKey) {
        return res.status(401).json({ error: 'Missing X-API-Key header' });
    }

    try {
        // In a real system, we'd have an ApiKey table
        // For this demo, we'll check against a reserved organization field
        const organization = await (prisma as any).tenant.findFirst({
            where: { id: apiKey } // Simplified: using tenant ID as API key for demo
        });

        if (!organization) {
            return res.status(403).json({ error: 'Invalid API Key' });
        }

        // Attach organization to request
        (req as any).organization = organization;
        next();
    } catch (error) {
        return res.status(500).json({ error: 'Internal security check failure' });
    }
};
