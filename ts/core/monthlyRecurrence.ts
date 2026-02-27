export type MonthlyRecurrenceContext = {
  toDate: (value: unknown) => Date | null;
  normalizeDate: (value: unknown) => Date;
  periodsPerYear: (frequency: unknown, repeatEvery: unknown) => number;
};

export function isRecurringForMonthlyAverage(
  rule: Record<string, unknown> | null | undefined,
  ctx: MonthlyRecurrenceContext
): boolean {
  if (rule && rule.isSingleOccurrence) {
    return false;
  }
  const start = ctx.toDate(rule ? rule.startDate : null);
  const end = ctx.toDate(rule ? rule.endDate : null);
  if (!start || !end) {
    return true;
  }
  return ctx.normalizeDate(start).getTime() !== ctx.normalizeDate(end).getTime();
}

export function monthlyFactorForRecurrence(
  frequency: unknown,
  repeatEvery: unknown,
  periodsPerYear: (frequency: unknown, repeatEvery: unknown) => number
): number {
  const periods = periodsPerYear(frequency, repeatEvery);
  if (!periods) {
    return 0;
  }
  return periods / 12;
}
