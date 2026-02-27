export function composeRunLogNotes(params: {
  scenarioValidation?: { totalDisabled?: number } | null;
  coreValidation?: { totalDisabled?: number } | null;
  explicitNote?: string | null;
}): string {
  const scenarioValidation = params.scenarioValidation || null;
  const coreValidation = params.coreValidation || null;
  const explicitNote = String(params.explicitNote || "").trim();

  let notes = "";
  if (scenarioValidation && (scenarioValidation.totalDisabled || 0) > 0) {
    notes = "Disabled unknown tag rows: " + scenarioValidation.totalDisabled;
  }
  if (coreValidation && (coreValidation.totalDisabled || 0) > 0) {
    notes = notes
      ? notes + " | Disabled invalid core rows: " + coreValidation.totalDisabled
      : "Disabled invalid core rows: " + coreValidation.totalDisabled;
  }
  if (explicitNote) {
    notes = notes ? notes + " | " + explicitNote : explicitNote;
  }
  return notes;
}
