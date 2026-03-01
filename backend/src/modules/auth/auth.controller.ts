import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export const registerTenant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { companyName, adminEmail, adminPassword } = req.body;
        const result = await authService.registerTenant(companyName, adminEmail, adminPassword);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
