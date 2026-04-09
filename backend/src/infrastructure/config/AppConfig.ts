import dotenv from 'dotenv';

dotenv.config();

export interface AppConfigValues {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  corsOrigin: string;
  logLevel: string;
  geminiApiKey: string;
  geminiModel: string;
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
      };
    }

    return AppConfig.instance;
  }

  public static validate(config: AppConfigValues): void {
    const validNodeEnvironments = new Set(['development', 'test', 'production']);

    if (!validNodeEnvironments.has(config.nodeEnv)) {
      throw new Error(`Invalid NODE_ENV value: ${config.nodeEnv}`);
    }

    if (config.nodeEnv === 'production' && !config.geminiApiKey.trim()) {
      throw new Error('GEMINI_API_KEY is required in production.');
    }
  }
}
