export type TransferMonthlyContext = {
  transferTypes: {
    TRANSFER_AMOUNT: string;
    REPAYMENT_AMOUNT: string;
    TRANSFER_EVERYTHING_EXCEPT: string;
    REPAYMENT_ALL: string;
  };
  roundMoney: (value: unknown) => number;
};

export function isTransferAmountRequiredForMonthlyTotal(
  behavior: unknown,
  transferTypes: TransferMonthlyContext["transferTypes"]
): boolean {
  return (
    behavior === transferTypes.TRANSFER_AMOUNT ||
    behavior === transferTypes.REPAYMENT_AMOUNT ||
    behavior === transferTypes.TRANSFER_EVERYTHING_EXCEPT
  );
}

export function shouldCalculateTransferMonthlyTotal(
  include: boolean,
  recurring: boolean,
  recurrence: { frequency?: unknown } | null | undefined,
  fromKey: unknown,
  toKey: unknown,
  behavior: unknown,
  amount: number | null,
  transferTypes: TransferMonthlyContext["transferTypes"]
): boolean {
  if (!include || !recurring || !recurrence || !recurrence.frequency || !fromKey || !toKey) {
    return false;
  }
  if (!isTransferAmountRequiredForMonthlyTotal(behavior, transferTypes)) {
    return true;
  }
  return amount !== null && amount >= 0;
}

export function resolveTransferMonthlyTotal(
  behavior: unknown,
  amount: number | null,
  factor: number,
  accountBalances: Record<string, number>,
  toKey: string,
  ctx: TransferMonthlyContext
): number | null {
  if (
    behavior === ctx.transferTypes.TRANSFER_AMOUNT ||
    behavior === ctx.transferTypes.REPAYMENT_AMOUNT
  ) {
    return amount === null ? null : ctx.roundMoney(amount * factor);
  }
  if (behavior === ctx.transferTypes.REPAYMENT_ALL) {
    const debt = ctx.roundMoney(Math.max(0, -(accountBalances[toKey] || 0)));
    return ctx.roundMoney(debt * factor);
  }
  return null;
}
