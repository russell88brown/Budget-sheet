export type ResolveRunLogWriteRowResult = {
  row: number;
  insertAfterMax: boolean;
};

export function resolveRunLogWriteRow(
  columnValues: unknown[][],
  startRow: number,
  maxRows: number,
): ResolveRunLogWriteRowResult {
  let row = startRow;
  const values = Array.isArray(columnValues) ? columnValues : [];
  for (let i = 0; i < values.length && row <= maxRows; i += 1) {
    const value = Array.isArray(values[i]) ? values[i][0] : undefined;
    if (value !== "") {
      row += 1;
      continue;
    }
    break;
  }
  if (row > maxRows) {
    return { row: maxRows + 1, insertAfterMax: true };
  }
  return { row, insertAfterMax: false };
}
