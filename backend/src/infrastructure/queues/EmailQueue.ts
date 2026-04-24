import Queue from 'bull';
import { emailService, EmailOptions } from '../services/EmailService';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const emailQueue = new Queue('email-notifications', REDIS_URL);

emailQueue.process(async (job) => {
  const { options } = job.data as { options: EmailOptions };
  
  try {
    await emailService.sendEmail(options);
    return { success: true };
  } catch (error: any) {
    // Bull will automatically retry if we throw an error
    throw new Error(`Email failed: ${error.message}`);
  }
});

// Configure default retry strategy
export const addEmailToQueue = (options: EmailOptions) => {
  return emailQueue.add(
    { options },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
    }
  );
};
