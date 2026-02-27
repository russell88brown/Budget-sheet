export type TransferMonthlyWorksheetResult = {
  out: Array<[unknown]>;
  credits: Record<string, number>;
  debits: Record<string, number>;
};

export function computeTransferMonthlyWorksheet(
  rows: unknown[][],
  indexes: {
    include: number;
    scenario: number;
    type: number;
    amount: number;
    frequency: number;
    repeat: number;
    start: number;
    end: number;
    from: number;
    to: number;
    total: number;
  },
  params: {
    activeScenarioId: string;
    defaultScenarioId: string;
    normalizeScenarioId: (value: unknown) => string;
    toBoolean: (value: unknown) => boolean;
    toNumber: (value: unknown) => number | null;
    normalizeRecurrence: (
      frequencyValue: unknown,
      repeatEveryValue: unknown,
      startDateValue: unknown,
      endDateValue: unknown,
    ) => { frequency: unknown; repeatEvery: unknown; startDate: unknown; endDate: unknown; isSingleOccurrence: boolean };
    isRecurringForMonthlyAverage: (rule: {
      startDate: unknown;
      endDate: unknown;
      isSingleOccurrence: boolean;
    }) => boolean;
    normalizeAccountLookupKey: (value: unknown) => string;
    normalizeTransferType: (value: unknown, amount: number | null) => string;
    shouldCalculateTransferMonthlyTotal: (
      include: boolean,
      recurring: boolean,
      recurrence: any,
      fromKey: string,
      toKey: string,
      behavior: string,
      amount: number | null,
    ) => boolean;
    monthlyFactorForRecurrence: (frequency: unknown, repeatEvery: unknown) => number;
    resolveTransferMonthlyTotal: (
      behavior: string,
      amount: number | null,
      factor: number,
      accountBalances: Record<string, number>,
      toKey: string,
    ) => number | null;
    roundMoney: (value: number) => number;
    accountBalances: Record<string, number>;
    incomeTotalsByAccount: Record<string, number>;
    expenseTotalsByAccount: Record<string, number>;
    transferEverythingExceptType: string;
  },
): TransferMonthlyWorksheetResult {
  const out: Array<[unknown]> = rows.map((row) => [row[indexes.total]]);
  const credits: Record<string, number> = {};
  const debits: Record<string, number> = {};
  const everythingExceptRows: Array<{ rowIndex: number; fromKey: string; toKey: string; keepAmount: number }> = [];

  rows.forEach((row, rowIndex) => {
    const rowScenarioId =
      indexes.scenario === -1
        ? params.defaultScenarioId
        : params.normalizeScenarioId(row[indexes.scenario]);
    if (rowScenarioId !== params.activeScenarioId) {
      return;
    }

    const include = params.toBoolean(row[indexes.include]);
    const amount = params.toNumber(row[indexes.amount]);
    const recurrence = params.normalizeRecurrence(
      row[indexes.frequency],
      row[indexes.repeat],
      indexes.start === -1 ? null : row[indexes.start],
      indexes.end === -1 ? null : row[indexes.end],
    );
    const recurring = params.isRecurringForMonthlyAverage({
      startDate: recurrence.startDate,
      endDate: recurrence.endDate,
      isSingleOccurrence: recurrence.isSingleOccurrence,
    });

    const fromKey = params.normalizeAccountLookupKey(row[indexes.from]);
    const toKey = params.normalizeAccountLookupKey(row[indexes.to]);
    let monthlyTotal: number | null = null;
    const behavior = params.normalizeTransferType(row[indexes.type], amount);
    if (
      params.shouldCalculateTransferMonthlyTotal(
        include,
        recurring,
        recurrence,
        fromKey,
        toKey,
        behavior,
        amount,
      )
    ) {
      const factor = params.monthlyFactorForRecurrence(recurrence.frequency, recurrence.repeatEvery);
      if (factor > 0) {
        if (behavior === params.transferEverythingExceptType) {
          everythingExceptRows.push({
            rowIndex,
            fromKey,
            toKey,
            keepAmount: amount || 0,
          });
        } else {
          monthlyTotal = params.resolveTransferMonthlyTotal(
            behavior,
            amount,
            factor,
            params.accountBalances,
            toKey,
          );
        }
      }
    }

    if (monthlyTotal !== null && monthlyTotal > 0) {
      debits[fromKey] = params.roundMoney((debits[fromKey] || 0) + monthlyTotal);
      credits[toKey] = params.roundMoney((credits[toKey] || 0) + monthlyTotal);
      out[rowIndex] = [monthlyTotal];
      return;
    }
    out[rowIndex] = [""];
  });

  everythingExceptRows.forEach((item) => {
    const sourceBalance = params.accountBalances[item.fromKey] || 0;
    const sourceIncome = params.incomeTotalsByAccount[item.fromKey] || 0;
    const sourceExpense = params.expenseTotalsByAccount[item.fromKey] || 0;
    const baseIn = params.roundMoney(sourceIncome + (credits[item.fromKey] || 0));
    const baseOut = params.roundMoney(sourceExpense + (debits[item.fromKey] || 0));
    const monthlySweep = params.roundMoney(
      Math.max(0, sourceBalance + baseIn - baseOut - item.keepAmount),
    );
    if (monthlySweep > 0) {
      debits[item.fromKey] = params.roundMoney((debits[item.fromKey] || 0) + monthlySweep);
      credits[item.toKey] = params.roundMoney((credits[item.toKey] || 0) + monthlySweep);
      out[item.rowIndex] = [monthlySweep];
      return;
    }
    out[item.rowIndex] = [""];
  });

  return { out, credits, debits };
}
