export interface IRepository<T> {
  findById(id: string, organizationId: string): Promise<T | null>;
  findAll(organizationId: string): Promise<T[]>;
  save(entity: T): Promise<T>;
  update(id: string, entity: T, organizationId: string): Promise<T>;
  delete(id: string, organizationId: string): Promise<void>;
}
