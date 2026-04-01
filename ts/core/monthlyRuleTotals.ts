export function buildIncomeMonthlyTotals(
  incomeRules: Array<Record<string, any> | null | undefined>,
  ctx: {
    isRecurringForMonthlyAverage: (rule: Record<string, any>) => boolean;
    toNumber: (value: unknown) => number | null;
    monthlyFactorForRecurrence: (frequency: unknown, repeatEvery: unknown) => number;
    normalizeAccountLookupKey: (value: unknown) => string;
    roundMoney: (value: number) => number;
  },
): Record<string, number> {
  const totals: Record<string, number> = {};
  (incomeRules || []).forEach((rule) => {
    if (!rule || !rule.paidTo || !rule.frequency) {
      return;
    }
    if (!ctx.isRecurringForMonthlyAverage(rule)) {
      return;
    }
    const amount = ctx.toNumber(rule.amount);
    if (amount === null || amount < 0) {
      return;
    }
    const monthly = ctx.roundMoney(
      amount * ctx.monthlyFactorForRecurrence(rule.frequency, rule.repeatEvery),
    );
    const key = ctx.normalizeAccountLookupKey(rule.paidTo);
    totals[key] = ctx.roundMoney((totals[key] || 0) + monthly);
  });
  return totals;
}

export function buildExpenseMonthlyTotals(
  expenseRules: Array<Record<string, any> | null | undefined>,
  ctx: {
    isRecurringForMonthlyAverage: (rule: Record<string, any>) => boolean;
    toNumber: (value: unknown) => number | null;
    monthlyFactorForRecurrence: (frequency: unknown, repeatEvery: unknown) => number;
    normalizeAccountLookupKey: (value: unknown) => string;
    roundMoney: (value: number) => number;
  },
): Record<string, number> {
  const totals: Record<string, number> = {};
  (expenseRules || []).forEach((rule) => {
    if (!rule || !rule.paidFrom || !rule.frequency) {
      return;
    }
    if (!ctx.isRecurringForMonthlyAverage(rule)) {
      return;
    }
    const amount = ctx.toNumber(rule.amount);
    if (amount === null || amount < 0) {
      return;
    }
    const monthly = ctx.roundMoney(
      amount * ctx.monthlyFactorForRecurrence(rule.frequency, rule.repeatEvery),
    );
    const key = ctx.normalizeAccountLookupKey(rule.paidFrom);
    totals[key] = ctx.roundMoney((totals[key] || 0) + monthly);
  });
  return totals;
}
