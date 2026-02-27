export function mapIncomeReaderRows(
  rows: Array<Record<string, unknown>>,
  ctx: {
    toBoolean: (value: unknown) => boolean;
    normalizeScenario: (value: unknown) => string;
    getTagValue: (row: Record<string, unknown>) => unknown;
    normalizeRecurrence: (
      frequencyValue: unknown,
      repeatEveryValue: unknown,
      startDateValue: unknown,
      endDateValue: unknown,
    ) => {
      frequency: unknown;
      repeatEvery: unknown;
      isSingleOccurrence: unknown;
      startDate: unknown;
      endDate: unknown;
    };
    toNumber: (value: unknown) => number | null;
  },
): Array<Record<string, unknown>> {
  return (rows || [])
    .filter((row) => row && ctx.toBoolean(row["Include"]))
    .map((row) => {
      const recurrence = ctx.normalizeRecurrence(
        row["Frequency"],
        row["Repeat Every"],
        row["Start Date"],
        row["End Date"],
      );
      const scenarioId = ctx.normalizeScenario(ctx.getTagValue(row));
      return {
        ruleId: row["Rule ID"],
        scenarioId,
        type: row["Type"],
        name: row["Name"],
        amount: ctx.toNumber(row["Amount"]),
        frequency: recurrence.frequency,
        repeatEvery: recurrence.repeatEvery,
        isSingleOccurrence: recurrence.isSingleOccurrence,
        startDate: recurrence.startDate,
        endDate: recurrence.endDate,
        paidTo: row["To Account"],
        notes: row["Notes"],
      };
    });
}
