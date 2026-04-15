import { v4 as uuidv4 } from 'uuid';
import { ISavedSearchRepository } from '../../domain/repositories/ISavedSearchRepository';
import { SavedSearch } from '../../domain/entities/SavedSearch';
import { SearchQuery } from '../../domain/types/SearchTypes';
import { Result } from '../../shared/Result';

export interface SaveSearchInput {
  userId: string;
  organizationId: string;
  name: string;
  query: Partial<SearchQuery>;
}

export class SaveSearchUseCase {
  constructor(private readonly savedSearchRepository: ISavedSearchRepository) {}

  public async execute(input: SaveSearchInput): Promise<Result<SavedSearch>> {
    try {
      const savedSearch = new SavedSearch({
        id: uuidv4(),
        userId: input.userId,
        organizationId: input.organizationId,
        name: input.name,
        query: input.query,
        createdAt: new Date(),
      });

      const saved = await this.savedSearchRepository.save(savedSearch);
      
      return {
        success: true,
        data: saved,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save search',
        code: 'SAVE_SEARCH_FAILED',
      };
    }
  }
}
