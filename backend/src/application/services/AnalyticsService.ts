import { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import { IJobRepository } from '../../domain/repositories/IJobRepository';
import { IEvaluationRepository } from '../../domain/repositories/IEvaluationRepository';
import { IPipelineRepository } from '../../domain/repositories/IPipelineRepository';
import { ICandidatePipelineStatusRepository } from '../../domain/repositories/ICandidatePipelineStatusRepository';
import { 
  VelocityMetrics, 
  FunnelData, 
  SkillsReport, 
  HiringMetrics 
} from '../../domain/types/Analytics';

export class AnalyticsService {
  constructor(
    private readonly candidateRepository: ICandidateRepository,
    private readonly jobRepository: IJobRepository,
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly pipelineRepository: IPipelineRepository,
    private readonly statusRepository: ICandidatePipelineStatusRepository
  ) {}

  async calculateHiringMetrics(organizationId: string): Promise<HiringMetrics> {
    const candidates = await this.candidateRepository.findAll(organizationId);
    const evaluations = await this.evaluationRepository.findAll(organizationId);
    const jobs = await this.jobRepository.findAll(organizationId);

    const activeCandidates = candidates.filter(c => c.getStatus() === 'active').length;
    
    // Skill gap analysis
    const skillGaps = this.identifySkillGaps(candidates.map(c => c.getSkills()), jobs.map(j => j.getRequiredSkills()));

    return {
      totalCandidates: candidates.length,
      activeCandidates,
      totalEvaluations: evaluations.length,
      avgTimeToHire: 14, // Mock for now
      avgTimePerStage: {},
      offerAcceptanceRate: 0.85,
      topSources: [
        { source: 'LinkedIn', count: 45 },
        { source: 'Referral', count: 20 },
        { source: 'Indeed', count: 15 }
      ],
      skillGaps
    };
  }

  async calculateHiringVelocity(organizationId: string, jobId?: string): Promise<VelocityMetrics> {
    // Note: In a real system, we'd use organizationId to filter DB queries.
    // For now, returning mock trend data.
    return {
      candidatesAdded: [
        { label: 'Week 1', value: 12 },
        { label: 'Week 2', value: 18 },
        { label: 'Week 3', value: 25 },
        { label: 'Week 4', value: 22 }
      ],
      evaluationsCompleted: [
        { label: 'Week 1', value: 8 },
        { label: 'Week 2', value: 14 },
        { label: 'Week 3', value: 20 },
        { label: 'Week 4', value: 18 }
      ],
      trend: 'increasing'
    };
  }

  async calculateConversionFunnel(pipelineId: string, organizationId: string): Promise<FunnelData> {
    const pipeline = await this.pipelineRepository.findById(pipelineId, organizationId);
    if (!pipeline) throw new Error('Pipeline not found');

    const statuses = await this.statusRepository.findByPipelineId(pipelineId, organizationId);
    const stages = pipeline.getStages();
    
    let previousCount = statuses.length;
    const funnelStages = stages.map(stage => {
      const stageCount = statuses.filter(s => s.getCurrentStageId() === stage.getId()).length;
      const conversionRate = previousCount > 0 ? (stageCount / previousCount) * 100 : 0;
      const dropOffPercent = 100 - conversionRate;
      
      previousCount = stageCount;
      
      return {
        stageId: stage.getId(),
        stageName: stage.getName(),
        candidateCount: stageCount,
        conversionRate,
        dropOffPercent
      };
    });

    const bottleneck = [...funnelStages].sort((a, b) => a.dropOffPercent - b.dropOffPercent)[0];

    return {
      pipelineId,
      stages: funnelStages,
      totalConversionRate: statuses.length > 0 && funnelStages.length > 0
        ? ((funnelStages[funnelStages.length - 1]?.candidateCount || 0) / statuses.length) * 100 
        : 0,
      bottleneckStageId: bottleneck?.stageId
    };
  }

  async generateSkillsReport(organizationId: string): Promise<SkillsReport> {
    const candidates = await this.candidateRepository.findAll(organizationId);
    const jobs = await this.jobRepository.findAll(organizationId);

    const candidateSkills = candidates.flatMap(c => c.getSkills());
    const jobSkills = jobs.flatMap(j => j.getRequiredSkills());

    const mostInDemand = this.getTopRepeated(jobSkills, 10);
    const highestSupply = this.getTopRepeated(candidateSkills, 10);
    const criticalSkillGaps = mostInDemand.filter(s => !highestSupply.includes(s));

    return {
      mostInDemand,
      highestSupply,
      criticalSkillGaps
    };
  }

  private identifySkillGaps(candidateSkillsList: string[][], jobSkillsList: string[][]): Array<{ skill: string; demandCount: number; supplyCount: number }> {
    const demand: Record<string, number> = {};
    const supply: Record<string, number> = {};

    jobSkillsList.flat().forEach(s => demand[s] = (demand[s] || 0) + 1);
    candidateSkillsList.flat().forEach(s => supply[s] = (supply[s] || 0) + 1);

    return Object.keys(demand).map(skill => ({
      skill,
      demandCount: demand[skill] || 0,
      supplyCount: supply[skill] || 0
    })).sort((a, b) => (b.demandCount || 0) - (a.demandCount || 0));
  }

  private getTopRepeated(arr: string[], limit: number): string[] {
    const counts: Record<string, number> = {};
    arr.forEach(x => counts[x] = (counts[x] || 0) + 1);
    return Object.keys(counts).sort((a, b) => (counts[b] || 0) - (counts[a] || 0)).slice(0, limit);
  }
}
