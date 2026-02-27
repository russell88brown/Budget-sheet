import {
  assertAccountsShape,
  assertEventsShape,
  assertPoliciesShape,
  type BudgetAccount,
  type BudgetEvent,
  type BudgetPolicy,
} from "./contracts";

export type JournalBuildContext = {
  resolveScenarioId: (scenarioId: unknown) => string;
  assertUniqueScenarioAccountNames: (scenarioId: string, accounts: BudgetAccount[]) => void;
  buildAccountTypeMap: (accounts: BudgetAccount[]) => Record<string, string>;
  buildRunExtensions: (runModel: any) => { policies?: any[] } | null | undefined;
  buildSortedEvents: (runModel: any) => BudgetEvent[];
  applyEventsToJournal: (options: {
    accounts: BudgetAccount[];
    events: BudgetEvent[];
    policies: BudgetPolicy[];
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
  const accounts = assertAccountsShape(model.accounts || []);
  ctx.assertUniqueScenarioAccountNames(activeScenarioId, accounts);
  const accountTypes = ctx.buildAccountTypeMap(accounts) || {};
  const runExtensions = ctx.buildRunExtensions(model) || {};
  const policies = assertPoliciesShape(runExtensions.policies || []);
  const events = assertEventsShape(ctx.buildSortedEvents(model) || []);
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
