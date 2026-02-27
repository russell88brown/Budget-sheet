export type JournalRowContext = {
  accountKey: (value: unknown) => string;
  roundMoney: (value: unknown) => number;
  buildAlerts: (cashNegative: boolean, creditPaidOff: boolean, explicitAlert: unknown) => string;
  deriveJournalTransactionType: (event: unknown) => string;
  buildForecastBalanceCells: (
    balances: Record<string, number>,
    forecastAccounts: string[]
  ) => number[];
  creditAccountType: string;
};

export function buildOpeningRows(
  accounts: Array<{ name?: unknown; balance?: unknown }> | null | undefined,
  date: Date,
  forecastAccounts: string[],
  balances: Record<string, number>,
  scenarioId: string,
  ctx: JournalRowContext
): unknown[][] {
  return (accounts || []).map((account) => {
    const balanceSnapshot = ctx.buildForecastBalanceCells(balances, forecastAccounts);
    return [
      new Date(date.getTime()),
      scenarioId,
      account?.name,
      "Opening",
      "Opening Balance",
      account?.balance || 0,
      "",
      "",
    ].concat(balanceSnapshot);
  });
}

export function buildJournalEventRows(
  event: any,
  balancesAfterFrom: Record<string, number>,
  balancesAfterTo: Record<string, number>,
  forecastAccounts: string[],
  accountTypesByKey: Record<string, string>,
  scenarioId: string,
  ctx: JournalRowContext
): unknown[][] {
  const balanceSnapshotFrom = ctx.buildForecastBalanceCells(balancesAfterFrom, forecastAccounts);
  const balanceSnapshotTo = ctx.buildForecastBalanceCells(balancesAfterTo, forecastAccounts);
  const transactionType = ctx.deriveJournalTransactionType(event);
  const amount = event.appliedAmount !== undefined ? event.appliedAmount : event.amount || 0;
  let signedAmount = amount;
  if (event.kind === "Expense" || (event.kind === "Transfer" && event.from)) {
    signedAmount = -amount;
  }

  if (event.kind === "Transfer") {
    const accounts = [event.from, event.to].filter((name) => name && name !== "External");
    return accounts.map((accountName) => {
      let rowAmount = signedAmount;
      if (accountName === event.to) {
        rowAmount = amount;
      }
      const snapshot = accountName === event.to ? balanceSnapshotTo : balanceSnapshotFrom;
      const balanceForRow = accountName === event.to ? balancesAfterTo : balancesAfterFrom;
      const accountKey = ctx.accountKey(accountName);
      const accountType = accountTypesByKey[accountKey];
      const cashNegative =
        accountType !== ctx.creditAccountType && (balanceForRow[accountKey] || 0) < 0;
      const creditPaidOff =
        accountType === ctx.creditAccountType &&
        Math.abs(ctx.roundMoney(balanceForRow[accountKey] || 0)) === 0 &&
        rowAmount > 0;
      return [
        event.date,
        scenarioId,
        accountName,
        transactionType,
        event.name,
        rowAmount,
        event.sourceRuleId || "",
        ctx.buildAlerts(cashNegative, creditPaidOff, event.alertTag),
      ].concat(snapshot);
    });
  }

  let accountName;
  if (event.kind === "Interest") {
    accountName = event.account;
  } else {
    accountName = event.kind === "Income" ? event.to : event.from;
  }
  const accountKey = ctx.accountKey(accountName);
  const accountType = accountTypesByKey[accountKey];
  const cashNegative = accountType !== ctx.creditAccountType && (balancesAfterTo[accountKey] || 0) < 0;
  const creditPaidOff =
    accountType === ctx.creditAccountType &&
    Math.abs(ctx.roundMoney(balancesAfterTo[accountKey] || 0)) === 0 &&
    signedAmount > 0;
  return [
    [
      event.date,
      scenarioId,
      accountName || "",
      transactionType,
      event.name,
      signedAmount,
      event.sourceRuleId || "",
      ctx.buildAlerts(cashNegative, creditPaidOff, event.alertTag),
    ].concat(balanceSnapshotTo),
  ];
}
