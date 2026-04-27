import dotenv from 'dotenv';

dotenv.config();

export interface AppConfigValues {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  corsOrigin: string;
  logLevel: string;
  geminiApiKey: string;
  geminiModel: string;
  groqApiKey: string;
  groqModel: string;
  jwtSecret: string;
  // Storage
  storageProvider: 'local' | 's3';
  uploadDir: string;
  baseUrl: string;
  s3Bucket: string;
  s3Region: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
}

const parsePositiveInteger = (value: string | undefined, fallback: number, key: string): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${key} value: ${value}`);
  }

  return parsed;
};

export class AppConfig {
  private static instance: AppConfigValues | null = null;

  public static load(): AppConfigValues {
    if (!AppConfig.instance) {
      const nodeEnv = (process.env.NODE_ENV ?? 'development') as AppConfigValues['nodeEnv'];

      AppConfig.instance = {
        port: parsePositiveInteger(process.env.PORT, 3001, 'PORT'),
        nodeEnv,
        corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
        logLevel: process.env.LOG_LEVEL ?? 'info',
        geminiApiKey: process.env.GEMINI_API_KEY ?? '',
        geminiModel: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash',
        groqApiKey: process.env.GROQ_API_KEY ?? '',
        groqModel: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
        jwtSecret: process.env.JWT_SECRET ?? 'hireflow_development_secret_key_2024_!@#',
        // Storage
        storageProvider: (process.env.STORAGE_PROVIDER ?? 'local') as 'local' | 's3',
        uploadDir: process.env.UPLOAD_DIR ?? (nodeEnv === 'production' ? '/tmp/uploads' : 'uploads'),
        baseUrl: process.env.API_BASE_URL ?? 'http://localhost:3001',
        s3Bucket: process.env.S3_BUCKET ?? '',
        s3Region: process.env.S3_REGION ?? 'us-east-1',
        s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
        s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      };
    }

    return AppConfig.instance;
  }

  public static validate(config: AppConfigValues): void {
    const validNodeEnvironments = new Set(['development', 'test', 'production']);

    if (!validNodeEnvironments.has(config.nodeEnv)) {
      throw new Error(`Invalid NODE_ENV value: ${config.nodeEnv}`);
    }

    if (config.storageProvider === 's3' && !config.s3Bucket) {
      throw new Error('S3_BUCKET is required when using s3 storage provider.');
    }

    if (config.nodeEnv === 'production') {
      if (!config.geminiApiKey.trim() && !config.groqApiKey.trim()) {
        throw new Error('Either GEMINI_API_KEY or GROQ_API_KEY is required in production.');
      }
      if (config.jwtSecret === 'hireflow_development_secret_key_2024_!@#' || !config.jwtSecret.trim()) {
        throw new Error('A secure JWT_SECRET is required in production.');
      }
    }
  }
}
