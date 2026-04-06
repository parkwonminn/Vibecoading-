export interface StorageAdapter<T> {
  save(record: T): Promise<void>;
  loadAll(): Promise<T[]>;
  deleteById(id: string): Promise<void>;
}
