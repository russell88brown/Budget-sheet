export type SnapshotContext = {
  roundMoney: (value: unknown) => number;
  accountKey: (value: unknown) => string;
  cloneBalances: (balances: Record<string, number>) => Record<string, number>;
  computeInterestAmount: (balances: Record<string, number>, event: any) => number;
  resolveTransferAmount: (
    balances: Record<string, number>,
    event: any,
    amount: number
  ) => { amount: number; skip: boolean };
};

export function cloneBalances(balances: Record<string, number> | null | undefined): Record<string, number> {
  return Object.keys(balances || {}).reduce((copy, key) => {
    copy[key] = (balances || {})[key];
    return copy;
  }, {} as Record<string, number>);
}

export function buildAccountTypesByKey(
  accounts: Array<{ name?: unknown; type?: unknown }> | null | undefined,
  accountKey: (value: unknown) => string
): Record<string, unknown> {
  const byKey: Record<string, unknown> = {};
  (accounts || []).forEach((account) => {
    if (!account || !account.name) return;
    byKey[accountKey(account.name)] = account.type;
  });
  return byKey;
}

export function applyEventWithSnapshots(
  balances: Record<string, number>,
  event: any,
  ctx: SnapshotContext
): { afterFrom: Record<string, number>; afterTo: Record<string, number> } {
  const pre = ctx.cloneBalances(balances);
  let amount = ctx.roundMoney(event.amount || 0);
  const toKey = ctx.accountKey(event.to);
  const fromKey = ctx.accountKey(event.from);
  const accountKey = ctx.accountKey(event.account);

  if (event.kind === "Income") {
    if (toKey && balances[toKey] !== undefined) {
      balances[toKey] = ctx.roundMoney((balances[toKey] || 0) + amount);
    }
    event.appliedAmount = amount;
    return { afterFrom: ctx.cloneBalances(balances), afterTo: ctx.cloneBalances(balances) };
  }

  if (event.kind === "Expense") {
    if (fromKey && balances[fromKey] !== undefined) {
      balances[fromKey] = ctx.roundMoney((balances[fromKey] || 0) - amount);
    }
    event.appliedAmount = amount;
    return { afterFrom: ctx.cloneBalances(balances), afterTo: ctx.cloneBalances(balances) };
  }

  if (event.kind === "Interest") {
    const interestAmount = ctx.computeInterestAmount(balances, event);
    event.appliedAmount = interestAmount;
    if (interestAmount === 0) {
      event.skipJournal = true;
      return { afterFrom: pre, afterTo: pre };
    }
    if (accountKey && balances[accountKey] !== undefined) {
      balances[accountKey] = ctx.roundMoney((balances[accountKey] || 0) + interestAmount);
    }
    return { afterFrom: ctx.cloneBalances(balances), afterTo: ctx.cloneBalances(balances) };
  }

  if (event.kind === "Transfer") {
    const transferResolution = ctx.resolveTransferAmount(balances, event, amount);
    amount = transferResolution.amount;
    if (transferResolution.skip) {
      return { afterFrom: pre, afterTo: pre };
    }

    const afterFrom = ctx.cloneBalances(pre);
    if (fromKey && afterFrom[fromKey] !== undefined) {
      afterFrom[fromKey] = ctx.roundMoney((afterFrom[fromKey] || 0) - amount);
    }
    const afterTo = ctx.cloneBalances(afterFrom);
    if (toKey && afterTo[toKey] !== undefined) {
      afterTo[toKey] = ctx.roundMoney((afterTo[toKey] || 0) + amount);
    }
    Object.keys(afterTo).forEach((name) => {
      balances[name] = afterTo[name];
    });
    event.appliedAmount = amount;
    return { afterFrom, afterTo };
  }

  return { afterFrom: pre, afterTo: pre };
}
