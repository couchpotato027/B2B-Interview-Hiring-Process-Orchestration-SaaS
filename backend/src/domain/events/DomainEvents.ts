export interface DomainEvent {
  eventType: string;
  timestamp: Date;
  payload: unknown;
}

export interface CandidateCreatedEvent extends DomainEvent {
  eventType: 'CandidateCreatedEvent';
  payload: {
    candidateId: string;
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
    timestamp: Date;
  };
}

export interface EvaluationCompletedEvent extends DomainEvent {
  eventType: 'EvaluationCompletedEvent';
  payload: {
    evaluationId: string;
    candidateId: string;
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
    rank: number;
    timestamp: Date;
  };
}
