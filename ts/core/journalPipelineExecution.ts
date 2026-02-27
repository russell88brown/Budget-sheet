import type { JournalArtifacts } from "./journalBuild";

export type JournalPipelineExecutionContext = {
  buildRunModelWithExtensions: (scenarioId: string) => any;
  refreshAccountSummariesForRunModel: (runModel: any) => void;
  buildJournalArtifactsForRunModel: (runModel: any) => JournalArtifacts;
};

export type JournalPipelineExecutionResult = {
  runModel: any;
  journalData: JournalArtifacts;
};

export function executeJournalPipelineCore(
  scenarioId: string,
  runModel: any,
  refreshSummaries: boolean,
  ctx: JournalPipelineExecutionContext
): JournalPipelineExecutionResult {
  const activeRunModel = runModel || ctx.buildRunModelWithExtensions(scenarioId);
  if (refreshSummaries) {
    ctx.refreshAccountSummariesForRunModel(activeRunModel);
  }
  const journalData = ctx.buildJournalArtifactsForRunModel(activeRunModel);
  return { runModel: activeRunModel, journalData };
}
