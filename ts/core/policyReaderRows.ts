export function mapPolicyReaderRows(
  rows: Array<Record<string, unknown>>,
  ctx: {
    toBoolean: (value: unknown) => boolean;
    normalizeScenario: (value: unknown) => string;
    getTagValue: (row: Record<string, unknown>) => unknown;
    normalizePolicyType: (value: unknown) => unknown;
    toPositiveInt: (value: unknown) => number | null;
    toDate: (value: unknown) => Date | null;
    toNumber: (value: unknown) => number | null;
  },
): Array<Record<string, unknown>> {
  return (rows || [])
    .filter((row) => row && ctx.toBoolean(row["Include"]))
    .map((row) => {
      const scenarioId = ctx.normalizeScenario(ctx.getTagValue(row));
      return {
        ruleId: row["Rule ID"],
        type: ctx.normalizePolicyType(row["Policy Type"]),
        name: row["Name"],
        scenarioId,
        priority: ctx.toPositiveInt(row["Priority"]) || 100,
        startDate: ctx.toDate(row["Start Date"]),
        endDate: ctx.toDate(row["End Date"]),
        triggerAccount: row["Trigger Account"],
        fundingAccount: row["Funding Account"],
        threshold: ctx.toNumber(row["Threshold"]) || 0,
        maxPerEvent: ctx.toNumber(row["Max Per Event"]),
        notes: row["Notes"],
      };
    });
}
