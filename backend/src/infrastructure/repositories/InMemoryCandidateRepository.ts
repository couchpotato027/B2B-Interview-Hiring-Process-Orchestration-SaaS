import { randomUUID } from 'crypto';
import type { Candidate } from '../../domain/entities/Candidate';
import type { CandidateFilters, ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import type { PaginatedResult } from '../../domain/types/Pagination';

export class InMemoryCandidateRepository implements ICandidateRepository {
  private readonly store = new Map<string, Candidate>();

  public async findById(id: string): Promise<Candidate | null> {
    return this.store.get(id) ?? null;
  }

  public async findAll(): Promise<Candidate[]> {
    return Array.from(this.store.values());
  }

  public async findByEmail(email: string): Promise<Candidate | null> {
    const normalizedEmail = email.trim().toLowerCase();

    for (const candidate of this.store.values()) {
      if (candidate.getEmail() === normalizedEmail) {
        return candidate;
      }
    }

    return null;
  }

  public async findWithFilters(filters: CandidateFilters): Promise<PaginatedResult<Candidate>> {
    const { page, limit, status, tenantId } = filters;
    let candidates = Array.from(this.store.values());

    // Applying filters
    if (tenantId) {
      candidates = candidates.filter((c) => c.getTenantId() === tenantId);
    }

    if (status) {
      candidates = candidates.filter((c) => c.getStatus() === status);
    }

    const total = candidates.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const items = candidates.slice(skip, skip + limit);

    return {
      items,
      metadata: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  public async save(entity: Candidate): Promise<Candidate> {
    const candidate = this.ensureEntityId(entity);
    this.store.set(candidate.getId(), candidate);
    return candidate;
  }

  public async update(id: string, entity: Candidate): Promise<Candidate> {
    if (!this.store.has(id)) {
      throw new Error(`Candidate with id ${id} not found.`);
    }

    const candidate = this.alignEntityId(entity, id);
    this.store.set(id, candidate);
    return candidate;
  }

  public async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  private ensureEntityId(entity: Candidate): Candidate {
    return entity.getId().trim() ? entity : this.assignEntityId(entity, randomUUID());
  }

  private alignEntityId(entity: Candidate, id: string): Candidate {
    return entity.getId() === id ? entity : this.assignEntityId(entity, id);
  }

  private assignEntityId(entity: Candidate, id: string): Candidate {
    (entity as unknown as { id: string }).id = id;
    return entity;
  }
}
