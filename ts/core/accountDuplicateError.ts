export function formatDuplicateAccountErrorMessage(
  scenarioId: unknown,
  duplicates: unknown[],
  normalizeScenarioId: (value: unknown) => string,
): string {
  const names = (Array.isArray(duplicates) ? duplicates : [])
    .map((name) => String(name || "").trim())
    .filter((name, idx, arr) => name && arr.indexOf(name) === idx);
  return (
    'Duplicate account names in tag "' +
    normalizeScenarioId(scenarioId) +
    '": ' +
    names.join(", ") +
    "."
  );
}
