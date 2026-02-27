export function resolveJournalScenarioId(
  scenarioId: unknown,
  normalizeTag: (value: unknown) => string
): string {
  return normalizeTag(scenarioId);
}

export function buildJournalRowsRuntime(
  accounts: any[] | null | undefined,
  events: any[] | null | undefined,
  policies: any[] | null | undefined,
  scenarioId: unknown,
  defaultTag: string,
  applyEventsToJournal: (options: {
    accounts: any[];
    events: any[];
    policies: any[];
    scenarioId: string;
  }) => { rows?: unknown[][]; forecastAccounts?: string[] }
): { rows?: unknown[][]; forecastAccounts?: string[] } {
  return applyEventsToJournal({
    accounts: accounts || [],
    events: events || [],
    policies: policies || [],
    scenarioId: (scenarioId as string) || defaultTag,
  });
}

export function shouldUseEngineDirect(
  ids: string[],
  hasEngineRunJournalForScenario: boolean
): boolean {
  return Array.isArray(ids) && ids.length === 1 && hasEngineRunJournalForScenario;
}
