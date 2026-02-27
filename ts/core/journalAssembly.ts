export type AccountRecord = {
  name?: unknown;
  type?: unknown;
};

export type JournalEventRecord = {
  kind?: unknown;
  behavior?: unknown;
  transferBehavior?: unknown;
};

export type JournalArtifact = {
  rows?: unknown[][];
  forecastAccounts?: string[];
  accountTypes?: Record<string, string>;
};

export function buildAccountTypeMap(accounts: AccountRecord[] | null | undefined): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  (accounts || []).forEach((account) => {
    const name = account?.name;
    if (!name) return;
    map[String(name)] = account?.type;
  });
  return map;
}

export function deriveJournalTransactionType(event: JournalEventRecord | null | undefined): string {
  if (!event || !event.kind) {
    return "";
  }
  if (event.kind === "Income") return "Income";
  if (event.kind === "Expense") return "Expense";
  if (event.kind === "Transfer") {
    const transferDetail = event.behavior || event.transferBehavior;
    if (transferDetail) {
      return `Transfer (${transferDetail})`;
    }
    return "Transfer";
  }
  if (event.kind === "Interest") return "Interest";
  return String(event.kind);
}

export function mergeJournalArtifacts(
  artifacts: JournalArtifact[] | null | undefined,
  baseColumnCount: number
): {
  combinedRows: unknown[][];
  forecastAccounts: string[];
  accountTypes: Record<string, string>;
} {
  const forecastLookup: Record<string, boolean> = {};
  const globalForecastAccounts: string[] = [];
  const accountTypes: Record<string, string> = {};

  (artifacts || []).forEach((artifact) => {
    (artifact?.forecastAccounts || []).forEach((name) => {
      if (forecastLookup[name]) return;
      forecastLookup[name] = true;
      globalForecastAccounts.push(name);
    });
    Object.keys(artifact?.accountTypes || {}).forEach((name) => {
      if (!accountTypes[name]) {
        accountTypes[name] = (artifact?.accountTypes || {})[name];
      }
    });
  });

  const combinedRows: unknown[][] = [];
  (artifacts || []).forEach((artifact) => {
    const localIndex: Record<string, number> = {};
    (artifact?.forecastAccounts || []).forEach((name, idx) => {
      localIndex[name] = idx;
    });
    (artifact?.rows || []).forEach((row) => {
      const base = row.slice(0, baseColumnCount);
      const localSnapshot = row.slice(baseColumnCount);
      const aligned = globalForecastAccounts.map((name) => {
        const idx = localIndex[name];
        if (idx === undefined) return "";
        return idx < localSnapshot.length ? localSnapshot[idx] : "";
      });
      combinedRows.push(base.concat(aligned));
    });
  });

  return {
    combinedRows,
    forecastAccounts: globalForecastAccounts,
    accountTypes,
  };
}
