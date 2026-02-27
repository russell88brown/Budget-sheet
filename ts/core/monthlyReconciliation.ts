export type ReconciliationDaily = {
  rows: unknown[][];
  accountNames?: string[];
  includeScenarioColumn?: boolean;
};

export type ReconciliationMonthly = {
  rows: unknown[][];
  includeScenarioColumn?: boolean;
};

type ReconcileContext = {
  normalizeDate: (value: unknown) => Date;
  normalizeTag: (value: unknown) => string;
  valuesWithinTolerance: (left: unknown, right: unknown) => boolean;
};

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function reconcileMonthlyWithDaily(
  monthly: ReconciliationMonthly,
  daily: ReconciliationDaily,
  ctx: ReconcileContext
): string | null {
  if (!monthly || !monthly.rows || !monthly.rows.length) {
    return "Monthly summary has no rows for selected tag set.";
  }
  if (!daily || !daily.rows || !daily.rows.length) {
    return "Monthly reconciliation failed: Daily summary has no rows.";
  }

  const includeScenarioColumn = daily.includeScenarioColumn === true;
  const dailyScenarioIndex = includeScenarioColumn ? 1 : -1;
  const dailyCashIndex = includeScenarioColumn ? 2 : 1;
  const dailyDebtIndex = includeScenarioColumn ? 3 : 2;
  const dailyNetIndex = includeScenarioColumn ? 4 : 3;
  const dailyAccountStart = includeScenarioColumn ? 5 : 4;
  const monthlyScenarioIndex = monthly.includeScenarioColumn === true ? 1 : -1;
  const monthlyCashIndex = monthlyScenarioIndex !== -1 ? 2 : 1;
  const monthlyDebtIndex = monthlyScenarioIndex !== -1 ? 3 : 2;
  const monthlyNetIndex = monthlyScenarioIndex !== -1 ? 4 : 3;
  const monthlyAccountStart = monthlyScenarioIndex !== -1 ? 5 : 4;

  const dailyByMonth: Record<string, unknown[][]> = {};
  daily.rows.forEach((row) => {
    const date = ctx.normalizeDate(row[0]);
    const baseMonthKey = monthKey(date);
    const scenarioPart =
      dailyScenarioIndex === -1 ? "" : ctx.normalizeTag(row[dailyScenarioIndex]);
    const key = dailyScenarioIndex === -1 ? baseMonthKey : `${scenarioPart}|${baseMonthKey}`;
    if (!dailyByMonth[key]) {
      dailyByMonth[key] = [];
    }
    dailyByMonth[key].push(row);
  });

  const monthlyByMonth: Record<string, unknown[]> = {};
  monthly.rows.forEach((row) => {
    const monthDate = ctx.normalizeDate(row[0]);
    const baseMonthKey = monthKey(monthDate);
    const scenarioPart =
      monthlyScenarioIndex === -1 ? "" : ctx.normalizeTag(row[monthlyScenarioIndex]);
    const key =
      monthlyScenarioIndex === -1 ? baseMonthKey : `${scenarioPart}|${baseMonthKey}`;
    monthlyByMonth[key] = row;
  });

  const monthKeys = Object.keys(dailyByMonth).sort();
  if (monthKeys.length !== Object.keys(monthlyByMonth).length) {
    return "Monthly reconciliation failed: month row count does not match Daily.";
  }

  for (const key of monthKeys) {
    const monthRows = dailyByMonth[key];
    const monthRow = monthlyByMonth[key];
    if (!monthRow) {
      return `Monthly reconciliation failed: missing month row for ${key}.`;
    }
    const first = monthRows[0];
    const last = monthRows[monthRows.length - 1];

    if (!ctx.valuesWithinTolerance(monthRow[monthlyCashIndex], last[dailyCashIndex])) {
      return `Monthly reconciliation failed: Total Cash mismatch for ${key}.`;
    }
    if (!ctx.valuesWithinTolerance(monthRow[monthlyDebtIndex], last[dailyDebtIndex])) {
      return `Monthly reconciliation failed: Total Debt mismatch for ${key}.`;
    }
    if (!ctx.valuesWithinTolerance(monthRow[monthlyNetIndex], last[dailyNetIndex])) {
      return `Monthly reconciliation failed: Net Position mismatch for ${key}.`;
    }

    const accountCount = (daily.accountNames || []).length;
    for (let i = 0; i < accountCount; i += 1) {
      const dailyIndex = dailyAccountStart + i;
      const monthlyIndex = monthlyAccountStart + i * 4;
      const startValue = typeof first[dailyIndex] === "number" ? (first[dailyIndex] as number) : 0;
      const endValue = typeof last[dailyIndex] === "number" ? (last[dailyIndex] as number) : 0;
      let minValue = startValue;
      let maxValue = startValue;

      monthRows.forEach((dayRow) => {
        const value = typeof dayRow[dailyIndex] === "number" ? (dayRow[dailyIndex] as number) : 0;
        if (value < minValue) minValue = value;
        if (value > maxValue) maxValue = value;
      });

      if (!ctx.valuesWithinTolerance(monthRow[monthlyIndex], minValue)) {
        return `Monthly reconciliation failed: Min mismatch for ${key}.`;
      }
      if (!ctx.valuesWithinTolerance(monthRow[monthlyIndex + 1], maxValue)) {
        return `Monthly reconciliation failed: Max mismatch for ${key}.`;
      }
      if (!ctx.valuesWithinTolerance(monthRow[monthlyIndex + 2], endValue - startValue)) {
        return `Monthly reconciliation failed: Net Change mismatch for ${key}.`;
      }
      if (!ctx.valuesWithinTolerance(monthRow[monthlyIndex + 3], endValue)) {
        return `Monthly reconciliation failed: Ending mismatch for ${key}.`;
      }
    }
  }

  return null;
}
