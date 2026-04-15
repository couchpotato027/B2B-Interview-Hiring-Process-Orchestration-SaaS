import { randomUUID } from 'crypto';
import type { Evaluation } from '../../domain/entities/Evaluation';
import type { IEvaluationRepository } from '../../domain/repositories/IEvaluationRepository';

export class InMemoryEvaluationRepository implements IEvaluationRepository {
  private readonly store = new Map<string, Evaluation>();

  public async findById(id: string, organizationId: string): Promise<Evaluation | null> {
    const evaluation = this.store.get(id);
    if (evaluation && evaluation.getOrganizationId() === organizationId) {
      return evaluation;
    }
    return null;
  }

  public async findAll(organizationId: string): Promise<Evaluation[]> {
    return Array.from(this.store.values()).filter(e => e.getOrganizationId() === organizationId);
  }

  public async findByJobId(jobId: string, organizationId: string): Promise<Evaluation[]> {
    return Array.from(this.store.values()).filter(
      (evaluation) => evaluation.getJobId() === jobId && evaluation.getOrganizationId() === organizationId
    );
  }

  public async findByCandidateId(candidateId: string, organizationId: string): Promise<Evaluation[]> {
    return Array.from(this.store.values()).filter(
      (evaluation) => evaluation.getCandidateId() === candidateId && evaluation.getOrganizationId() === organizationId
    );
  }

  public async findByCandidateAndJob(candidateId: string, jobId: string, organizationId: string): Promise<Evaluation | null> {
    return (
      Array.from(this.store.values()).find(
        (evaluation) => 
          evaluation.getCandidateId() === candidateId && 
          evaluation.getJobId() === jobId && 
          evaluation.getOrganizationId() === organizationId
      ) ?? null
    );
  }

  public async save(entity: Evaluation): Promise<Evaluation> {
    const evaluation = this.ensureEntityId(entity);
    this.store.set(evaluation.getId(), evaluation);
    return evaluation;
  }

  public async update(id: string, entity: Evaluation, organizationId: string): Promise<Evaluation> {
    const existing = this.store.get(id);
    if (!existing || existing.getOrganizationId() !== organizationId) {
      throw new Error(`Evaluation with id ${id} not found in your organization.`);
    }

    const evaluation = this.alignEntityId(entity, id);
    this.store.set(id, evaluation);
    return evaluation;
  }

  public async delete(id: string, organizationId: string): Promise<void> {
    const existing = this.store.get(id);
    if (existing && existing.getOrganizationId() === organizationId) {
      this.store.delete(id);
    }
  }

  private ensureEntityId(entity: Evaluation): Evaluation {
    return entity.getId().trim() ? entity : this.assignEntityId(entity, randomUUID());
  }

  private alignEntityId(entity: Evaluation, id: string): Evaluation {
    return entity.getId() === id ? entity : this.assignEntityId(entity, id);
  }

  private assignEntityId(entity: Evaluation, id: string): Evaluation {
    (entity as unknown as { id: string }).id = id;
    return entity;
  }
}
