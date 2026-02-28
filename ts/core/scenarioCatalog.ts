export function buildScenarioCatalog(
  values: unknown[][],
  normalizeScenarioId: (value: unknown) => string,
  defaultScenarioId: string,
): string[] {
  const unique: Record<string, boolean> = {};
  (Array.isArray(values) ? values : []).forEach((row) => {
    const cell = Array.isArray(row) ? row[0] : undefined;
    const scenarioId = normalizeScenarioId(cell);
    if (scenarioId) {
      unique[scenarioId] = true;
    }
  });
  unique[defaultScenarioId] = true;
  return Object.keys(unique);
}
