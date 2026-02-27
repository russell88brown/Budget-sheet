export function mapAccountReaderRows(
  rows: Array<Record<string, unknown>>,
  ctx: {
    normalizeRecurrence: (
      frequencyValue: unknown,
      repeatEveryValue: unknown,
      startDateValue: unknown,
      endDateValue: unknown,
    ) => { frequency: unknown; repeatEvery: unknown; startDate: unknown };
    normalizeScenario: (value: unknown) => string;
    getTagValue: (row: Record<string, unknown>) => unknown;
    toNumber: (value: unknown) => number | null;
    toBoolean: (value: unknown) => boolean;
  },
): Array<Record<string, unknown>> {
  return (rows || [])
    .filter((row) => row && row["Account Name"])
    .map((row) => {
      const interestRecurrence = ctx.normalizeRecurrence(
        row["Interest Frequency"],
        row["Interest Repeat Every"],
        row["Interest Start Date"],
        null,
      );
      const scenarioId = ctx.normalizeScenario(ctx.getTagValue(row));
      return {
        name: row["Account Name"],
        balance: ctx.toNumber(row["Balance"]),
        type: row["Type"],
        forecast: ctx.toBoolean(row["Include"]),
        scenarioId,
        interestRate: ctx.toNumber(row["Interest Rate (APR %)"]),
        interestMonthlyFee: ctx.toNumber(row["Interest Fee / Month"]),
        interestMethod: row["Interest Method"],
        interestPostingFrequency: interestRecurrence.frequency,
        interestPostingRepeatEvery: interestRecurrence.repeatEvery,
        interestPostingStartDate: interestRecurrence.startDate,
      };
    });
}
