export function buildAccountLookupMap(
  accounts: Array<Record<string, any> | null | undefined>,
  normalizeAccountLookupKey: (value: unknown) => string,
): Record<string, Record<string, any>> {
  const map: Record<string, Record<string, any>> = {};
  (accounts || []).forEach((account) => {
    if (!account || !account.name) {
      return;
    }
    const key = normalizeAccountLookupKey(account.name);
    if (!key || map[key]) {
      return;
    }
    map[key] = account;
  });
  return map;
}
