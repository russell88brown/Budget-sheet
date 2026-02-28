export type AccountRowIndexes = {
  type: number;
  include: number;
  expenseAvg: number;
  interestAvg: number;
  incomeAvg: number;
  netFlow: number;
  rate: number;
  fee: number;
  method: number;
  frequency: number;
  repeat: number;
};

export type NormalizeAccountRowsResult = {
  rows: any[][];
  updated: boolean;
};

export type NormalizeAccountRowsContext = {
  normalizeAccountType: (value: unknown) => unknown;
  toBoolean: (value: unknown) => boolean;
  isValidAccountSummaryNumber: (value: unknown) => boolean;
  isValidNumberOrBlank: (value: unknown) => boolean;
  normalizeInterestMethod: (value: unknown) => unknown;
  normalizeInterestFrequency: (value: unknown) => unknown;
  toPositiveInt: (value: unknown) => number | null;
};

export function normalizeAccountRows(
  sourceRows: unknown[][],
  indexes: AccountRowIndexes,
  ctx: NormalizeAccountRowsContext,
): NormalizeAccountRowsResult {
  const rows = sourceRows.map((row) => row.slice()) as any[][];
  let updated = false;

  rows.forEach((row) => {
    let method = ctx.normalizeInterestMethod(row[indexes.method]);
    let frequency = ctx.normalizeInterestFrequency(row[indexes.frequency]);
    const methodLooksLikeFrequency = ctx.normalizeInterestFrequency(row[indexes.method]);
    const frequencyLooksLikeMethod = ctx.normalizeInterestMethod(row[indexes.frequency]);
    if (!method && !frequency && methodLooksLikeFrequency && frequencyLooksLikeMethod) {
      method = frequencyLooksLikeMethod;
      frequency = methodLooksLikeFrequency;
    }

    if (indexes.type !== -1 && row[indexes.type]) {
      const normalizedType = ctx.normalizeAccountType(row[indexes.type]);
      if (normalizedType && normalizedType !== row[indexes.type]) {
        row[indexes.type] = normalizedType;
        updated = true;
      }
    }
    if (indexes.include !== -1 && row[indexes.include] !== "" && row[indexes.include] !== null) {
      const include = ctx.toBoolean(row[indexes.include]);
      if (include !== row[indexes.include]) {
        row[indexes.include] = include;
        updated = true;
      }
    }
    if (indexes.expenseAvg !== -1 && !ctx.isValidAccountSummaryNumber(row[indexes.expenseAvg])) {
      row[indexes.expenseAvg] = "";
      updated = true;
    }
    if (indexes.interestAvg !== -1 && !ctx.isValidAccountSummaryNumber(row[indexes.interestAvg])) {
      row[indexes.interestAvg] = "";
      updated = true;
    }
    if (indexes.incomeAvg !== -1 && !ctx.isValidAccountSummaryNumber(row[indexes.incomeAvg])) {
      row[indexes.incomeAvg] = "";
      updated = true;
    }
    if (indexes.netFlow !== -1 && !ctx.isValidAccountSummaryNumber(row[indexes.netFlow])) {
      row[indexes.netFlow] = "";
      updated = true;
    }
    if (indexes.rate !== -1 && !ctx.isValidNumberOrBlank(row[indexes.rate])) {
      row[indexes.rate] = "";
      updated = true;
    }
    if (indexes.fee !== -1 && !ctx.isValidNumberOrBlank(row[indexes.fee])) {
      row[indexes.fee] = "";
      updated = true;
    }
    if (method !== row[indexes.method]) {
      row[indexes.method] = method || "";
      updated = true;
    }
    if (frequency !== row[indexes.frequency]) {
      row[indexes.frequency] = frequency || "";
      updated = true;
    }

    const repeatEvery = ctx.toPositiveInt(row[indexes.repeat]);
    const normalizedRepeat = frequency ? repeatEvery || 1 : "";
    if (normalizedRepeat !== row[indexes.repeat]) {
      row[indexes.repeat] = normalizedRepeat;
      updated = true;
    }
  });

  return { rows, updated };
}
