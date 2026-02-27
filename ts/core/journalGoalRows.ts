export type ValidateGoalRowsParams = {
  rows: unknown[][];
  idx: {
    include: number;
    scenario: number;
    name: number;
    targetAmount: number;
    targetDate: number;
    priority: number;
    fundingAccount: number;
    fundingPolicy: number;
    amountPerMonth: number;
    percentOfInflow: number;
  };
  defaultScenarioId: string;
  goalFundingPolicies: {
    FIXED: string;
    LEFTOVER: string;
    PERCENT: string;
  };
  toBoolean: (value: unknown) => boolean;
  normalizeScenarioId: (value: unknown) => string;
  normalizeAccountLookupKey: (value: unknown) => string;
  hasValidAccountForScenario: (scenarioId: string, accountKey: string) => boolean;
  toNumber: (value: unknown) => number | null;
  toDate: (value: unknown) => Date | null;
  toPositiveInt: (value: unknown) => number | null;
};

export type ValidateGoalRowsResult = {
  rows: any[][];
  updated: number;
};

export function validateGoalRows(params: ValidateGoalRowsParams): ValidateGoalRowsResult {
  const {
    rows: sourceRows,
    idx,
    defaultScenarioId,
    goalFundingPolicies,
    toBoolean,
    normalizeScenarioId,
    normalizeAccountLookupKey,
    hasValidAccountForScenario,
    toNumber,
    toDate,
    toPositiveInt,
  } = params;
  const rows = sourceRows.map((row) => row.slice()) as any[][];
  let updated = 0;

  rows.forEach((row) => {
    if (!toBoolean(row[idx.include])) {
      return;
    }
    const reasons: string[] = [];
    const goalName = row[idx.name] ? String(row[idx.name]).trim() : "";
    const rowScenarioId =
      idx.scenario === -1 ? defaultScenarioId : normalizeScenarioId(row[idx.scenario]);
    const targetAmount = toNumber(row[idx.targetAmount]);
    const targetDate = toDate(row[idx.targetDate]);
    const fundingAccount = normalizeAccountLookupKey(row[idx.fundingAccount]);
    const fundingPolicy = row[idx.fundingPolicy];
    const amountPerMonth = idx.amountPerMonth === -1 ? null : toNumber(row[idx.amountPerMonth]);
    const percentOfInflow =
      idx.percentOfInflow === -1 ? null : toNumber(row[idx.percentOfInflow]);

    if (!goalName) {
      reasons.push("missing goal name");
    }
    if (targetAmount === null || targetAmount <= 0) {
      reasons.push("target amount must be > 0");
    }
    if (!targetDate) {
      reasons.push("invalid target date");
    }
    if (!fundingAccount) {
      reasons.push("missing funding account");
    } else if (!hasValidAccountForScenario(rowScenarioId, fundingAccount)) {
      reasons.push("unknown funding account");
    }
    if (
      fundingPolicy !== goalFundingPolicies.FIXED &&
      fundingPolicy !== goalFundingPolicies.LEFTOVER &&
      fundingPolicy !== goalFundingPolicies.PERCENT
    ) {
      reasons.push("invalid funding policy");
    }
    if (idx.priority !== -1 && row[idx.priority] !== "" && toPositiveInt(row[idx.priority]) === null) {
      reasons.push("invalid priority");
    }
    if (
      fundingPolicy === goalFundingPolicies.FIXED &&
      (amountPerMonth === null || amountPerMonth <= 0)
    ) {
      reasons.push("amount per month must be > 0 for fixed policy");
    }
    if (
      fundingPolicy === goalFundingPolicies.PERCENT &&
      (percentOfInflow === null || percentOfInflow <= 0)
    ) {
      reasons.push("percent of inflow must be > 0 for percent policy");
    }

    if (!reasons.length) {
      return;
    }
    row[idx.include] = false;
    updated += 1;
  });

  return { rows, updated };
}
