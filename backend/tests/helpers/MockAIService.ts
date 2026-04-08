import type { ScoreBreakdown } from '../../src/domain/types/ScoringTypes';
import type { Candidate } from '../../src/domain/entities/Candidate';
import type { Job } from '../../src/domain/entities/Job';
import type { IAIService } from '../../src/domain/services/IAIService';
import type {
  CandidateInsights,
  FitEvaluation,
  Project,
  ProjectAnalysis,
} from '../../src/domain/types/AITypes';

export class MockAIService implements IAIService {
  public skills: string[] = ['TypeScript', 'Node.js', 'Docker'];

  public async extractSkillsFromResume(_resumeText: string): Promise<string[]> {
    return this.skills;
  }

  public async analyzeProjectRelevance(
    projects: Project[],
    requiredSkills: string[],
  ): Promise<ProjectAnalysis[]> {
    return projects.map((project) => ({
      projectTitle: project.title,
      relevanceScore: requiredSkills.length > 0 ? 80 : 0,
      matchingSkills: requiredSkills.slice(0, 2),
      reasoning: 'Mock relevance analysis.',
    }));
  }

  public async generateCandidateInsights(
    _candidate: Candidate,
    _job: Job,
    scores: ScoreBreakdown,
  ): Promise<CandidateInsights> {
    return {
      strengths: ['Strong technical alignment'],
      weaknesses: ['Needs more production scale exposure'],
      missingSkills: ['Kubernetes'],
      recommendation: scores.overallScore >= 80 ? 'recommended' : 'consider',
      summary: 'Mock candidate summary.',
    };
  }

  public async evaluateCandidateFit(_candidate: Candidate, _job: Job): Promise<FitEvaluation> {
    return {
      fitScore: 82,
      reasoning: 'Mock fit evaluation.',
      keyPoints: ['Solid skill overlap', 'Relevant experience'],
    };
  }
}
