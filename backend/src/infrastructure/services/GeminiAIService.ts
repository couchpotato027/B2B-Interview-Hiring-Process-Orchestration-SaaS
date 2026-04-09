import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Candidate } from '../../domain/entities/Candidate';
import type { Job } from '../../domain/entities/Job';
import type { Resume } from '../../domain/entities/Resume';
import type { Evaluation } from '../../domain/entities/Evaluation';
import type { IAIService } from '../../domain/services/IAIService';
import type {
  CandidateInsights,
  FitEvaluation,
  Project,
  ProjectAnalysis,
  ComparativeInsights,
  MarketInsights,
  ResumeFeedback,
} from '../../domain/types/AITypes';
import type { ScoreBreakdown } from '../../domain/types/ScoringTypes';
import { env } from '../config/env';
import { logger } from '../logging/logger';
import { AIServiceError } from '../../shared/errors/AIServiceError';
import { cacheService } from '../cache/CacheService';
import { aiRateLimiter } from './RateLimiter';

type JsonObject = Record<string, unknown>;

export class GeminiAIService implements IAIService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: string;
  private readonly maxRetries: number;

  constructor(
    apiKey: string = env.geminiApiKey,
    model: string = env.geminiModel,
    maxRetries: number = 3,
  ) {
    if (!apiKey) {
      throw new AIServiceError(
        'Gemini API key is not configured. Set GEMINI_API_KEY to enable Gemini integration.',
        'AI_MISSING_API_KEY',
      );
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = model;
    this.maxRetries = maxRetries;
  }

  public async extractSkillsFromResume(resumeText: string): Promise<string[]> {
    const prompt = [
      'Extract ALL technical skills, frameworks, languages, and tools from this resume.',
      'Return ONLY a JSON array of skill strings.',
      '',
      `Resume: ${resumeText}`,
    ].join('\n');

    try {
      const result = await this.requestJson<string[]>(prompt, 'extractSkillsFromResume');
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
      'Return a JSON array where each object has: projectTitle (string), relevanceScore (number 0-100), matchingSkills (string array), and reasoning (string).',
      '',
      `Projects: ${JSON.stringify(projects)}`,
      `RequiredSkills: ${JSON.stringify(requiredSkills)}`,
    ].join('\n');

    try {
      const result = await this.requestJson<ProjectAnalysis[]>(prompt, 'analyzeProjectRelevance');
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
      'Analyze this candidate against job requirements.',
      'Return valid JSON with keys: strengths (array), weaknesses (array), missingSkills (array), recommendation (highly_recommended|recommended|consider|not_recommended), and summary (string).',
      '',
      `Candidate: ${JSON.stringify(this.serializeCandidate(candidate))}`,
      `Job: ${JSON.stringify(this.serializeJob(job))}`,
      `Scores: ${JSON.stringify(scores)}`,
    ].join('\n');

    try {
      const result = await this.requestJson<CandidateInsights>(prompt, 'generateCandidateInsights');
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
      'Return valid JSON with keys: fitScore (number 0-100), reasoning (string), and keyPoints (string array).',
      '',
      `Candidate: ${JSON.stringify(this.serializeCandidate(candidate))}`,
      `Job: ${JSON.stringify(this.serializeJob(job))}`,
    ].join('\n');

    try {
      const result = await this.requestJson<FitEvaluation>(prompt, 'evaluateCandidateFit');
      return this.validateFitEvaluation(result);
    } catch (error) {
      logger.warn({ err: error }, 'Falling back to default fit evaluation.');
      return {
        fitScore: 0,
        reasoning: 'AI evaluation unavailable.',
        keyPoints: ['Unable to complete Gemini evaluation.'],
      };
    }
  }

  public async generateComparativeAnalysis(
    evaluations: Evaluation[],
    candidates: Candidate[],
    job: Job
  ): Promise<ComparativeInsights> {
    const prompt = [
      'Compare multiple candidates for this job based on their evaluations.',
      'Identify the strongest candidate and provide a ranked list with differentiators.',
      'Return valid JSON with keys: strongestCandidateId (string), rankings (array of {candidateId, rank, differentiator}), skillGapAnalysis (string), and summary (string).',
      '',
      `Job: ${JSON.stringify(this.serializeJob(job))}`,
      `Candidates: ${JSON.stringify(candidates.map(c => this.serializeCandidate(c)))}`,
      `Evaluations: ${JSON.stringify(evaluations.map(e => ({ id: e.getId(), candidateId: e.getCandidateId(), overallScore: e.getOverallScore(), recommendation: e.getRecommendation() })))}`,
    ].join('\n');

    return this.requestJson<ComparativeInsights>(prompt, 'generateComparativeAnalysis');
  }

  public async generateJobMarketInsights(job: Job): Promise<MarketInsights> {
    const prompt = [
      'Analyze this job to provide market insights.',
      'Return valid JSON with keys: skillDemand (array of {skill, demandLevel}), suggestedSalaryRange ({min, max, currency}), similarJobTitles (array), and interviewQuestions (array).',
      '',
      `Job: ${JSON.stringify(this.serializeJob(job))}`,
    ].join('\n');

    return this.requestJson<MarketInsights>(prompt, 'generateJobMarketInsights');
  }

  public async generateResumeFeedback(resume: Resume): Promise<ResumeFeedback> {
    const prompt = [
      'Provide constructive feedback for this resume from an ATS and recruiter perspective.',
      'Return valid JSON with keys: strengths (array), improvements (array), missingKeywords (array), formattingSuggestions (array), and overallScore (number).',
      '',
      `Resume Text: ${resume.getRawText()}`,
    ].join('\n');

    return this.requestJson<ResumeFeedback>(prompt, 'generateResumeFeedback');
  }

  private async requestJson<T>(prompt: string, operation: string): Promise<T> {
    const cacheKey = cacheService.generateKey(operation, prompt);
    const cached = cacheService.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    await aiRateLimiter.acquire();

    let attempt = 0;
    let lastError: unknown;

    while (attempt < this.maxRetries) {
      attempt += 1;

      try {
        logger.info(
          {
            operation,
            model: this.model,
            attempt,
          },
          'Calling Gemini API',
        );

        const model = this.genAI.getGenerativeModel({
          model: this.model,
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        const parsed = this.parseJsonResponse<T>(responseText, operation);
        cacheService.set(cacheKey, parsed);
        return parsed;
      } catch (error) {
        lastError = error;
        logger.warn(
          {
            operation,
            attempt,
            err: error,
          },
          'Gemini API call failed',
        );

        if (!this.shouldRetry(error) || attempt >= this.maxRetries) {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new AIServiceError(
      `Gemini API request failed for ${operation} after ${attempt} attempts.`,
      'AI_REQUEST_FAILED',
      lastError,
    );
  }

  private parseJsonResponse<T>(content: string, operation: string): T {
    try {
      // Clean up common issues (Gemini sometimes adds minor text or formatting markers occasionally)
      const cleaned = content.replace(/```json\n?|```/g, '').trim();
      return JSON.parse(cleaned) as T;
    } catch (error) {
      throw new AIServiceError(
        `Gemini returned invalid JSON for ${operation}.`,
        'AI_INVALID_JSON',
        {
          error,
          content,
        },
      );
    }
  }

  private shouldRetry(error: any): boolean {
    const status = error?.status || error?.response?.status;
    // Common retryable statuses for Gemini: 429 (Rate Limit), 500, 503
    return status === 429 || status === 500 || status === 503;
  }

  private validateStringArray(value: unknown, field: string): string[] {
    if (!Array.isArray(value)) return [];
    return value.map(String).filter(Boolean);
  }

  private validateProjectAnalyses(value: unknown): ProjectAnalysis[] {
    if (!Array.isArray(value)) return [];
    return value.map((item: any) => ({
      projectTitle: String(item.projectTitle || 'Unknown'),
      relevanceScore: Number(item.relevanceScore) || 0,
      matchingSkills: Array.isArray(item.matchingSkills) ? item.matchingSkills.map(String) : [],
      reasoning: String(item.reasoning || ''),
    }));
  }

  private validateCandidateInsights(value: unknown): CandidateInsights {
    const obj = value as any;
    return {
      strengths: this.validateStringArray(obj.strengths, 'strengths'),
      weaknesses: this.validateStringArray(obj.weaknesses, 'weaknesses'),
      missingSkills: this.validateStringArray(obj.missingSkills, 'missingSkills'),
      recommendation: String(obj.recommendation || 'consider'),
      summary: String(obj.summary || ''),
    };
  }

  private validateFitEvaluation(value: unknown): FitEvaluation {
    const obj = value as any;
    return {
      fitScore: Number(obj.fitScore) || 0,
      reasoning: String(obj.reasoning || ''),
      keyPoints: this.validateStringArray(obj.keyPoints, 'keyPoints'),
    };
  }

  private serializeCandidate(candidate: Candidate) {
    return {
      id: candidate.getId(),
      skills: candidate.getSkills(),
      experience: candidate.getYearsOfExperience(),
      education: candidate.getEducation(),
      projects: candidate.getProjects(),
    };
  }

  private serializeJob(job: Job) {
    return {
      id: job.getId(),
      title: job.getTitle(),
      description: job.getDescription(),
      requiredSkills: job.getRequiredSkills(),
      requiredExperience: job.getRequiredExperience(),
    };
  }
}
