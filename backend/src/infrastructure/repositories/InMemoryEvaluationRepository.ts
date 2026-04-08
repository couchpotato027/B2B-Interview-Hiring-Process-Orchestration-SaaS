import { randomUUID } from 'crypto';
import type { Evaluation } from '../../domain/entities/Evaluation';
import type { IEvaluationRepository } from '../../domain/repositories/IEvaluationRepository';

export class InMemoryEvaluationRepository implements IEvaluationRepository {
  private readonly store = new Map<string, Evaluation>();

  public async findById(id: string): Promise<Evaluation | null> {
    return this.store.get(id) ?? null;
  }

  public async findAll(): Promise<Evaluation[]> {
    return Array.from(this.store.values());
  }

  public async findByJobId(jobId: string): Promise<Evaluation[]> {
    return Array.from(this.store.values()).filter((evaluation) => evaluation.getJobId() === jobId);
  }

  public async findByCandidateId(candidateId: string): Promise<Evaluation[]> {
    return Array.from(this.store.values()).filter(
      (evaluation) => evaluation.getCandidateId() === candidateId,
    );
  }

  public async save(entity: Evaluation): Promise<Evaluation> {
    const evaluation = this.ensureEntityId(entity);
    this.store.set(evaluation.getId(), evaluation);
    return evaluation;
  }

  public async update(id: string, entity: Evaluation): Promise<Evaluation> {
    if (!this.store.has(id)) {
      throw new Error(`Evaluation with id ${id} not found.`);
    }

    const evaluation = this.alignEntityId(entity, id);
    this.store.set(id, evaluation);
    return evaluation;
  }

  public async delete(id: string): Promise<void> {
    this.store.delete(id);
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
