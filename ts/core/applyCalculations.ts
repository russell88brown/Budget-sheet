export type TransferTypeConfig = {
  TRANSFER_EVERYTHING_EXCEPT: string;
  TRANSFER_AMOUNT: string;
  REPAYMENT_AMOUNT: string;
  REPAYMENT_ALL: string;
};

export type TransferCalculationContext = {
  transferTypes: TransferTypeConfig;
  accountKey: (value: unknown) => string;
  roundMoney: (value: unknown) => number;
};

export type ResolveTransferAmountResult = {
  amount: number;
  skip: boolean;
  creditPaidOff: boolean;
};

export type InterestFeeContext = {
  toNumber: (value: unknown) => number | null;
  periodsPerYear: (frequency: unknown, repeatEvery: unknown) => number;
};

export function estimateTransferOutgoingAmount(
  balances: Record<string, number>,
  event: Record<string, unknown>,
  ctx: TransferCalculationContext
): number {
  const transferType = event.transferBehavior || event.behavior;
  const amount = ctx.roundMoney(event.amount || 0);

  if (transferType === ctx.transferTypes.TRANSFER_EVERYTHING_EXCEPT) {
    return 0;
  }
  if (transferType === ctx.transferTypes.TRANSFER_AMOUNT) {
    return amount > 0 ? amount : 0;
  }
  if (transferType === ctx.transferTypes.REPAYMENT_ALL) {
    const toKey = ctx.accountKey(event.to);
    const targetAll = toKey ? balances[toKey] || 0 : 0;
    return targetAll < 0 ? ctx.roundMoney(Math.abs(targetAll)) : 0;
  }
  if (transferType === ctx.transferTypes.REPAYMENT_AMOUNT) {
    const targetKey = ctx.accountKey(event.to);
    const targetAmount = targetKey ? balances[targetKey] || 0 : 0;
    if (targetAmount >= 0 || amount <= 0) {
      return 0;
    }
    return ctx.roundMoney(Math.min(amount, Math.abs(targetAmount)));
  }
  return amount > 0 ? amount : 0;
}

export function resolveTransferAmount(
  balances: Record<string, number>,
  event: Record<string, unknown>,
  amount: number,
  ctx: TransferCalculationContext
): ResolveTransferAmountResult {
  const transferType = event.transferBehavior || event.behavior;

  if (transferType === ctx.transferTypes.TRANSFER_EVERYTHING_EXCEPT) {
    const sourceKey = ctx.accountKey(event.from);
    const sourceBalance = sourceKey ? balances[sourceKey] || 0 : 0;
    const keepAmount = amount || 0;
    const moveAmount = ctx.roundMoney(Math.max(0, sourceBalance - keepAmount));
    if (moveAmount <= 0) {
      return { amount: 0, skip: true, creditPaidOff: false };
    }
    return { amount: moveAmount, skip: false, creditPaidOff: false };
  }

  if (transferType === ctx.transferTypes.TRANSFER_AMOUNT) {
    if (amount <= 0) {
      return { amount: 0, skip: true, creditPaidOff: false };
    }
    return { amount, skip: false, creditPaidOff: false };
  }

  if (
    transferType !== ctx.transferTypes.REPAYMENT_AMOUNT &&
    transferType !== ctx.transferTypes.REPAYMENT_ALL
  ) {
    return { amount, skip: false, creditPaidOff: false };
  }

  const toKey = ctx.accountKey(event.to);
  const target = toKey ? balances[toKey] || 0 : 0;
  if (target >= 0) {
    return { amount: 0, skip: true, creditPaidOff: true };
  }

  const required = Math.abs(target);
  let resolvedAmount = amount;
  if (transferType === ctx.transferTypes.REPAYMENT_ALL) {
    resolvedAmount = required;
  } else if (resolvedAmount <= 0) {
    return { amount: 0, skip: true, creditPaidOff: false };
  } else if (resolvedAmount > required) {
    resolvedAmount = ctx.roundMoney(required);
  }
  return { amount: resolvedAmount, skip: false, creditPaidOff: false };
}

export function computeInterestFeePerPosting(
  event: Record<string, unknown>,
  ctx: InterestFeeContext
): number {
  const monthlyFee = ctx.toNumber(event.monthlyFee);
  if (monthlyFee === null || monthlyFee <= 0) {
    return 0;
  }
  const periods = ctx.periodsPerYear(event.frequency, event.repeatEvery);
  if (!periods) {
    return monthlyFee;
  }
  return monthlyFee * (12 / periods);
}
