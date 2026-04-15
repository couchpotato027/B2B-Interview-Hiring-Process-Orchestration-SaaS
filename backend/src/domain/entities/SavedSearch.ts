import { SearchQuery } from '../types/SearchTypes';

export interface SavedSearchProps {
  id: string;
  userId: string;
  organizationId: string;
  name: string;
  query: Partial<SearchQuery>;
  createdAt: Date;
}

export class SavedSearch {
  private readonly id: string;
  private readonly userId: string;
  private readonly organizationId: string;
  private name: string;
  private readonly query: Partial<SearchQuery>;
  private readonly createdAt: Date;

  constructor(props: SavedSearchProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.organizationId = props.organizationId;
    this.name = props.name;
    this.query = props.query;
    this.createdAt = props.createdAt || new Date();
  }

  public getId(): string {
    return this.id;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getOrganizationId(): string {
    return this.organizationId;
  }

  public getName(): string {
    return this.name;
  }

  public getQuery(): Partial<SearchQuery> {
    return { ...this.query };
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public rename(newName: string): void {
    if (!newName.trim()) {
      throw new Error('Saved search name cannot be empty.');
    }
    this.name = newName;
  }
}
