export type DeficitNeed = {
  account: unknown;
  amount: number;
};

export type InterestBucket = {
  accrued?: number;
  lastPostingDate?: Date | null;
};

export type DeficitContext = {
  accountKey: (value: unknown) => string;
  roundMoney: (value: unknown) => number;
  toNumber: (value: unknown) => number | null;
  estimateTransferOutgoingAmount: (balances: Record<string, number>, event: any) => number;
  creditAccountType: string;
  autoDeficitCoverPolicyType: string;
};

export type InterestContext = {
  accountKey: (value: unknown) => string;
  roundMoney: (value: unknown) => number;
  normalizeDate: (value: unknown) => Date;
  computeInterestFeePerPosting: (event: any) => number;
  apyCompoundMethod: string;
};

export function getDeficitCoverageNeedForEvent(
  balances: Record<string, number>,
  event: any,
  accountTypesByKey: Record<string, string>,
  threshold: unknown,
  ctx: DeficitContext
): DeficitNeed | null {
  if (!event || !event.kind) return null;
  if (event.kind !== "Expense" && event.kind !== "Transfer") return null;
  const fromKey = ctx.accountKey(event.from);
  if (!fromKey || accountTypesByKey[fromKey] === ctx.creditAccountType) return null;
  if ((event.transferBehavior || event.behavior) === ctx.autoDeficitCoverPolicyType) return null;

  let outgoing = 0;
  if (event.kind === "Expense") {
    outgoing = ctx.roundMoney(event.amount || 0);
  } else {
    outgoing = ctx.estimateTransferOutgoingAmount(balances, event);
  }
  if (outgoing <= 0) return null;

  const currentBalance = ctx.roundMoney(balances[fromKey] || 0);
  let safeThreshold = ctx.toNumber(threshold);
  if (safeThreshold === null || safeThreshold < 0) safeThreshold = 0;
  const needed = ctx.roundMoney(Math.max(0, outgoing + safeThreshold - currentBalance));
  if (needed <= 0) return null;
  return { account: event.from, amount: needed };
}

export function accrueDailyInterest(
  balances: Record<string, number>,
  event: any,
  bucket: InterestBucket,
  ctx: InterestContext
): void {
  const accountKey = ctx.accountKey(event?.account);
  if (!accountKey) return;
  const rate = event?.rate;
  if (rate === null || rate === undefined || rate === "") return;
  const balance = balances[accountKey] || 0;
  if (!balance) return;

  const annualRate = Number(rate) / 100;
  let dailyRate = annualRate / 365;
  if (event?.method === ctx.apyCompoundMethod) {
    dailyRate = Math.pow(1 + annualRate, 1 / 365) - 1;
  }
  bucket.accrued = (bucket.accrued || 0) + balance * dailyRate;
}

export function computeInterestAmount(
  balances: Record<string, number>,
  event: any,
  bucket: InterestBucket,
  ctx: InterestContext
): number {
  if (!event) return 0;
  if (event.interestAccrual) {
    accrueDailyInterest(balances, event, bucket, ctx);
    return 0;
  }

  const accountKey = ctx.accountKey(event.account);
  if (!accountKey) return 0;
  const accrued = bucket.accrued || 0;
  const fee = ctx.computeInterestFeePerPosting(event);
  bucket.accrued = 0;
  bucket.lastPostingDate = event.date ? ctx.normalizeDate(event.date) : null;
  return ctx.roundMoney(accrued - fee);
}

export function getInterestBucket(
  runState: any,
  accountName: string
): { accrued: number; lastPostingDate: Date | null } {
  if (!runState) {
    return { accrued: 0, lastPostingDate: null };
  }
  runState.interest = runState.interest || {};
  if (!runState.interest[accountName]) {
    runState.interest[accountName] = { accrued: 0, lastPostingDate: null };
  }
  return runState.interest[accountName];
}
