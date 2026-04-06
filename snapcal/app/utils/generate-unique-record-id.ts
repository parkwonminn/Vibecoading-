export function generateUniqueRecordId(): string {
  return `record_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
