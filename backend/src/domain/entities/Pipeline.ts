import { PipelineStage } from './PipelineStage';

export interface PipelineProps {
  id: string;
  name: string;
  jobId: string;
  stages: PipelineStage[];
  isActive: boolean;
  createdAt: Date;
}

export class Pipeline {
  private readonly id: string;
  private name: string;
  private readonly jobId: string;
  private stages: PipelineStage[];
  private isActive: boolean;
  private readonly createdAt: Date;

  constructor(props: PipelineProps) {
    this.id = props.id;
    this.name = props.name;
    this.jobId = props.jobId;
    this.stages = this.sortStages(props.stages);
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getJobId(): string {
    return this.jobId;
  }

  public getStages(): PipelineStage[] {
    return [...this.stages];
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public addStage(stage: PipelineStage): void {
    this.stages.push(stage);
    this.stages = this.sortStages(this.stages);
  }

  public removeStage(stageId: string): void {
    this.stages = this.stages.filter((s) => s.getId() !== stageId);
  }

  public reorderStages(stageIds: string[]): void {
    const stageMap = new Map(this.stages.map((s) => [s.getId(), s]));
    
    this.stages = stageIds
      .map((id, index) => {
        const stage = stageMap.get(id);
        if (stage) {
          stage.setOrder(index);
          return stage;
        }
        return null;
      })
      .filter((s): s is PipelineStage => s !== null);
  }

  public getStageById(stageId: string): PipelineStage | undefined {
    return this.stages.find((s) => s.getId() === stageId);
  }

  private sortStages(stages: PipelineStage[]): PipelineStage[] {
    return [...stages].sort((a, b) => a.getOrder() - b.getOrder());
  }
}
