export type RecurrenceOptions = {
  startDate: unknown;
  frequency: unknown;
  repeatEvery: unknown;
  endDate: unknown;
};

export type EventBuilderContext = {
  expandRecurrence: (options: RecurrenceOptions) => Date[];
  frequencies: { DAILY: string };
  behaviorLabels: { Expense: string };
  buildSourceRuleId: (prefix: string, source: Record<string, unknown>, fallbackName: unknown) => string;
  getForecastWindow: () => { start: Date; end: Date };
};

export function buildSourceRuleId(
  prefix: string,
  source: Record<string, unknown> | null | undefined,
  fallbackName: unknown
): string {
  const explicit = source?.ruleId ? String(source.ruleId).trim() : "";
  if (explicit) {
    return explicit;
  }
  const name = fallbackName ? String(fallbackName).trim() : "";
  if (!name) {
    return `${prefix}:UNKNOWN`;
  }
  return `${prefix}:${name.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
}

export function buildIncomeEvents(
  incomeRules: Array<Record<string, unknown> | null | undefined>,
  ctx: EventBuilderContext
): Array<Record<string, unknown>> {
  return (incomeRules || []).flatMap((rule) => {
    if (!rule || !rule.paidTo) {
      return [];
    }
    const dates = ctx.expandRecurrence({
      startDate: rule.startDate,
      frequency: rule.frequency,
      repeatEvery: rule.repeatEvery,
      endDate: rule.endDate,
    });
    return dates.map((date) => ({
      date,
      scenarioId: rule.scenarioId,
      kind: "Income",
      sourceRuleId: ctx.buildSourceRuleId("INC", rule, rule.name),
      behavior: rule.type || "Income",
      name: rule.name,
      category: null,
      from: null,
      to: rule.paidTo,
      amount: rule.amount,
    }));
  });
}

export function buildExpenseEvents(
  expenseRules: Array<Record<string, unknown> | null | undefined>,
  ctx: EventBuilderContext
): Array<Record<string, unknown>> {
  return (expenseRules || []).flatMap((rule) => {
    if (!rule || !rule.paidFrom) {
      return [];
    }
    const dates = ctx.expandRecurrence({
      startDate: rule.startDate,
      frequency: rule.frequency,
      repeatEvery: rule.repeatEvery,
      endDate: rule.endDate,
    });
    return dates.map((date) => {
      const expenseNameParts: string[] = [];
      if (rule.type) {
        expenseNameParts.push(String(rule.type));
      }
      if (rule.name) {
        expenseNameParts.push(String(rule.name));
      }
      const expenseName = expenseNameParts.join(" - ");
      return {
        date,
        scenarioId: rule.scenarioId,
        kind: "Expense",
        sourceRuleId: ctx.buildSourceRuleId("EXP", rule, expenseName),
        behavior: rule.type || ctx.behaviorLabels.Expense,
        name: expenseName,
        category: rule.type,
        from: rule.paidFrom,
        to: "External",
        amount: rule.amount,
      };
    });
  });
}

export function buildTransferEvents(
  transferRules: Array<Record<string, unknown> | null | undefined>,
  ctx: EventBuilderContext
): Array<Record<string, unknown>> {
  return (transferRules || []).flatMap((rule) => {
    if (!rule || !rule.paidFrom || !rule.paidTo) {
      return [];
    }
    const dates = ctx.expandRecurrence({
      startDate: rule.startDate,
      frequency: rule.frequency,
      repeatEvery: rule.repeatEvery,
      endDate: rule.endDate,
    });
    return dates.map((date) => ({
      date,
      scenarioId: rule.scenarioId,
      kind: "Transfer",
      sourceRuleId: ctx.buildSourceRuleId("TRN", rule, rule.name),
      behavior: rule.type || rule.behavior,
      transferBehavior: rule.type || rule.behavior,
      name: rule.name,
      category: null,
      from: rule.paidFrom,
      to: rule.paidTo,
      amount: rule.amount,
    }));
  });
}

export function buildInterestEvents(
  accounts: Array<Record<string, unknown> | null | undefined>,
  ctx: EventBuilderContext
): Array<Record<string, unknown>> {
  return (accounts || []).flatMap((account) => {
    if (!account) {
      return [];
    }
    if (!account.interestPostingFrequency || !account.interestRate) {
      return [];
    }
    const window = ctx.getForecastWindow();
    const startDate = account.interestPostingStartDate || window.start;
    const endDate = null;

    const postingDates = ctx.expandRecurrence({
      startDate,
      frequency: account.interestPostingFrequency,
      repeatEvery: account.interestPostingRepeatEvery,
      endDate,
    });
    if (!postingDates.length) {
      return [];
    }

    const accrualDates = ctx.expandRecurrence({
      startDate,
      frequency: ctx.frequencies.DAILY,
      repeatEvery: 1,
      endDate,
    });

    const accrualEvents = accrualDates.map((date) => ({
      date,
      scenarioId: account.scenarioId,
      kind: "Interest",
      sourceRuleId: ctx.buildSourceRuleId("INT", account, account.name),
      behavior: "Interest Accrual",
      name: "Interest Accrual",
      account: account.name,
      rate: account.interestRate,
      method: account.interestMethod,
      interestAccrual: true,
      skipJournal: true,
    }));

    const postingEvents = postingDates.map((date) => ({
      date,
      scenarioId: account.scenarioId,
      kind: "Interest",
      sourceRuleId: ctx.buildSourceRuleId("INT", account, account.name),
      behavior: "Interest",
      name: "Interest",
      account: account.name,
      rate: account.interestRate,
      monthlyFee: account.interestMonthlyFee,
      method: account.interestMethod,
      frequency: account.interestPostingFrequency,
      repeatEvery: account.interestPostingRepeatEvery,
    }));

    return accrualEvents.concat(postingEvents);
  });
}
