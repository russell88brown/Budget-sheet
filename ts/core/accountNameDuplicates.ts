export function listDuplicateAccountNames(
  accounts: Array<Record<string, any> | null | undefined>,
  normalizeAccountLookupKey: (value: unknown) => string,
): string[] {
  const seen: Record<string, boolean> = {};
  const duplicates: string[] = [];

  (accounts || []).forEach((account) => {
    if (!account || !account.name) {
      return;
    }
    const key = normalizeAccountLookupKey(account.name);
    if (!key) {
      return;
    }
    if (seen[key]) {
      duplicates.push(String(account.name || "").trim());
      return;
    }
    seen[key] = true;
  });

  return duplicates.filter((name, idx, arr) => name && arr.indexOf(name) === idx);
}
