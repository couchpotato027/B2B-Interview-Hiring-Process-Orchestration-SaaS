import { Interview } from '../entities/Interview';

export interface IInterviewRepository {
  findById(id: string, tenantId: string): Promise<Interview | null>;
  findByCandidateId(candidateId: string, tenantId: string): Promise<Interview[]>;
  findByInterviewerId(userId: string, tenantId: string): Promise<Interview[]>;
  findAvailabilityConflicts(userIds: string[], start: Date, end: Date, tenantId: string): Promise<Interview[]>;
  save(interview: Interview): Promise<Interview>;
  update(interview: Interview): Promise<Interview>;
  delete(id: string, tenantId: string): Promise<void>;
}
