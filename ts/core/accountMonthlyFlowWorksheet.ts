export type AccountMonthlyFlowWorksheetResult = {
  interestAvgValues: Array<[unknown]>;
  expenseAvgValues: Array<[unknown]>;
  incomeAvgValues: Array<[unknown]>;
  netFlowValues: Array<[unknown]>;
};

export function computeAccountMonthlyFlowWorksheet(
  rows: unknown[][],
  indexes: {
    name: number;
    scenario: number;
    interestAvg: number;
    expenseAvg: number;
    incomeAvg: number;
    netFlow: number;
  },
  params: {
    defaultScenarioId: string;
    activeScenarioId: string;
    normalizeScenarioId: (value: unknown) => string;
    normalizeAccountLookupKey: (value: unknown) => string;
    accountByKey: Record<string, any>;
    toNumber: (value: unknown) => number | null;
    computeEstimatedMonthlyInterest: (balance: number, ratePercent: number, method: string) => number;
    roundMoney: (value: number) => number;
    incomeTotalsByAccount: Record<string, number>;
    expenseTotalsByAccount: Record<string, number>;
    transferCredits: Record<string, number>;
    transferDebits: Record<string, number>;
  },
): AccountMonthlyFlowWorksheetResult {
  const interestAvgValues: Array<[unknown]> = [];
  const expenseAvgValues: Array<[unknown]> = [];
  const incomeAvgValues: Array<[unknown]> = [];
  const netFlowValues: Array<[unknown]> = [];

  rows.forEach((row) => {
    const existingInterest = indexes.interestAvg === -1 ? "" : row[indexes.interestAvg];
    const existingExpense = indexes.expenseAvg === -1 ? "" : row[indexes.expenseAvg];
    const existingIncome = indexes.incomeAvg === -1 ? "" : row[indexes.incomeAvg];
    const existingNet = indexes.netFlow === -1 ? "" : row[indexes.netFlow];
    const rowScenarioId =
      indexes.scenario === -1
        ? params.defaultScenarioId
        : params.normalizeScenarioId(row[indexes.scenario]);
    if (rowScenarioId !== params.activeScenarioId) {
      interestAvgValues.push([existingInterest]);
      expenseAvgValues.push([existingExpense]);
      incomeAvgValues.push([existingIncome]);
      netFlowValues.push([existingNet]);
      return;
    }

    const name = row[indexes.name];
    const key = params.normalizeAccountLookupKey(name);
    const account = params.accountByKey[key];
    if (!account || account.forecast !== true) {
      interestAvgValues.push([""]);
      expenseAvgValues.push([""]);
      incomeAvgValues.push([""]);
      netFlowValues.push([""]);
      return;
    }

    const rate = params.toNumber(account.interestRate);
    const balance = params.toNumber(account.balance);
    const frequency = account.interestPostingFrequency;
    const method = account.interestMethod || "";
    const fee = params.toNumber(account.interestMonthlyFee);

    let interest = 0;
    if (rate !== null && balance !== null && frequency) {
      interest = params.computeEstimatedMonthlyInterest(balance, rate, method);
    }

    const income = params.roundMoney(
      (params.incomeTotalsByAccount[key] || 0) + (params.transferCredits[key] || 0),
    );
    let expense = params.roundMoney(
      (params.expenseTotalsByAccount[key] || 0) + (params.transferDebits[key] || 0),
    );
    if (fee !== null && fee > 0) {
      expense = params.roundMoney(expense + fee);
    }
    const net = params.roundMoney(income + interest - expense);

    interestAvgValues.push([interest]);
    expenseAvgValues.push([expense]);
    incomeAvgValues.push([income]);
    netFlowValues.push([net]);
  });

  return { interestAvgValues, expenseAvgValues, incomeAvgValues, netFlowValues };
}
