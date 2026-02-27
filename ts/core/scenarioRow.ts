export function isRowInActiveScenario(
  row: unknown[],
  scenarioIdx: number,
  activeScenarioId: string,
  defaultScenarioId: string,
  normalizeScenarioId: (value: unknown) => string,
): boolean {
  const rowScenarioId =
    scenarioIdx === -1 ? defaultScenarioId : normalizeScenarioId(row[scenarioIdx]);
  return rowScenarioId === activeScenarioId;
}
