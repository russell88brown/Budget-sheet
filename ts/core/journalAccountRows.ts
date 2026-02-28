export type BuildAccountLookupParams = {
  rows: unknown[][];
  nameIdx: number;
  includeIdx: number;
  scenarioIdx: number;
  defaultScenarioId: string;
  toBoolean: (value: unknown) => boolean;
  normalizeScenarioId: (value: unknown) => string;
  normalizeAccountLookupKey: (value: unknown) => string;
};

export function buildAccountLookupFromRows(params: BuildAccountLookupParams): Record<string, boolean> {
  const {
    rows,
    nameIdx,
    includeIdx,
    scenarioIdx,
    defaultScenarioId,
    toBoolean,
    normalizeScenarioId,
    normalizeAccountLookupKey,
  } = params;
  const lookup: Record<string, boolean> = {};
  const counts: Record<string, number> = {};
  const scopedCounts: Record<string, number> = {};

  rows.forEach((row) => {
    if (includeIdx !== -1 && !toBoolean(row[includeIdx])) {
      return;
    }
    const name = row[nameIdx];
    if (!name) {
      return;
    }
    const key = normalizeAccountLookupKey(name);
    if (!key) {
      return;
    }
    const scenarioId =
      scenarioIdx === -1 ? defaultScenarioId : normalizeScenarioId(row[scenarioIdx]);
    counts[key] = (counts[key] || 0) + 1;
    const scopedKey = `${scenarioId}|${key}`;
    scopedCounts[scopedKey] = (scopedCounts[scopedKey] || 0) + 1;
  });

  Object.keys(counts).forEach((key) => {
    if (counts[key] === 1) {
      lookup[key] = true;
    }
  });
  Object.keys(scopedCounts).forEach((key) => {
    if (scopedCounts[key] === 1) {
      lookup[key] = true;
    }
  });

  return lookup;
}

export type ValidateAccountsRowsParams = {
  rows: unknown[][];
  includeIdx: number;
  nameIdx: number;
  scenarioIdx: number;
  typeIdx: number;
  balanceIdx: number;
  defaultScenarioId: string;
  cashType: string;
  creditType: string;
  toBoolean: (value: unknown) => boolean;
  normalizeScenarioId: (value: unknown) => string;
  normalizeAccountLookupKey: (value: unknown) => string;
  normalizeAccountType: (value: unknown) => string;
  toNumber: (value: unknown) => number | null;
};

export type ValidateAccountsRowsResult = {
  rows: any[][];
  updated: number;
};

export function validateAccountsRows(params: ValidateAccountsRowsParams): ValidateAccountsRowsResult {
  const {
    rows: sourceRows,
    includeIdx,
    nameIdx,
    scenarioIdx,
    typeIdx,
    balanceIdx,
    defaultScenarioId,
    cashType,
    creditType,
    toBoolean,
    normalizeScenarioId,
    normalizeAccountLookupKey,
    normalizeAccountType,
    toNumber,
  } = params;

  const rows = sourceRows.map((row) => row.slice()) as any[][];
  const seen: Record<string, true> = {};
  let updated = 0;

  rows.forEach((row) => {
    if (!toBoolean(row[includeIdx])) {
      return;
    }
    const name = row[nameIdx] ? String(row[nameIdx]).trim() : "";
    const scenarioId =
      scenarioIdx === -1 ? defaultScenarioId : normalizeScenarioId(row[scenarioIdx]);
    const normalizedName = normalizeAccountLookupKey(name);
    const type = normalizeAccountType(row[typeIdx]);
    const balance = toNumber(row[balanceIdx]);
    const reasons: string[] = [];

    if (!name) {
      reasons.push("missing account name");
    } else {
      const duplicateKey = `${scenarioId}|${normalizedName}`;
      if (seen[duplicateKey]) {
        reasons.push("duplicate account name");
      }
      seen[duplicateKey] = true;
    }
    if (type !== cashType && type !== creditType) {
      reasons.push("invalid account type");
    }
    if (balance === null) {
      reasons.push("invalid balance");
    }
    if (reasons.length > 0) {
      row[includeIdx] = false;
      updated += 1;
    }
  });

  return { rows, updated };
}
