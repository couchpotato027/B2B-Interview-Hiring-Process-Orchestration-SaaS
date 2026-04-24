import { Score } from '../value-objects/Score';

export type EvaluationRecommendation =
  | 'highly_recommended'
  | 'recommended'
  | 'consider'
  | 'not_recommended';

export interface EvaluationProps {
  id: string;
  candidateId: string;
  jobId: string;
  skillMatchScore: number;
  experienceScore: number;
  projectRelevanceScore: number;
  educationScore?: number;
  culturalFitScore?: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: EvaluationRecommendation;
  organizationId: string;
  evaluatedAt: Date;
}

export class Evaluation {
  private static readonly SKILL_MATCH_WEIGHT = 0.5;
  private static readonly EXPERIENCE_WEIGHT = 0.3;
  private static readonly PROJECT_RELEVANCE_WEIGHT = 0.2;

  private readonly id: string;
  private readonly candidateId: string;
  private readonly jobId: string;
  private skillMatchScore: Score;
  private experienceScore: Score;
  private projectRelevanceScore: Score;
  private educationScore: Score;
  private culturalFitScore: Score;
  private overallScore: Score;
  private strengths: string[];
  private weaknesses: string[];
  private recommendation: EvaluationRecommendation;
  private readonly organizationId: string;
  private readonly evaluatedAt: Date;

  constructor(props: EvaluationProps) {
    this.id = Evaluation.requireNonEmpty(props.id, 'Evaluation id is required.');
    this.candidateId = Evaluation.requireNonEmpty(props.candidateId, 'Candidate id is required.');
    this.jobId = Evaluation.requireNonEmpty(props.jobId, 'Job id is required.');
    this.organizationId = Evaluation.requireNonEmpty(props.organizationId, 'Organization id is required.');
    this.skillMatchScore = new Score(props.skillMatchScore);
    this.experienceScore = new Score(props.experienceScore);
    this.projectRelevanceScore = new Score(props.projectRelevanceScore);
    this.educationScore = new Score(props.educationScore || 0);
    this.culturalFitScore = new Score(props.culturalFitScore || 0);
    this.strengths = Evaluation.normalizeNotes(props.strengths);
    this.weaknesses = Evaluation.normalizeNotes(props.weaknesses);
    this.recommendation = props.recommendation;
    this.evaluatedAt = Evaluation.validateDate(props.evaluatedAt);
    this.overallScore = new Score(0);
    this.calculateOverallScore();
  }

  public getId(): string {
    return this.id;
  }

  public getCandidateId(): string {
    return this.candidateId;
  }

  public getJobId(): string {
    return this.jobId;
  }

  public getOrganizationId(): string {
    return this.organizationId;
  }

  public getSkillMatchScore(): number {
    return this.skillMatchScore.getValue();
  }

  public getExperienceScore(): number {
    return this.experienceScore.getValue();
  }

  public getProjectRelevanceScore(): number {
    return this.projectRelevanceScore.getValue();
  }

  public getEducationScore(): number {
    return this.educationScore.getValue();
  }

  public getCulturalFitScore(): number {
    return this.culturalFitScore.getValue();
  }

  public getOverallScore(): number {
    return this.overallScore.getValue();
  }

  public getStrengths(): string[] {
    return [...this.strengths];
  }

  public getWeaknesses(): string[] {
    return [...this.weaknesses];
  }

  public getRecommendation(): EvaluationRecommendation {
    return this.recommendation;
  }

  public getEvaluatedAt(): Date {
    return new Date(this.evaluatedAt);
  }

  public calculateOverallScore(): number {
    // We already have the overall score from the use case (which handles dynamic weights)
    // But for consistency we'll default it here if not provided or keep it updated.
    return this.overallScore.getValue();
  }

  public setOverallScore(score: number): void {
     this.overallScore = new Score(score);
  }

  private static normalizeNotes(notes: string[]): string[] {
    return notes.map((note) => Evaluation.requireNonEmpty(note, 'Evaluation note is required.'));
  }

  private static validateDate(value: Date): Date {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new Error('Evaluated date is invalid.');
    }

    return new Date(value);
  }

  private static requireNonEmpty(value: string, message: string): string {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new Error(message);
    }

    return normalizedValue;
  }
}
