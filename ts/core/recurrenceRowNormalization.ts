export type NormalizeRecurrenceRowsResult = {
  rows: any[][];
  updated: boolean;
};

export type MappedRecurrence = {
  frequency: unknown;
  repeatEvery: unknown;
  endDate: unknown;
};

export function normalizeRecurrenceRows(
  sourceRows: unknown[][],
  frequencyIdx: number,
  repeatIdx: number,
  startIdx: number,
  endIdx: number,
  mapLegacyFrequency: (
    frequencyValue: unknown,
    repeatEveryValue: unknown,
    startDateValue: unknown,
    endDateValue: unknown,
  ) => MappedRecurrence,
): NormalizeRecurrenceRowsResult {
  const rows = sourceRows.map((row) => row.slice()) as any[][];
  let updated = false;

  rows.forEach((row) => {
    const mapped = mapLegacyFrequency(
      row[frequencyIdx],
      row[repeatIdx],
      startIdx === -1 ? null : row[startIdx],
      endIdx === -1 ? null : row[endIdx],
    );
    if (mapped.frequency !== row[frequencyIdx]) {
      row[frequencyIdx] = mapped.frequency;
      updated = true;
    }
    if (mapped.repeatEvery !== row[repeatIdx]) {
      row[repeatIdx] = mapped.repeatEvery;
      updated = true;
    }
    if (endIdx !== -1 && mapped.endDate !== row[endIdx]) {
      row[endIdx] = mapped.endDate;
      updated = true;
    }
  });

  return { rows, updated };
}
