import { randomUUID } from 'crypto';
import type { Resume } from '../../domain/entities/Resume';
import type { IResumeRepository } from '../../domain/repositories/IResumeRepository';

export class InMemoryResumeRepository implements IResumeRepository {
  private readonly store = new Map<string, Resume>();

  public async findById(id: string, organizationId: string): Promise<Resume | null> {
    const resume = this.store.get(id);
    if (resume && resume.getOrganizationId() === organizationId) {
      return resume;
    }
    return null;
  }

  public async findAll(organizationId: string): Promise<Resume[]> {
    return Array.from(this.store.values()).filter(r => r.getOrganizationId() === organizationId);
  }

  public async findByCandidateId(candidateId: string, organizationId: string): Promise<Resume | null> {
    return Array.from(this.store.values()).find(
      (resume) => resume.getCandidateId() === candidateId && resume.getOrganizationId() === organizationId
    ) ?? null;
  }

  public async save(entity: Resume): Promise<Resume> {
    const resume = this.ensureEntityId(entity);
    this.store.set(resume.getId(), resume);
    return resume;
  }

  public async update(id: string, entity: Resume, organizationId: string): Promise<Resume> {
    const existing = this.store.get(id);
    if (!existing || existing.getOrganizationId() !== organizationId) {
      throw new Error(`Resume with id ${id} not found in your organization.`);
    }

    const resume = this.alignEntityId(entity, id);
    this.store.set(id, resume);
    return resume;
  }

  public async delete(id: string, organizationId: string): Promise<void> {
    const existing = this.store.get(id);
    if (existing && existing.getOrganizationId() === organizationId) {
      this.store.delete(id);
    }
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
