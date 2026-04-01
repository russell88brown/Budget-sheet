export type DisableUnknownScenarioRowsResult = {
  rows: any[][];
  disabledCount: number;
  updated: boolean;
};

export function disableUnknownScenarioRows(
  sourceRows: unknown[][],
  includeIdx: number,
  scenarioIdx: number,
  validScenarios: Record<string, boolean>,
  toBoolean: (value: unknown) => boolean,
  resolveScenarioId: (value: unknown) => string,
): DisableUnknownScenarioRowsResult {
  const rows = sourceRows.map((row) => row.slice()) as any[][];
  let disabledCount = 0;
  let updated = false;

  rows.forEach((row) => {
    if (!toBoolean(row[includeIdx])) {
      return;
    }
    const scenarioId = resolveScenarioId(row[scenarioIdx]);
    if (!validScenarios[scenarioId]) {
      row[includeIdx] = false;
      updated = true;
      disabledCount += 1;
    }
  });

  return { rows, disabledCount, updated };
}
