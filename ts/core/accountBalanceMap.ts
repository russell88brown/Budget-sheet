export function buildAccountBalanceMap(
  accounts: Array<Record<string, any> | null | undefined>,
  normalizeAccountLookupKey: (value: unknown) => string,
  toNumber: (value: unknown) => number | null,
): Record<string, number> {
  const map: Record<string, number> = {};
  (accounts || []).forEach((account) => {
    if (!account || !account.name) {
      return;
    }
    map[normalizeAccountLookupKey(account.name)] = toNumber(account.balance) || 0;
  });
  return map;
}
