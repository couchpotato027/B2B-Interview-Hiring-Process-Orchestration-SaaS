import { randomUUID } from 'crypto';
import type { Job, JobStatus } from '../../domain/entities/Job';
import type { IJobRepository } from '../../domain/repositories/IJobRepository';

export class InMemoryJobRepository implements IJobRepository {
  private readonly store = new Map<string, Job>();

  public async findById(id: string): Promise<Job | null> {
    return this.store.get(id) ?? null;
  }

  public async findAll(): Promise<Job[]> {
    return Array.from(this.store.values());
  }

  public async findByStatus(status: JobStatus): Promise<Job[]> {
    return Array.from(this.store.values()).filter((job) => job.getStatus() === status);
  }

  public async save(entity: Job): Promise<Job> {
    const job = this.ensureEntityId(entity);
    this.store.set(job.getId(), job);
    return job;
  }

  public async update(id: string, entity: Job): Promise<Job> {
    if (!this.store.has(id)) {
      throw new Error(`Job with id ${id} not found.`);
    }

    const job = this.alignEntityId(entity, id);
    this.store.set(id, job);
    return job;
  }

  public async delete(id: string): Promise<void> {
    this.store.delete(id);
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
