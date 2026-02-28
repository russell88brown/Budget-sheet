export type NormalizeScenario = (value: unknown) => string;

export type CoreRunModel = {
  scenarioId: string;
  accounts: any[];
  incomeRules: any[];
  transferRules: any[];
  expenseRules: any[];
};

export type CoreRunModelWithExtensions = CoreRunModel & {
  policies: any[];
  goals: any[];
};

export type RunModelSources = {
  accounts: any[];
  incomeRules: any[];
  transferRules: any[];
  expenseRules: any[];
  policies: any[];
  goals: any[];
};

export function filterScenarioRowsForModel(
  rows: unknown,
  scenarioId: unknown,
  normalizeScenario: NormalizeScenario,
  defaultScenarioId: string,
): any[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }
  const activeScenarioId = normalizeScenario(scenarioId);
  return rows.filter((row) => {
    const rowScenarioId =
      row && typeof row === "object" ? normalizeScenario((row as { scenarioId?: unknown }).scenarioId) : defaultScenarioId;
    return rowScenarioId === activeScenarioId;
  });
}

export function buildRunModel(
  scenarioId: unknown,
  sources: RunModelSources,
  normalizeScenario: NormalizeScenario,
  defaultScenarioId: string,
): CoreRunModel {
  const activeScenarioId = normalizeScenario(scenarioId);
  const accounts = filterScenarioRowsForModel(sources.accounts, activeScenarioId, normalizeScenario, defaultScenarioId).filter(
    (account) => account && account.name,
  );

  return {
    scenarioId: activeScenarioId,
    accounts,
    incomeRules: filterScenarioRowsForModel(sources.incomeRules, activeScenarioId, normalizeScenario, defaultScenarioId),
    transferRules: filterScenarioRowsForModel(sources.transferRules, activeScenarioId, normalizeScenario, defaultScenarioId),
    expenseRules: filterScenarioRowsForModel(sources.expenseRules, activeScenarioId, normalizeScenario, defaultScenarioId),
  };
}

export function buildRunModelWithExtensions(
  scenarioId: unknown,
  sources: RunModelSources,
  normalizeScenario: NormalizeScenario,
  defaultScenarioId: string,
): CoreRunModelWithExtensions {
  const core = buildRunModel(scenarioId, sources, normalizeScenario, defaultScenarioId);
  return {
    ...core,
    policies: filterScenarioRowsForModel(sources.policies, core.scenarioId, normalizeScenario, defaultScenarioId),
    goals: filterScenarioRowsForModel(sources.goals, core.scenarioId, normalizeScenario, defaultScenarioId),
  };
}
