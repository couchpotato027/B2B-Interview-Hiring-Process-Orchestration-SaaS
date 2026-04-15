import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AppRequest } from '../../shared/middlewares/tenantContext.middleware';

const authService = new AuthService();

export const registerTenant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { companyName, adminEmail, adminPassword, firstName, lastName } = req.body;
        const result = await authService.registerTenant(companyName, adminEmail, adminPassword, firstName, lastName);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    try {
        console.log(`[DEBUG] Login attempt for: ${email}`);
        const result = await authService.login(email, password);
        console.log(`[DEBUG] Login SUCCESS for: ${email}`);
        res.status(200).json(result);
    } catch (error: any) {
        console.error(`[DEBUG] Login FAILED for: ${email} - Error: ${error.message}`);
        next(error);
    }
};

export const getMe = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await authService.getMe(req.user!.id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const listUsers = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await authService.listUsers(req.user!.tenantId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const createUser = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await authService.createUser(req.user!.tenantId, req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};
