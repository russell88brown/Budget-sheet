export function normalizeJournalRunIds(
  scenarioIds: unknown,
  defaultTag: string,
  normalizeTag: (value: unknown) => string
): string[] {
  let ids = Array.isArray(scenarioIds) ? scenarioIds : [scenarioIds];
  ids = ids
    .map((value) => normalizeTag(value))
    .filter((value, idx, arr) => !!value && arr.indexOf(value) === idx);
  if (!ids.length) {
    return [defaultTag];
  }
  return ids as string[];
}

export function getJournalBaseColumnCount(
  outputs: unknown,
  journalSheetName: string,
  fallbackCount: number
): number {
  if (!Array.isArray(outputs)) {
    return fallbackCount;
  }
  const journalSpec = outputs.filter((spec: any) => spec && spec.name === journalSheetName)[0];
  if (journalSpec && Array.isArray(journalSpec.columns) && journalSpec.columns.length) {
    return journalSpec.columns.length;
  }
  return fallbackCount;
}
