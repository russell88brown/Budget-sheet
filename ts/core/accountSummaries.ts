export type AccountTotalsContext = {
  normalizeAccountLookupKey: (value: unknown) => string;
  toNumber: (value: unknown) => number | null;
  roundMoney: (value: unknown) => number;
};

export type TransferTotals = {
  credits?: Record<string, unknown> | null;
  debits?: Record<string, unknown> | null;
};

export type AccountSummaryHeaderIndexes = {
  credits: number;
  debits: number;
  interest: number;
  net: number;
};

export type InterestSummaryContext = {
  apyCompoundMethod: string;
  roundMoney: (value: unknown) => number;
};

export function normalizeAccountTotalsKeys(
  totalsByAccount: Record<string, unknown> | null | undefined,
  ctx: AccountTotalsContext
): Record<string, number> {
  const normalized: Record<string, number> = {};
  if (!totalsByAccount) {
    return normalized;
  }

  Object.keys(totalsByAccount).forEach((key) => {
    const normalizedKey = ctx.normalizeAccountLookupKey(key);
    if (!normalizedKey) {
      return;
    }

    const value = ctx.toNumber(totalsByAccount[key]);
    if (value === null) {
      return;
    }

    normalized[normalizedKey] = ctx.roundMoney((normalized[normalizedKey] || 0) + value);
  });

  return normalized;
}

export function normalizeTransferTotalsKeys(
  transferTotals: TransferTotals | null | undefined,
  ctx: AccountTotalsContext
): { credits: Record<string, number>; debits: Record<string, number> } {
  return {
    credits: normalizeAccountTotalsKeys(transferTotals?.credits || {}, ctx),
    debits: normalizeAccountTotalsKeys(transferTotals?.debits || {}, ctx),
  };
}

export function getAccountSummaryHeaderIndexes(headers: unknown[]): AccountSummaryHeaderIndexes {
  return {
    credits: headers.indexOf("Money In / Month"),
    debits: headers.indexOf("Money Out / Month"),
    interest: headers.indexOf("Net Interest / Month"),
    net: headers.indexOf("Net Change / Month"),
  };
}

export function computeEstimatedMonthlyInterest(
  balance: number,
  ratePercent: number,
  method: unknown,
  ctx: InterestSummaryContext
): number {
  const annualRate = ratePercent / 100;
  let monthlyRate = annualRate / 12;
  if (method === ctx.apyCompoundMethod) {
    monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
  }
  return ctx.roundMoney(balance * monthlyRate);
}
