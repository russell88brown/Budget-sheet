export type NormalizeTransferRowsResult = {
  rows: any[][];
  updated: boolean;
};

export function normalizeTransferRows(
  sourceRows: unknown[][],
  typeIdx: number,
  amountIdx: number,
  normalizeTransferType: (value: unknown, amount: number | null) => string,
  toNumber: (value: unknown) => number | null,
  repaymentAllType: string,
): NormalizeTransferRowsResult {
  const rows = sourceRows.map((row) => row.slice()) as any[][];
  let updated = false;

  rows.forEach((row) => {
    const amount = toNumber(row[amountIdx]);
    const canonicalType = normalizeTransferType(row[typeIdx], amount);
    if (canonicalType && canonicalType !== row[typeIdx]) {
      row[typeIdx] = canonicalType;
      updated = true;
    }
    if (canonicalType === repaymentAllType && amount !== 0) {
      row[amountIdx] = 0;
      updated = true;
    }
  });

  return { rows, updated };
}
