export interface DomainEvent {
  eventType: string;
  timestamp: Date;
  payload: unknown;
}

export interface CandidateCreatedEvent extends DomainEvent {
  eventType: 'CandidateCreatedEvent';
  payload: {
    candidateId: string;
    organizationId: string;
    name: string;
    email: string;
    timestamp: Date;
  };
}

export interface ResumeProcessedEvent extends DomainEvent {
  eventType: 'ResumeProcessedEvent';
  payload: {
    candidateId: string;
    resumeId: string;
    organizationId: string;
    timestamp: Date;
  };
}

export interface EvaluationCompletedEvent extends DomainEvent {
  eventType: 'EvaluationCompletedEvent';
  payload: {
    evaluationId: string;
    candidateId: string;
    organizationId: string;
    jobId: string;
    overallScore: number;
    timestamp: Date;
  };
}

export interface CandidateRankedEvent extends DomainEvent {
  eventType: 'CandidateRankedEvent';
  payload: {
    jobId: string;
    candidateId: string;
    organizationId: string;
    rank: number;
    timestamp: Date;
  };
}

export interface PipelineCreatedEvent extends DomainEvent {
  eventType: 'PipelineCreatedEvent';
  payload: {
    pipelineId: string;
    organizationId: string;
    jobId: string;
    name: string;
    timestamp: Date;
  };
}

export interface CandidateMovedStageEvent extends DomainEvent {
  eventType: 'CandidateMovedStageEvent';
  payload: {
    candidateId: string;
    organizationId: string;
    pipelineId: string;
    fromStageId: string | null;
    toStageId: string;
    movedBy: string;
    timestamp: Date;
  };
}
