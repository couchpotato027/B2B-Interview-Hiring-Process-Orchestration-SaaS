import { randomUUID } from 'crypto';
import type { Job, JobStatus } from '../../domain/entities/Job';
import type { IJobRepository } from '../../domain/repositories/IJobRepository';

export class InMemoryJobRepository implements IJobRepository {
  private readonly store = new Map<string, Job>();

  public async findById(id: string, organizationId: string): Promise<Job | null> {
    const job = this.store.get(id);
    if (job && job.getOrganizationId() === organizationId) {
      return job;
    }
    return null;
  }

  public async findAll(organizationId: string): Promise<Job[]> {
    return Array.from(this.store.values()).filter(j => j.getOrganizationId() === organizationId);
  }

  public async findByStatus(status: JobStatus, organizationId: string): Promise<Job[]> {
    return Array.from(this.store.values()).filter(
      (job) => job.getStatus() === status && job.getOrganizationId() === organizationId
    );
  }

  public async findByOrganizationId(organizationId: string): Promise<Job[]> {
      return this.findAll(organizationId);
  }

  public async save(entity: Job): Promise<Job> {
    const job = this.ensureEntityId(entity);
    this.store.set(job.getId(), job);
    return job;
  }

  public async update(id: string, entity: Job, organizationId: string): Promise<Job> {
    const existing = this.store.get(id);
    if (!existing || existing.getOrganizationId() !== organizationId) {
      throw new Error(`Job with id ${id} not found in your organization.`);
    }

    const job = this.alignEntityId(entity, id);
    this.store.set(id, job);
    return job;
  }

  public async delete(id: string, organizationId: string): Promise<void> {
    const existing = this.store.get(id);
    if (existing && existing.getOrganizationId() === organizationId) {
      this.store.delete(id);
    }
  }

  private ensureEntityId(entity: Job): Job {
    return entity.getId().trim() ? entity : this.assignEntityId(entity, randomUUID());
  }

  private alignEntityId(entity: Job, id: string): Job {
    return entity.getId() === id ? entity : this.assignEntityId(entity, id);
  }

  private assignEntityId(entity: Job, id: string): Job {
    (entity as unknown as { id: string }).id = id;
    return entity;
  }
}
