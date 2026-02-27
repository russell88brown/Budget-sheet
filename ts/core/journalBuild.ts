export type JournalBuildContext = {
  resolveScenarioId: (scenarioId: unknown) => string;
  assertUniqueScenarioAccountNames: (scenarioId: string, accounts: any[]) => void;
  buildAccountTypeMap: (accounts: any[]) => Record<string, string>;
  buildRunExtensions: (runModel: any) => { policies?: any[] } | null | undefined;
  buildSortedEvents: (runModel: any) => any[];
  applyEventsToJournal: (options: {
    accounts: any[];
    events: any[];
    policies: any[];
    scenarioId: string;
  }) => { rows?: unknown[][]; forecastAccounts?: string[] } | null | undefined;
};

export type JournalArtifacts = {
  rows: unknown[][];
  forecastAccounts: string[];
  accountTypes: Record<string, string>;
  scenarioId: string;
};

export function buildJournalArtifactsForRunModel(
  runModel: any,
  ctx: JournalBuildContext
): JournalArtifacts {
  const model = runModel || {};
  const activeScenarioId = ctx.resolveScenarioId(model.scenarioId);
  const accounts = model.accounts || [];
  ctx.assertUniqueScenarioAccountNames(activeScenarioId, accounts);
  const accountTypes = ctx.buildAccountTypeMap(accounts) || {};
  const runExtensions = ctx.buildRunExtensions(model) || {};
  const policies = runExtensions.policies || [];
  const events = ctx.buildSortedEvents(model) || [];
  const journalData =
    ctx.applyEventsToJournal({
      accounts,
      events,
      policies,
      scenarioId: activeScenarioId,
    }) || {};

  return {
    rows: journalData.rows || [],
    forecastAccounts: journalData.forecastAccounts || [],
    accountTypes,
    scenarioId: activeScenarioId,
  };
}
