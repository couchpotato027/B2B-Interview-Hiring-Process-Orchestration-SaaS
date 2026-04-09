export type PipelineStageType = 'screening' | 'interview' | 'assessment' | 'offer' | 'custom' | 'rejected';

export interface AutoAction {
  trigger: 'on_enter' | 'on_exit';
  type: 'send_email' | 'notify_slack' | 'create_task';
  payload: Record<string, unknown>;
}

export interface PipelineStageProps {
  id: string;
  name: string;
  order: number;
  type: PipelineStageType;
  autoActions?: AutoAction[];
}

export class PipelineStage {
  private readonly id: string;
  private name: string;
  private order: number;
  private readonly type: PipelineStageType;
  private autoActions: AutoAction[];

  constructor(props: PipelineStageProps) {
    this.id = PipelineStage.requireNonEmpty(props.id, 'Stage id is required.');
    this.name = PipelineStage.requireNonEmpty(props.name, 'Stage name is required.');
    this.order = props.order;
    this.type = props.type;
    this.autoActions = props.autoActions ?? [];
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getOrder(): number {
    return this.order;
  }

  public getType(): PipelineStageType {
    return this.type;
  }

  public getAutoActions(): AutoAction[] {
    return [...this.autoActions];
  }

  public setOrder(order: number): void {
    this.order = order;
  }

  private static requireNonEmpty(value: string, message: string): string {
    if (!value?.trim()) {
      throw new Error(message);
    }
    return value.trim();
  }
}
