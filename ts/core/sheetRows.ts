export function mapSheetRows(headers: unknown[], values: unknown[][]): Array<Record<string, unknown>> {
  const headerRow = Array.isArray(headers) ? headers : [];
  const dataRows = Array.isArray(values) ? values : [];

  return dataRows
    .map((row) => {
      const obj: Record<string, unknown> = {};
      headerRow.forEach((header, idx) => {
        obj[String(header)] = Array.isArray(row) ? row[idx] : undefined;
      });
      return obj;
    })
    .filter((row) =>
      Object.keys(row).some((key) => row[key] !== "" && row[key] !== null && row[key] !== false),
    );
}
