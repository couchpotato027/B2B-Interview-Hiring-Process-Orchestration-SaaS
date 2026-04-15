import { SavedSearch } from '../../domain/entities/SavedSearch';
import { ISavedSearchRepository } from '../../domain/repositories/ISavedSearchRepository';

export class InMemorySavedSearchRepository implements ISavedSearchRepository {
  private readonly store = new Map<string, SavedSearch>();

  public async findById(id: string, organizationId: string): Promise<SavedSearch | null> {
    const savedSearch = this.store.get(id);
    if (savedSearch && savedSearch.getOrganizationId() === organizationId) {
      return savedSearch;
    }
    return null;
  }

  public async findByUserId(userId: string, organizationId: string): Promise<SavedSearch[]> {
    return Array.from(this.store.values()).filter(
      (s) => s.getUserId() === userId && s.getOrganizationId() === organizationId
    );
  }

  public async save(savedSearch: SavedSearch): Promise<SavedSearch> {
    this.store.set(savedSearch.getId(), savedSearch);
    return savedSearch;
  }

  public async delete(id: string, organizationId: string): Promise<void> {
    const existing = this.store.get(id);
    if (existing && existing.getOrganizationId() === organizationId) {
      this.store.delete(id);
    }
  }
}
