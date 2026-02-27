export function buildRunLogEntryRow(
  timestamp: Date,
  modeLabel: unknown,
  scenarioId: unknown,
  status: unknown,
  notes: unknown,
): [Date, string, string, string, string] {
  return [
    timestamp,
    String(modeLabel || "Run"),
    String(scenarioId || ""),
    String(status || ""),
    String(notes || ""),
  ];
}
