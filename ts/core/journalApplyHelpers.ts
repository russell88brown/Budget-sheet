export type ApplyAccount = {
  name?: unknown;
  balance?: unknown;
  forecast?: unknown;
};

export function buildBalanceMap(
  accounts: ApplyAccount[] | null | undefined,
  accountKey: (value: unknown) => string,
  roundMoney: (value: unknown) => number
): Record<string, number> {
  const map: Record<string, number> = {};
  (accounts || []).forEach((account) => {
    const key = accountKey(account?.name);
    if (!key) return;
    map[key] = roundMoney(account?.balance || 0);
  });
  return map;
}

export function buildForecastableMap(
  accounts: ApplyAccount[] | null | undefined,
  accountKey: (value: unknown) => string
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  (accounts || []).forEach((account) => {
    const key = accountKey(account?.name);
    if (!key) return;
    map[key] = account?.forecast === true;
  });
  return map;
}

export function buildForecastBalanceCells(
  balances: Record<string, number> | null | undefined,
  forecastAccounts: string[] | null | undefined,
  accountKey: (value: unknown) => string
): number[] {
  return (forecastAccounts || []).map((name) => {
    return (balances || {})[accountKey(name)] || 0;
  });
}

export function buildAlerts(
  cashNegative: boolean,
  creditPaidOff: boolean,
  explicitAlert: unknown
): string {
  const alerts: string[] = [];
  if (cashNegative) alerts.push("NEGATIVE_CASH");
  if (creditPaidOff) alerts.push("CREDIT_PAID_OFF");
  if (explicitAlert) alerts.push(String(explicitAlert));
  return alerts.join(" | ");
}
