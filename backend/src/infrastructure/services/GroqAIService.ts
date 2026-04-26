import Groq from 'groq-sdk';
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
import { logger } from '../logging/logger';
import { cacheService } from '../cache/CacheService';

/**
 * GroqAIService — Uses the free Groq Cloud API (LLaMA 3 / Mixtral)
 * for all AI operations. Drop-in replacement for GeminiAIService.
 */
export class GroqAIService implements IAIService {
  private readonly client: Groq;
  private readonly model: string;
  private readonly maxRetries: number;

  constructor(
    apiKey: string,
    model: string = 'llama-3.3-70b-versatile',
    maxRetries: number = 3,
  ) {
    if (!apiKey) {
      throw new Error(
        'Groq API key is not configured. Set GROQ_API_KEY in your .env file.',
      );
    }

    this.client = new Groq({ apiKey });
    this.model = model;
    this.maxRetries = maxRetries;
  }

  public async extractSkillsFromResume(resumeText: string): Promise<string[]> {
    const prompt = [
      'Extract ALL technical skills, frameworks, programming languages, and tools from the following resume text.',
      'Return ONLY a valid JSON array of skill strings, nothing else.',
      'Example: ["JavaScript", "React", "Node.js", "PostgreSQL"]',
      '',
      `Resume:\n${resumeText}`,
    ].join('\n');

    try {
      const result = await this.requestJson<string[]>(prompt, 'extractSkillsFromResume');
      return this.validateStringArray(result);
    } catch (error) {
      logger.warn({ err: error }, 'Groq: Falling back to empty skill extraction.');
      return [];
    }
  }

  public async analyzeProjectRelevance(
    projects: Project[],
    requiredSkills: string[],
  ): Promise<ProjectAnalysis[]> {
    const prompt = [
      'Analyze the relevance of each project to the required skills.',
      'Return a JSON array where each object has: projectTitle (string), relevanceScore (number 0-100), matchingSkills (string array), reasoning (string).',
      '',
      `Projects: ${JSON.stringify(projects)}`,
      `Required Skills: ${JSON.stringify(requiredSkills)}`,
    ].join('\n');

    try {
      const result = await this.requestJson<ProjectAnalysis[]>(prompt, 'analyzeProjectRelevance');
      return this.validateProjectAnalyses(result);
    } catch (error) {
      logger.warn({ err: error }, 'Groq: Falling back to empty project analysis.');
      return projects.map((p) => ({
        projectTitle: p.title,
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
      'Analyze this candidate against the job requirements.',
      'Return valid JSON with keys: strengths (array of strings), weaknesses (array of strings), missingSkills (array of strings), recommendation (one of: "highly_recommended", "recommended", "consider", "not_recommended"), summary (string).',
      '',
      `Candidate: ${JSON.stringify(this.serializeCandidate(candidate))}`,
      `Job: ${JSON.stringify(this.serializeJob(job))}`,
      `Scores: ${JSON.stringify(scores)}`,
    ].join('\n');

    try {
      const result = await this.requestJson<CandidateInsights>(prompt, 'generateCandidateInsights');
      return this.validateCandidateInsights(result);
    } catch (error) {
      logger.warn({ err: error }, 'Groq: Falling back to default candidate insights.');
      return {
        strengths: [],
        weaknesses: ['AI-generated insights temporarily unavailable.'],
        missingSkills: [],
        recommendation: 'consider',
        summary: 'Automated insights are temporarily unavailable.',
      };
    }
  }

  public async evaluateCandidateFit(candidate: Candidate, job: Job): Promise<FitEvaluation> {
    const prompt = [
      'Evaluate how well this candidate fits the job.',
      'Return valid JSON with keys: fitScore (number 0-100), reasoning (string), keyPoints (string array).',
      '',
      `Candidate: ${JSON.stringify(this.serializeCandidate(candidate))}`,
      `Job: ${JSON.stringify(this.serializeJob(job))}`,
    ].join('\n');

    try {
      const result = await this.requestJson<FitEvaluation>(prompt, 'evaluateCandidateFit');
      return this.validateFitEvaluation(result);
    } catch (error) {
      logger.warn({ err: error }, 'Groq: Falling back to default fit evaluation.');
      return {
        fitScore: 0,
        reasoning: 'AI evaluation unavailable.',
        keyPoints: ['Unable to complete AI evaluation.'],
      };
    }
  }

  public async generateComparativeAnalysis(
    evaluations: Evaluation[],
    candidates: Candidate[],
    job: Job,
  ): Promise<ComparativeInsights> {
    const prompt = [
      'Compare multiple candidates for this job based on their evaluations.',
      'Identify the strongest candidate and provide a ranked list.',
      'Return valid JSON with keys: strongestCandidateId (string), rankings (array of {candidateId, rank, differentiator}), skillGapAnalysis (string), summary (string).',
      '',
      `Job: ${JSON.stringify(this.serializeJob(job))}`,
      `Candidates: ${JSON.stringify(candidates.map((c) => this.serializeCandidate(c)))}`,
      `Evaluations: ${JSON.stringify(evaluations.map((e) => ({
        id: e.getId(),
        candidateId: e.getCandidateId(),
        overallScore: e.getOverallScore(),
        recommendation: e.getRecommendation(),
      })))}`,
    ].join('\n');

    try {
      return await this.requestJson<ComparativeInsights>(prompt, 'generateComparativeAnalysis');
    } catch (error) {
      return {
        strongestCandidateId: '',
        rankings: [],
        skillGapAnalysis: 'AI analysis unavailable.',
        summary: 'Comparative analysis temporarily unavailable.',
      };
    }
  }

  public async generateJobMarketInsights(job: Job): Promise<MarketInsights> {
    const prompt = [
      'Analyze this job posting to provide market insights.',
      'Return valid JSON with keys: skillDemand (array of {skill, demandLevel}), suggestedSalaryRange ({min, max, currency}), similarJobTitles (array), interviewQuestions (array of strings).',
      '',
      `Job: ${JSON.stringify(this.serializeJob(job))}`,
    ].join('\n');

    try {
      return await this.requestJson<MarketInsights>(prompt, 'generateJobMarketInsights');
    } catch (error) {
      return {
        skillDemand: [],
        suggestedSalaryRange: { min: 0, max: 0, currency: 'USD' },
        similarJobTitles: [],
        interviewQuestions: [],
      };
    }
  }

  public async generateResumeFeedback(resume: Resume): Promise<ResumeFeedback> {
    const prompt = [
      'Provide constructive feedback for this resume from an ATS and recruiter perspective.',
      'Return valid JSON with keys: strengths (array), improvements (array), missingKeywords (array), formattingSuggestions (array), overallScore (number 0-100).',
      '',
      `Resume Text: ${resume.getRawText()}`,
    ].join('\n');

    try {
      const result = await this.requestJson<ResumeFeedback>(prompt, 'generateResumeFeedback');
      return result;
    } catch (error) {
      return {
        strengths: [],
        improvements: [],
        missingKeywords: [],
        formattingSuggestions: [],
        overallScore: 0,
      };
    }
  }

  public async parseResume(resumeText: string): Promise<any> {
    const prompt = [
      'Extract structured information from the following resume text.',
      'Return valid JSON with the following structure:',
      '{',
      '  "name": "Full Name",',
      '  "email": "email@example.com",',
      '  "phone": "Extract the phone number exactly as it appears",',
      '  "summary": "A short professional summary of the candidate profile",',
      '  "skills": ["Skill 1", "Skill 2"],',
      '  "experience": "Detailed summary of work experience",',
      '  "education": "Summary of education",',
      '  "projects": [',
      '    { "title": "Project Name", "description": "Description", "technologies": ["Tech 1"] }',
      '  ],',
      '  "score": 85',
      '}',
      '',
      `Resume Text:\n${resumeText}`,
    ].join('\n');

    try {
      return await this.requestJson<any>(prompt, 'parseResume');
    } catch (error) {
      logger.error({ err: error }, 'Groq: Resume parsing failed.');
      throw error;
    }
  }

  // ─── Core API Call ──────────────────────────────────────────

  private async requestJson<T>(prompt: string, operation: string): Promise<T> {
    const cacheKey = cacheService.generateKey(operation, prompt);
    const cached = cacheService.get<T>(cacheKey);
    if (cached) return cached;

    let attempt = 0;
    let lastError: unknown;

    while (attempt < this.maxRetries) {
      attempt += 1;
      try {
        logger.info({ operation, model: this.model, attempt }, 'Calling Groq API');

        const completion = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that ONLY responds with valid JSON. No markdown, no explanation, no text outside the JSON.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 4096,
          response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content?.trim() || '{}';
        const parsed = this.parseJsonResponse<T>(responseText, operation);
        cacheService.set(cacheKey, parsed);
        return parsed;
      } catch (error: any) {
        lastError = error;
        logger.warn({ operation, attempt, err: error }, 'Groq API call failed');

        if (!this.shouldRetry(error) || attempt >= this.maxRetries) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error(`Groq API request failed for ${operation} after ${attempt} attempts.`);
  }

  private parseJsonResponse<T>(content: string, operation: string): T {
    try {
      const cleaned = content.replace(/```json\n?|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      // Groq with json_object mode wraps arrays in an object — unwrap if needed
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const keys = Object.keys(parsed);
        const firstKey = keys[0];
        if (keys.length === 1 && firstKey && Array.isArray(parsed[firstKey])) {
          return parsed[firstKey] as T;
        }
      }
      return parsed as T;
    } catch {
      throw new Error(`Groq returned invalid JSON for ${operation}: ${content.slice(0, 200)}`);
    }
  }

  private shouldRetry(error: any): boolean {
    const status = error?.status || error?.statusCode;
    return status === 429 || status === 500 || status === 503;
  }

  // ─── Validators ──────────────────────────────────────────────

  private validateStringArray(value: unknown): string[] {
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
      strengths: this.validateStringArray(obj.strengths),
      weaknesses: this.validateStringArray(obj.weaknesses),
      missingSkills: this.validateStringArray(obj.missingSkills),
      recommendation: String(obj.recommendation || 'consider'),
      summary: String(obj.summary || ''),
    };
  }

  private validateFitEvaluation(value: unknown): FitEvaluation {
    const obj = value as any;
    return {
      fitScore: Number(obj.fitScore) || 0,
      reasoning: String(obj.reasoning || ''),
      keyPoints: this.validateStringArray(obj.keyPoints),
    };
  }

  // ─── Serializers ─────────────────────────────────────────────

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
