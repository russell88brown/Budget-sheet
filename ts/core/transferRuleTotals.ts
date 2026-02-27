export function buildTransferMonthlyTotals(
  transferRules: Array<Record<string, any> | null | undefined>,
  accounts: Array<Record<string, any> | null | undefined>,
  incomeTotalsByAccount: Record<string, number>,
  expenseTotalsByAccount: Record<string, number>,
  ctx: {
    normalizeAccountLookupKey: (value: unknown) => string;
    toNumber: (value: unknown) => number | null;
    normalizeTransferType: (value: unknown, amount: number | null) => string;
    monthlyFactorForRecurrence: (frequency: unknown, repeatEvery: unknown) => number;
    isRecurringForMonthlyAverage: (rule: Record<string, any>) => boolean;
    roundMoney: (value: number) => number;
    transferTypes: {
      TRANSFER_AMOUNT: string;
      REPAYMENT_AMOUNT: string;
      REPAYMENT_ALL: string;
      TRANSFER_EVERYTHING_EXCEPT: string;
    };
  },
): { credits: Record<string, number>; debits: Record<string, number> } {
  const credits: Record<string, number> = {};
  const debits: Record<string, number> = {};
  const accountBalances: Record<string, number> = {};

  (accounts || []).forEach((account) => {
    if (!account || !account.name) {
      return;
    }
    accountBalances[ctx.normalizeAccountLookupKey(account.name)] = ctx.toNumber(account.balance) || 0;
  });

  (transferRules || []).forEach((rule) => {
    if (!rule || !rule.frequency) {
      return;
    }
    if (!ctx.isRecurringForMonthlyAverage(rule)) {
      return;
    }
    const fromKey = ctx.normalizeAccountLookupKey(rule.paidFrom);
    const toKey = ctx.normalizeAccountLookupKey(rule.paidTo);
    if (!fromKey || !toKey) {
      return;
    }
    const amount = ctx.toNumber(rule.amount);
    const behavior = ctx.normalizeTransferType(rule.type || rule.behavior, amount);
    const factor = ctx.monthlyFactorForRecurrence(rule.frequency, rule.repeatEvery);
    if (factor <= 0) {
      return;
    }

    let monthly: number | null = null;
    if (
      behavior === ctx.transferTypes.TRANSFER_AMOUNT ||
      behavior === ctx.transferTypes.REPAYMENT_AMOUNT
    ) {
      if (amount === null || amount < 0) {
        return;
      }
      monthly = ctx.roundMoney(amount * factor);
    } else if (behavior === ctx.transferTypes.REPAYMENT_ALL) {
      const debt = ctx.roundMoney(Math.max(0, -(accountBalances[toKey] || 0)));
      monthly = ctx.roundMoney(debt * factor);
    } else if (behavior === ctx.transferTypes.TRANSFER_EVERYTHING_EXCEPT) {
      const keep = amount === null || amount < 0 ? 0 : amount;
      const sourceBalance = accountBalances[fromKey] || 0;
      const sourceIncome = incomeTotalsByAccount[fromKey] || 0;
      const sourceExpense = expenseTotalsByAccount[fromKey] || 0;
      monthly = ctx.roundMoney(Math.max(0, sourceBalance + sourceIncome - sourceExpense - keep));
    }

    if (monthly === null || monthly <= 0) {
      return;
    }
    debits[fromKey] = ctx.roundMoney((debits[fromKey] || 0) + monthly);
    credits[toKey] = ctx.roundMoney((credits[toKey] || 0) + monthly);
  });

  return { credits, debits };
}
