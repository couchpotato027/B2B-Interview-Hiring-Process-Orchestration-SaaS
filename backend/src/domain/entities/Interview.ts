export type InterviewType = 'phone' | 'video' | 'onsite' | 'technical';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
export type PanelMemberRole = 'lead' | 'shadow' | 'observer';

export interface InterviewPanelMember {
  userId: string;
  role: PanelMemberRole;
}

export interface InterviewFeedback {
  rating: number; // 1-5
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire' | 'strong_no_hire';
  notes: string;
  strengths: string[];
  weaknesses: string[];
  rubricResponses?: Record<string, any>;
}

export interface InterviewProps {
  id: string;
  tenantId: string;
  candidateId: string;
  stageId: string;
  title: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduledAt: Date;
  duration: number; // minutes
  videoLink?: string;
  notes?: string;
  panel: InterviewPanelMember[];
  feedback?: InterviewFeedback;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Interview {
  private readonly id: string;
  private readonly tenantId: string;
  private readonly candidateId: string;
  private readonly stageId: string;
  private title: string;
  private type: InterviewType;
  private status: InterviewStatus;
  private scheduledAt: Date;
  private duration: number;
  private videoLink?: string;
  private notes?: string;
  private panel: InterviewPanelMember[];
  private feedback?: InterviewFeedback;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: InterviewProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.candidateId = props.candidateId;
    this.stageId = props.stageId;
    this.title = props.title || 'Technical Interview';
    this.type = props.type;
    this.status = props.status;
    this.scheduledAt = props.scheduledAt;
    this.duration = props.duration;
    this.videoLink = props.videoLink;
    this.notes = props.notes;
    this.panel = props.panel || [];
    this.feedback = props.feedback;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  public getId(): string { return this.id; }
  public getTenantId(): string { return this.tenantId; }
  public getCandidateId(): string { return this.candidateId; }
  public getStageId(): string { return this.stageId; }
  public getTitle(): string { return this.title; }
  public getType(): InterviewType { return this.type; }
  public getStatus(): InterviewStatus { return this.status; }
  public getScheduledAt(): Date { return new Date(this.scheduledAt); }
  public getDuration(): number { return this.duration; }
  public getVideoLink(): string | undefined { return this.videoLink; }
  public getNotes(): string | undefined { return this.notes; }
  public getPanel(): InterviewPanelMember[] { return [...this.panel]; }
  public getFeedback(): InterviewFeedback | undefined { return this.feedback ? { ...this.feedback } : undefined; }
  public getCreatedAt(): Date { return new Date(this.createdAt); }
  public getUpdatedAt(): Date { return new Date(this.updatedAt); }

  public reschedule(newTime: Date): void {
    this.scheduledAt = newTime;
    this.status = 'rescheduled';
    this.updatedAt = new Date();
  }

  public complete(feedback: InterviewFeedback): void {
    this.feedback = feedback;
    this.status = 'completed';
    this.updatedAt = new Date();
  }

  public cancel(): void {
    this.status = 'cancelled';
    this.updatedAt = new Date();
  }
}
