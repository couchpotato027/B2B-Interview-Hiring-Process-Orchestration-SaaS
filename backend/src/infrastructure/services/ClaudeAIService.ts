import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import type { Candidate } from '../../domain/entities/Candidate';
import type { Job } from '../../domain/entities/Job';
import type { IAIService } from '../../domain/services/IAIService';
import type {
  CandidateInsights,
  FitEvaluation,
  Project,
  ProjectAnalysis,
} from '../../domain/types/AITypes';
import type { ScoreBreakdown } from '../../domain/types/ScoringTypes';
import { env } from '../config/env';
import { logger } from '../logging/logger';
import { AIServiceError } from '../../shared/errors/AIServiceError';

type JsonObject = Record<string, unknown>;

const MODEL = 'claude-sonnet-4-20250514';
const JSON_ONLY_SYSTEM_PROMPT = [
  'You are a backend AI service for HireFlow.',
  'You must respond with valid JSON only.',
  'Do not include markdown fences, explanations, or any text outside the JSON response.',
  'If you are unsure, still return the closest valid JSON for the requested schema.',
].join(' ');

export class ClaudeAIService implements IAIService {
  private readonly client: Anthropic;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(
    apiKey: string = env.anthropicApiKey,
    timeoutMs: number = env.anthropicTimeoutMs,
    maxRetries: number = env.anthropicMaxRetries,
  ) {
    if (!apiKey) {
      throw new AIServiceError(
        'Anthropic API key is not configured. Set ANTHROPIC_API_KEY to enable Claude integration.',
        'AI_MISSING_API_KEY',
      );
    }

    this.client = new Anthropic({
      apiKey,
      timeout: timeoutMs,
      maxRetries: 0,
    });
    this.timeoutMs = timeoutMs;
    this.maxRetries = maxRetries;
  }

  public async extractSkillsFromResume(resumeText: string): Promise<string[]> {
    const prompt = [
      'You are a technical recruiter. Extract ALL technical skills, frameworks, languages, and tools from this resume. Return ONLY a JSON array of skill strings. No explanation, just JSON array.',
      '',
      `Resume: ${resumeText}`,
      '',
      'Return format: ["skill1", "skill2", ...]',
    ].join('\n');

    try {
      const result = await this.requestJson<unknown>(prompt, 'extractSkillsFromResume');
      return this.validateStringArray(result, 'skills');
    } catch (error) {
      logger.warn({ err: error }, 'Falling back to empty skill extraction result.');
      return [];
    }
  }

  public async analyzeProjectRelevance(
    projects: Project[],
    requiredSkills: string[],
  ): Promise<ProjectAnalysis[]> {
    const prompt = [
      'Analyze the relevance of each project to the required skills.',
      'Return ONLY valid JSON as an array with this exact structure:',
      '[{"projectTitle":"string","relevanceScore":0,"matchingSkills":["skill"],"reasoning":"string"}]',
      '',
      `Projects: ${JSON.stringify(projects)}`,
      `RequiredSkills: ${JSON.stringify(requiredSkills)}`,
    ].join('\n');

    try {
      const result = await this.requestJson<unknown>(prompt, 'analyzeProjectRelevance');
      return this.validateProjectAnalyses(result);
    } catch (error) {
      logger.warn({ err: error }, 'Falling back to empty project analysis result.');
      return projects.map((project) => ({
        projectTitle: project.title,
        relevanceScore: 0,
        matchingSkills: [],
        reasoning: 'AI analysis unavailable.',
      }));
    }
  }

  public async generateCandidateInsights(
    candidate: Candidate,
    job: Job,
    scores: ScoreBreakdown,
  ): Promise<CandidateInsights> {
    const prompt = [
      'Analyze this candidate against job requirements. Return ONLY valid JSON with this exact structure:',
      '{',
      '  "strengths": ["strength1", "strength2"],',
      '  "weaknesses": ["weakness1", "weakness2"],',
      '  "missingSkills": ["skill1", "skill2"],',
      '  "recommendation": "highly_recommended|recommended|consider|not_recommended",',
      '  "summary": "one paragraph summary"',
      '}',
      '',
      `Candidate: ${JSON.stringify(this.serializeCandidate(candidate))}`,
      `Job: ${JSON.stringify(this.serializeJob(job))}`,
      `Scores: ${JSON.stringify(scores)}`,
    ].join('\n');

    try {
      const result = await this.requestJson<unknown>(prompt, 'generateCandidateInsights');
      return this.validateCandidateInsights(result);
    } catch (error) {
      logger.warn({ err: error }, 'Falling back to default candidate insights.');
      return {
        strengths: [],
        weaknesses: ['AI-generated insights unavailable.'],
        missingSkills: [],
        recommendation: 'consider',
        summary: 'Automated insights are temporarily unavailable.',
      };
    }
  }

  public async evaluateCandidateFit(candidate: Candidate, job: Job): Promise<FitEvaluation> {
    const prompt = [
      'Evaluate how well this candidate fits the job.',
      'Return ONLY valid JSON with this exact structure:',
      '{"fitScore":0,"reasoning":"string","keyPoints":["point1","point2"]}',
      '',
      `Candidate: ${JSON.stringify(this.serializeCandidate(candidate))}`,
      `Job: ${JSON.stringify(this.serializeJob(job))}`,
    ].join('\n');

    try {
      const result = await this.requestJson<unknown>(prompt, 'evaluateCandidateFit');
      return this.validateFitEvaluation(result);
    } catch (error) {
      logger.warn({ err: error }, 'Falling back to default fit evaluation.');
      return {
        fitScore: 0,
        reasoning: 'AI evaluation unavailable.',
        keyPoints: ['Unable to complete Claude evaluation.'],
      };
    }
  }

  private async requestJson<T>(prompt: string, operation: string): Promise<T> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt < this.maxRetries) {
      attempt += 1;

      try {
        logger.info(
          {
            operation,
            model: MODEL,
            attempt,
            timeoutMs: this.timeoutMs,
          },
          'Calling Claude API',
        );

        const response = await this.client.messages.create({
          model: MODEL,
          max_tokens: 1200,
          temperature: 0,
          system: JSON_ONLY_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: prompt,
            } satisfies MessageParam,
          ],
        });

        const responseText = response.content
          .flatMap((block) => (block.type === 'text' ? [block.text] : []))
          .join('')
          .trim();

        logger.info(
          {
            operation,
            attempt,
            responseLength: responseText.length,
          },
          'Claude API response received',
        );

        return this.parseJsonResponse<T>(responseText, operation);
      } catch (error) {
        lastError = error;
        logger.warn(
          {
            operation,
            attempt,
            err: error,
          },
          'Claude API call failed',
        );

        if (!this.shouldRetry(error) || attempt >= this.maxRetries) {
          break;
        }

        await this.delay(250 * attempt);
      }
    }

    throw new AIServiceError(
      `Claude API request failed for ${operation}.`,
      'AI_REQUEST_FAILED',
      lastError,
    );
  }

  private parseJsonResponse<T>(content: string, operation: string): T {
    try {
      return JSON.parse(content) as T;
    } catch (error) {
      throw new AIServiceError(
        `Claude returned invalid JSON for ${operation}.`,
        'AI_INVALID_JSON',
        {
          error,
          content,
        },
      );
    }
  }

  private shouldRetry(error: unknown): boolean {
    if (error instanceof AIServiceError) {
      return false;
    }

    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const maybeStatus = 'status' in error ? error.status : undefined;
    const maybeCode = 'code' in error ? error.code : undefined;

    return (
      maybeStatus === 429 ||
      maybeStatus === 408 ||
      maybeStatus === 500 ||
      maybeStatus === 502 ||
      maybeStatus === 503 ||
      maybeStatus === 504 ||
      maybeCode === 'rate_limit_error'
    );
  }

  private validateStringArray(value: unknown, field: string): string[] {
    if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
      throw new AIServiceError(`Invalid JSON structure for ${field}.`, 'AI_INVALID_STRUCTURE', value);
    }

    return [...new Set(value.map((item) => item.trim()).filter(Boolean))];
  }

  private validateProjectAnalyses(value: unknown): ProjectAnalysis[] {
    if (!Array.isArray(value)) {
      throw new AIServiceError(
        'Invalid JSON structure for project analysis.',
        'AI_INVALID_STRUCTURE',
        value,
      );
    }

    return value.map((item) => {
      if (!this.isObject(item)) {
        throw new AIServiceError(
          'Project analysis entry must be an object.',
          'AI_INVALID_STRUCTURE',
          item,
        );
      }

      const projectTitle = this.requireString(item.projectTitle, 'projectTitle');
      const relevanceScore = this.requireScore(item.relevanceScore, 'relevanceScore');
      const matchingSkills = this.validateStringArray(item.matchingSkills, 'matchingSkills');
      const reasoning = this.requireString(item.reasoning, 'reasoning');

      return {
        projectTitle,
        relevanceScore,
        matchingSkills,
        reasoning,
      };
    });
  }

  private validateCandidateInsights(value: unknown): CandidateInsights {
    if (!this.isObject(value)) {
      throw new AIServiceError(
        'Invalid JSON structure for candidate insights.',
        'AI_INVALID_STRUCTURE',
        value,
      );
    }

    return {
      strengths: this.validateStringArray(value.strengths, 'strengths'),
      weaknesses: this.validateStringArray(value.weaknesses, 'weaknesses'),
      missingSkills: this.validateStringArray(value.missingSkills, 'missingSkills'),
      recommendation: this.requireRecommendation(value.recommendation),
      summary: this.requireString(value.summary, 'summary'),
    };
  }

  private validateFitEvaluation(value: unknown): FitEvaluation {
    if (!this.isObject(value)) {
      throw new AIServiceError(
        'Invalid JSON structure for fit evaluation.',
        'AI_INVALID_STRUCTURE',
        value,
      );
    }

    return {
      fitScore: this.requireScore(value.fitScore, 'fitScore'),
      reasoning: this.requireString(value.reasoning, 'reasoning'),
      keyPoints: this.validateStringArray(value.keyPoints, 'keyPoints'),
    };
  }

  private requireString(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new AIServiceError(`Invalid value for ${field}.`, 'AI_INVALID_STRUCTURE', value);
    }

    return value.trim();
  }

  private requireScore(value: unknown, field: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
      throw new AIServiceError(`Invalid value for ${field}.`, 'AI_INVALID_STRUCTURE', value);
    }

    return Number(value.toFixed(2));
  }

  private requireRecommendation(value: unknown): string {
    const allowed = new Set([
      'highly_recommended',
      'recommended',
      'consider',
      'not_recommended',
    ]);

    if (typeof value !== 'string' || !allowed.has(value)) {
      throw new AIServiceError(
        'Invalid value for recommendation.',
        'AI_INVALID_STRUCTURE',
        value,
      );
    }

    return value;
  }

  private isObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null;
  }

  private serializeCandidate(candidate: Candidate) {
    return {
      id: candidate.getId(),
      name: candidate.getName(),
      email: candidate.getEmail(),
      phone: candidate.getPhone(),
      skills: candidate.getSkills(),
      yearsOfExperience: candidate.getYearsOfExperience(),
      education: candidate.getEducation(),
      projects: candidate.getProjects(),
      status: candidate.getStatus(),
    };
  }

  private serializeJob(job: Job) {
    return {
      id: job.getId(),
      title: job.getTitle(),
      department: job.getDepartment(),
      description: job.getDescription(),
      requiredSkills: job.getRequiredSkills(),
      preferredSkills: job.getPreferredSkills(),
      requiredExperience: job.getRequiredExperience(),
      status: job.getStatus(),
    };
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
