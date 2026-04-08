import { randomUUID } from 'crypto';
import type { Resume } from '../../domain/entities/Resume';
import type { IResumeRepository } from '../../domain/repositories/IResumeRepository';

export class InMemoryResumeRepository implements IResumeRepository {
  private readonly store = new Map<string, Resume>();

  public async findById(id: string): Promise<Resume | null> {
    return this.store.get(id) ?? null;
  }

  public async findAll(): Promise<Resume[]> {
    return Array.from(this.store.values());
  }

  public async findByCandidateId(candidateId: string): Promise<Resume[]> {
    return Array.from(this.store.values()).filter(
      (resume) => resume.getCandidateId() === candidateId,
    );
  }

  public async save(entity: Resume): Promise<Resume> {
    const resume = this.ensureEntityId(entity);
    this.store.set(resume.getId(), resume);
    return resume;
  }

  public async update(id: string, entity: Resume): Promise<Resume> {
    if (!this.store.has(id)) {
      throw new Error(`Resume with id ${id} not found.`);
    }

    const resume = this.alignEntityId(entity, id);
    this.store.set(id, resume);
    return resume;
  }

  public async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  private ensureEntityId(entity: Resume): Resume {
    return entity.getId().trim() ? entity : this.assignEntityId(entity, randomUUID());
  }

  private alignEntityId(entity: Resume, id: string): Resume {
    return entity.getId() === id ? entity : this.assignEntityId(entity, id);
  }

  private assignEntityId(entity: Resume, id: string): Resume {
    (entity as unknown as { id: string }).id = id;
    return entity;
  }
}
