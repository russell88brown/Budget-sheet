export type DeactivateRowsResult = {
  rows: any[][];
  updated: number;
};

export function deactivateRowsByValidator(
  sourceRows: unknown[][],
  includeIdx: number,
  toBoolean: (value: unknown) => boolean,
  validator: (row: unknown[], indexes: any) => unknown[],
  indexes: any,
): DeactivateRowsResult {
  const rows = sourceRows.map((row) => row.slice()) as any[][];
  let updated = 0;

  rows.forEach((row) => {
    if (!toBoolean(row[includeIdx])) {
      return;
    }
    const reasons = validator(row, indexes) || [];
    if (!Array.isArray(reasons) || !reasons.length) {
      return;
    }
    row[includeIdx] = false;
    updated += 1;
  });

  return { rows, updated };
}
