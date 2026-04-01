export function mapGoalReaderRows(
  rows: Array<Record<string, unknown>>,
  ctx: {
    toBoolean: (value: unknown) => boolean;
    normalizeScenario: (value: unknown) => string;
    getTagValue: (row: Record<string, unknown>) => unknown;
    toNumber: (value: unknown) => number | null;
    toDate: (value: unknown) => Date | null;
    toPositiveInt: (value: unknown) => number | null;
  },
): Array<Record<string, unknown>> {
  return (rows || [])
    .filter((row) => row && ctx.toBoolean(row["Include"]))
    .map((row) => {
      const scenarioId = ctx.normalizeScenario(ctx.getTagValue(row));
      return {
        ruleId: row["Rule ID"],
        name: row["Goal Name"],
        scenarioId,
        targetAmount: ctx.toNumber(row["Target Amount"]),
        targetDate: ctx.toDate(row["Target Date"]),
        priority: ctx.toPositiveInt(row["Priority"]) || 100,
        fundingAccount: row["Funding Account"],
        fundingPolicy: row["Funding Policy"],
        amountPerMonth: ctx.toNumber(row["Amount Per Month"]),
        percentOfInflow: ctx.toNumber(row["Percent Of Inflow"]),
        notes: row["Notes"],
      };
    });
}
