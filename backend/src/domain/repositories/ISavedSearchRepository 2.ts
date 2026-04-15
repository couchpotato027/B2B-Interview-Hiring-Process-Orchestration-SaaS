import { SavedSearch } from '../entities/SavedSearch';

export interface ISavedSearchRepository {
  findById(id: string, organizationId: string): Promise<SavedSearch | null>;
  findByUserId(userId: string, organizationId: string): Promise<SavedSearch[]>;
  save(savedSearch: SavedSearch): Promise<SavedSearch>;
  delete(id: string, organizationId: string): Promise<void>;
}
