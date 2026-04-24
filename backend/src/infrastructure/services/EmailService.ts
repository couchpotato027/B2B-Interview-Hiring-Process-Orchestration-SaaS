import nodemailer from 'nodemailer';
import { prisma } from '../database/prisma.client';

export interface EmailOptions {
  tenantId: string;
  candidateId?: string;
  userId?: string;
  to: string;
  subject: string;
  body: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.resend.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'resend',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<string> {
    const log = await prisma.emailLog.create({
      data: {
        tenantId: options.tenantId,
        candidateId: options.candidateId,
        userId: options.userId,
        to: options.to,
        subject: options.subject,
        body: options.body,
        status: 'PENDING',
      },
    });

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"HireFlow" <no-reply@hireflow.com>',
        to: options.to,
        subject: options.subject,
        html: options.body,
        // Pixel tracking could be added here by appending a 1x1 image to the body
        // with the log ID.
      });

      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      return log.id;
    } catch (error: any) {
      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });
      throw error;
    }
  }

  async getHistory(candidateId: string, tenantId: string) {
    return prisma.emailLog.findMany({
      where: { candidateId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const emailService = new EmailService();
