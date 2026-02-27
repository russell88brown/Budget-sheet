import { DEFAULT_TAG, normalizeTag } from "../engine/runSelections";

export function normalizeScenarioSet(values: unknown): string[] {
  const raw = Array.isArray(values) ? values : [values];
  const normalized = raw
    .map((value) => normalizeTag(value))
    .filter((value, idx, arr) => value && arr.indexOf(value) === idx);
  return normalized.length ? normalized : [DEFAULT_TAG];
}

export function filterByScenario<T extends { scenarioId?: unknown }>(
  rows: T[] | null | undefined,
  scenarioId: unknown
): T[] {
  if (!Array.isArray(rows) || !rows.length) {
    return [];
  }
  const activeScenarioId = normalizeTag(scenarioId);
  return rows.filter((row) => normalizeTag(row?.scenarioId) === activeScenarioId);
}

export function filterByScenarioSet<T extends { scenarioId?: unknown }>(
  rows: T[] | null | undefined,
  scenarioIds: unknown
): T[] {
  if (!Array.isArray(rows) || !rows.length) {
    return [];
  }
  const lookup: Record<string, true> = {};
  normalizeScenarioSet(scenarioIds).forEach((id) => {
    lookup[id] = true;
  });
  return rows.filter((row) => !!lookup[normalizeTag(row?.scenarioId)]);
}

export function buildScenarioLookup(catalogValues: unknown): Record<string, true> {
  const lookup: Record<string, true> = {};
  const values = Array.isArray(catalogValues) ? catalogValues : [catalogValues];
  values.forEach((value) => {
    lookup[normalizeTag(value)] = true;
  });
  lookup[DEFAULT_TAG] = true;
  return lookup;
}

export function shouldIncludeScenarioColumn(
  scenarioColumnIndex: number,
  scenarioIds: unknown
): boolean {
  return scenarioColumnIndex !== -1 && normalizeScenarioSet(scenarioIds).length > 1;
}
