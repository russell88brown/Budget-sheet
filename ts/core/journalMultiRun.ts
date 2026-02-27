import type { JournalArtifact } from "./journalAssembly";

export type MultiRunContext = {
  buildRunModelForId: (scenarioId: string) => any;
  buildJournalArtifactsForRunModel: (runModel: any) => JournalArtifact;
  mergeJournalArtifacts: (
    artifacts: JournalArtifact[],
    baseColumnCount: number
  ) => { combinedRows: unknown[][]; forecastAccounts: string[]; accountTypes: Record<string, string> };
};

export type MultiRunPayload = {
  artifacts: JournalArtifact[];
  combinedRows: unknown[][];
  forecastAccounts: string[];
  accountTypes: Record<string, string>;
};

export function buildMultiRunJournalPayload(
  scenarioIds: string[],
  baseColumnCount: number,
  ctx: MultiRunContext
): MultiRunPayload {
  const artifacts = (scenarioIds || []).map((scenarioId) => {
    const runModel = ctx.buildRunModelForId(scenarioId);
    return ctx.buildJournalArtifactsForRunModel(runModel) || { rows: [], forecastAccounts: [], accountTypes: {} };
  });

  const merged = ctx.mergeJournalArtifacts(artifacts, baseColumnCount);
  return {
    artifacts,
    combinedRows: merged.combinedRows || [],
    forecastAccounts: merged.forecastAccounts || [],
    accountTypes: merged.accountTypes || {},
  };
}
