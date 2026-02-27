export function resolveJournalScenarioId(
  scenarioId: unknown,
  normalizeTag: (value: unknown) => string
): string {
  return normalizeTag(scenarioId);
}

export function shouldUseEngineDirect(
  ids: string[],
  hasEngineRunJournalForScenario: boolean
): boolean {
  return Array.isArray(ids) && ids.length === 1 && hasEngineRunJournalForScenario;
}
