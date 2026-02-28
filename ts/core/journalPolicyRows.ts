export type ValidatePolicyRowsParams = {
  rows: unknown[][];
  idx: {
    include: number;
    scenario: number;
    type: number;
    name: number;
    priority: number;
    start: number;
    end: number;
    trigger: number;
    funding: number;
    threshold: number;
    maxPerEvent: number;
  };
  defaultScenarioId: string;
  autoDeficitCoverPolicyType: string;
  toBoolean: (value: unknown) => boolean;
  normalizePolicyType: (value: unknown) => string;
  normalizeScenarioId: (value: unknown) => string;
  normalizeAccountLookupKey: (value: unknown) => string;
  hasValidAccountForScenario: (scenarioId: string, accountKey: string) => boolean;
  toNumber: (value: unknown) => number | null;
  toPositiveInt: (value: unknown) => number | null;
  toDate: (value: unknown) => Date | null;
};

export type ValidatePolicyRowsResult = {
  rows: any[][];
  updated: number;
};

export function validatePolicyRows(params: ValidatePolicyRowsParams): ValidatePolicyRowsResult {
  const {
    rows: sourceRows,
    idx,
    defaultScenarioId,
    autoDeficitCoverPolicyType,
    toBoolean,
    normalizePolicyType,
    normalizeScenarioId,
    normalizeAccountLookupKey,
    hasValidAccountForScenario,
    toNumber,
    toPositiveInt,
    toDate,
  } = params;
  const rows = sourceRows.map((row) => row.slice()) as any[][];
  let updated = 0;

  rows.forEach((row) => {
    if (!toBoolean(row[idx.include])) {
      return;
    }
    const reasons: string[] = [];
    const policyType = normalizePolicyType(row[idx.type]);
    const name = row[idx.name] ? String(row[idx.name]).trim() : "";
    const rowScenarioId =
      idx.scenario === -1 ? defaultScenarioId : normalizeScenarioId(row[idx.scenario]);
    const trigger = normalizeAccountLookupKey(row[idx.trigger]);
    const funding = normalizeAccountLookupKey(row[idx.funding]);
    const threshold = idx.threshold === -1 ? null : toNumber(row[idx.threshold]);
    const maxPerEvent = idx.maxPerEvent === -1 ? null : toNumber(row[idx.maxPerEvent]);

    if (policyType !== autoDeficitCoverPolicyType) {
      reasons.push("invalid policy type");
    }
    if (!name) {
      reasons.push("missing name");
    }
    if (!trigger) {
      reasons.push("missing trigger account");
    } else if (!hasValidAccountForScenario(rowScenarioId, trigger)) {
      reasons.push("unknown trigger account");
    }
    if (!funding) {
      reasons.push("missing funding account");
    } else if (!hasValidAccountForScenario(rowScenarioId, funding)) {
      reasons.push("unknown funding account");
    }
    if (trigger && funding && trigger === funding) {
      reasons.push("trigger and funding account cannot match");
    }
    if (idx.priority !== -1 && row[idx.priority] !== "" && toPositiveInt(row[idx.priority]) === null) {
      reasons.push("invalid priority");
    }
    if (idx.start !== -1 && row[idx.start] && !toDate(row[idx.start])) {
      reasons.push("invalid start date");
    }
    if (idx.end !== -1 && row[idx.end] && !toDate(row[idx.end])) {
      reasons.push("invalid end date");
    }
    if (threshold !== null && threshold < 0) {
      reasons.push("threshold must be >= 0");
    }
    if (maxPerEvent !== null && maxPerEvent <= 0) {
      reasons.push("max per event must be > 0");
    }

    if (!reasons.length) {
      return;
    }
    row[idx.include] = false;
    updated += 1;
  });

  return { rows, updated };
}
