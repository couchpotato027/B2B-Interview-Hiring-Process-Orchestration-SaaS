export interface StageTransition {
  fromStageId: string | null;
  toStageId: string;
  movedAt: Date;
  movedBy: string;
  reason?: string;
}

export interface CandidatePipelineStatusProps {
  id: string;
  candidateId: string;
  pipelineId: string;
  currentStageId: string;
  stageHistory: StageTransition[];
  notes?: string;
  updatedAt: Date;
}

export class CandidatePipelineStatus {
  private readonly id: string;
  private readonly candidateId: string;
  private readonly pipelineId: string;
  private currentStageId: string;
  private stageHistory: StageTransition[];
  private notes?: string;
  private updatedAt: Date;

  constructor(props: CandidatePipelineStatusProps) {
    this.id = props.id;
    this.candidateId = props.candidateId;
    this.pipelineId = props.pipelineId;
    this.currentStageId = props.currentStageId;
    this.stageHistory = props.stageHistory;
    this.notes = props.notes;
    this.updatedAt = props.updatedAt;
  }

  public getId(): string {
    return this.id;
  }

  public getCandidateId(): string {
    return this.candidateId;
  }

  public getPipelineId(): string {
    return this.pipelineId;
  }

  public getCurrentStageId(): string {
    return this.currentStageId;
  }

  public getStageHistory(): StageTransition[] {
    return [...this.stageHistory];
  }

  public getNotes(): string | undefined {
    return this.notes;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  public moveToStage(stageId: string, movedBy: string, reason?: string, notes?: string): void {
    const transition: StageTransition = {
      fromStageId: this.currentStageId,
      toStageId: stageId,
      movedAt: new Date(),
      movedBy,
      reason,
    };

    this.stageHistory.push(transition);
    this.currentStageId = stageId;
    this.notes = notes || this.notes;
    this.updatedAt = new Date();
  }

  public getTimeInCurrentStage(): number {
    if (this.stageHistory.length === 0) return 0;
    const lastTransition = this.stageHistory[this.stageHistory.length - 1];
    return lastTransition ? Date.now() - lastTransition.movedAt.getTime() : 0;
  }
}
