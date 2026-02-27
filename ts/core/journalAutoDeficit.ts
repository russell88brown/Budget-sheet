export type AutoDeficitContext = {
  getApplicableAutoDeficitPolicies: (policyRules: any[], event: any) => any[];
  getDeficitCoverageNeedForEvent: (
    balances: Record<string, number>,
    event: any,
    accountTypesByKey: Record<string, string>,
    threshold: unknown
  ) => { account?: unknown; amount?: number } | null;
  accountKey: (value: unknown) => string;
  roundMoney: (value: unknown) => number;
  toNumber: (value: unknown) => number | null;
  applyEventWithSnapshots: (
    balances: Record<string, number>,
    event: any
  ) => { afterFrom: Record<string, number>; afterTo: Record<string, number> };
  buildJournalEventRows: (
    event: any,
    balancesAfterFrom: Record<string, number>,
    balancesAfterTo: Record<string, number>,
    forecastAccounts: string[],
    accountTypesByKey: Record<string, string>,
    scenarioId: string
  ) => unknown[][];
  autoDeficitCoverPolicyType: string;
  transferAmountType: string;
};

export function applyAutoDeficitCoverRowsBeforeEvent(
  balances: Record<string, number>,
  event: any,
  accountTypesByKey: Record<string, string>,
  policyRules: any[],
  forecastAccounts: string[],
  scenarioId: string,
  ctx: AutoDeficitContext
): unknown[][] {
  const applicablePolicies = ctx.getApplicableAutoDeficitPolicies(policyRules, event);
  if (!applicablePolicies.length) {
    return [];
  }

  const threshold = applicablePolicies.reduce((maxValue, policy) => {
    let value = ctx.toNumber(policy?.threshold);
    if (value === null || value < 0) value = 0;
    return value > maxValue ? value : maxValue;
  }, 0);

  const coverageNeed = ctx.getDeficitCoverageNeedForEvent(
    balances,
    event,
    accountTypesByKey,
    threshold
  );
  if (!coverageNeed || !coverageNeed.account || (coverageNeed.amount || 0) <= 0) {
    return [];
  }

  const coveredAccount = String(coverageNeed.account);
  const coveredAccountKey = ctx.accountKey(coveredAccount);
  let remainingNeed = coverageNeed.amount || 0;
  let rows: unknown[][] = [];

  for (let i = 0; i < applicablePolicies.length && remainingNeed > 0; i += 1) {
    const policy = applicablePolicies[i];
    const sourceAccount = String(policy?.fundingAccount || "").trim();
    const sourceKey = ctx.accountKey(sourceAccount);
    if (!sourceAccount || sourceKey === coveredAccountKey) continue;
    if (!sourceKey || balances[sourceKey] === undefined) continue;

    const available = ctx.roundMoney(Math.max(0, balances[sourceKey] || 0));
    if (available <= 0) continue;

    const maxPerEvent = ctx.toNumber(policy?.maxPerEvent);
    const cap = maxPerEvent !== null && maxPerEvent > 0 ? maxPerEvent : remainingNeed;
    const amount = ctx.roundMoney(Math.min(remainingNeed, available, cap));
    if (amount <= 0) continue;

    const coverEvent: any = {
      date: event?.date,
      kind: "Transfer",
      behavior: ctx.autoDeficitCoverPolicyType,
      transferBehavior: ctx.transferAmountType,
      name: policy?.name || `Auto deficit cover - ${coveredAccount}`,
      from: sourceAccount,
      to: coveredAccount,
      amount,
      sourceRuleId: policy?.ruleId || `POL:${policy?.name || "AUTO_DEFICIT_COVER"}`,
      alertTag: "AUTO_DEFICIT_COVER",
    };
    const snapshots = ctx.applyEventWithSnapshots(balances, coverEvent);
    if (coverEvent.skipJournal) continue;
    rows = rows.concat(
      ctx.buildJournalEventRows(
        coverEvent,
        snapshots.afterFrom,
        snapshots.afterTo,
        forecastAccounts,
        accountTypesByKey,
        scenarioId
      )
    );
    remainingNeed = ctx.roundMoney(remainingNeed - amount);
  }

  return rows;
}
