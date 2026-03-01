import { prisma } from '../../infrastructure/database/prisma.client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export class AuthService {
    async registerTenant(companyName: string, adminEmail: string, adminPassword: string) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        return await prisma.$transaction(async (tx) => {
            // 1. Create Tenant
            const tenant = await tx.tenant.create({
                data: { name: companyName },
            });

            // 2. Create Roles
            const adminRole = await tx.role.create({
                data: { tenantId: tenant.id, name: 'ADMIN' },
            });

            await tx.role.createMany({
                data: [
                    { tenantId: tenant.id, name: 'RECRUITER' },
                    { tenantId: tenant.id, name: 'INTERVIEWER' },
                ],
            });

            // 3. Create Admin User
            const adminUser = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    roleId: adminRole.id,
                    email: adminEmail,
                    passwordHash: hashedPassword,
                },
            });

            return { tenant, adminUser };
        });
    }

    async login(email: string, password: string) {
        const user = await prisma.user.findFirst({
            where: { email },
            include: { role: true },
        });

        if (!user) throw { statusCode: 401, message: 'Invalid credentials' };

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) throw { statusCode: 401, message: 'Invalid credentials' };

        const payload = {
            id: user.id,
            tenantId: user.tenantId,
            role: user.role.name,
            email: user.email,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN as any });
        return { token, user: payload };
    }
}
