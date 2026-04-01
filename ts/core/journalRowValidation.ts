export type JournalRowIndexes = {
  scenario: number;
  type: number;
  name: number;
  amount: number;
  frequency: number;
  start: number;
  account: number;
  from: number;
  to: number;
};

export type JournalRowValidationContext = {
  defaultScenarioId: string;
  normalizeScenarioId: (value: unknown) => string;
  toNumber: (value: unknown) => number | null;
  toDate: (value: unknown) => Date | null;
  normalizeAccountLookupKey: (value: unknown) => string;
  hasValidAccountForScenario: (scenarioId: string, accountKey: string) => boolean;
  normalizeTransferType: (value: unknown, amount: number | null) => string;
  transferTypes: {
    REPAYMENT_AMOUNT: string;
    REPAYMENT_ALL: string;
    TRANSFER_AMOUNT: string;
    TRANSFER_EVERYTHING_EXCEPT: string;
  };
};

export function validateIncomeRowReasons(
  row: unknown[],
  indexes: JournalRowIndexes,
  ctx: JournalRowValidationContext,
): string[] {
  const reasons: string[] = [];
  const rowScenarioId =
    indexes.scenario === -1 ? ctx.defaultScenarioId : ctx.normalizeScenarioId(row[indexes.scenario]);
  if (!row[indexes.type]) {
    reasons.push("missing type");
  }
  if (!row[indexes.name]) {
    reasons.push("missing name");
  }
  const amount = ctx.toNumber(row[indexes.amount]);
  if (amount === null || amount <= 0) {
    reasons.push("amount must be > 0");
  }
  if (!row[indexes.frequency]) {
    reasons.push("missing frequency");
  }
  if (!ctx.toDate(row[indexes.start])) {
    reasons.push("missing/invalid start date");
  }
  const account = ctx.normalizeAccountLookupKey(row[indexes.account]);
  if (!account) {
    reasons.push("missing to account");
  } else if (!ctx.hasValidAccountForScenario(rowScenarioId, account)) {
    reasons.push("unknown to account");
  }
  return reasons;
}

export function validateTransferRowReasons(
  row: unknown[],
  indexes: JournalRowIndexes,
  ctx: JournalRowValidationContext,
): string[] {
  const reasons: string[] = [];
  const rowScenarioId =
    indexes.scenario === -1 ? ctx.defaultScenarioId : ctx.normalizeScenarioId(row[indexes.scenario]);
  if (!row[indexes.name]) {
    reasons.push("missing name");
  }
  const amount = ctx.toNumber(row[indexes.amount]);
  if (amount === null || amount < 0) {
    reasons.push("amount must be >= 0");
  }
  if (!row[indexes.frequency]) {
    reasons.push("missing frequency");
  }
  if (!ctx.toDate(row[indexes.start])) {
    reasons.push("missing/invalid start date");
  }
  const transferType = ctx.normalizeTransferType(row[indexes.type], amount);
  const validType =
    transferType === ctx.transferTypes.REPAYMENT_AMOUNT ||
    transferType === ctx.transferTypes.REPAYMENT_ALL ||
    transferType === ctx.transferTypes.TRANSFER_AMOUNT ||
    transferType === ctx.transferTypes.TRANSFER_EVERYTHING_EXCEPT;
  if (!validType) {
    reasons.push("invalid transfer type");
  }
  const fromAccount = ctx.normalizeAccountLookupKey(row[indexes.from]);
  const toAccount = ctx.normalizeAccountLookupKey(row[indexes.to]);
  if (!fromAccount) {
    reasons.push("missing from account");
  } else if (!ctx.hasValidAccountForScenario(rowScenarioId, fromAccount)) {
    reasons.push("unknown from account");
  }
  if (!toAccount) {
    reasons.push("missing to account");
  } else if (!ctx.hasValidAccountForScenario(rowScenarioId, toAccount)) {
    reasons.push("unknown to account");
  }
  if (fromAccount && toAccount && fromAccount === toAccount) {
    reasons.push("from and to account cannot match");
  }
  return reasons;
}

export function validateExpenseRowReasons(
  row: unknown[],
  indexes: JournalRowIndexes,
  ctx: JournalRowValidationContext,
): string[] {
  const reasons: string[] = [];
  const rowScenarioId =
    indexes.scenario === -1 ? ctx.defaultScenarioId : ctx.normalizeScenarioId(row[indexes.scenario]);
  if (!row[indexes.type]) {
    reasons.push("missing type");
  }
  if (!row[indexes.name]) {
    reasons.push("missing name");
  }
  const amount = ctx.toNumber(row[indexes.amount]);
  if (amount === null || amount < 0) {
    reasons.push("amount must be >= 0");
  }
  if (!row[indexes.frequency]) {
    reasons.push("missing frequency");
  }
  if (!ctx.toDate(row[indexes.start])) {
    reasons.push("missing/invalid start date");
  }
  const fromAccount = ctx.normalizeAccountLookupKey(row[indexes.from]);
  if (!fromAccount) {
    reasons.push("missing from account");
  } else if (!ctx.hasValidAccountForScenario(rowScenarioId, fromAccount)) {
    reasons.push("unknown from account");
  }
  return reasons;
}
