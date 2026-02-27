export const DEFAULT_TAG = "Base";

export type RunAction =
  | "summarise_accounts"
  | "journal"
  | "daily"
  | "monthly"
  | "dashboard";

const VALID_ACTIONS: Record<RunAction, true> = {
  summarise_accounts: true,
  journal: true,
  daily: true,
  monthly: true,
  dashboard: true,
};

export function normalizeTag(value: unknown): string {
  if (value === null || value === undefined) {
    return DEFAULT_TAG;
  }
  const cleaned = String(value).trim();
  if (!cleaned) {
    return DEFAULT_TAG;
  }
  return cleaned.toLowerCase() === DEFAULT_TAG.toLowerCase() ? DEFAULT_TAG : cleaned;
}

export function normalizeAvailableTags(values: unknown[]): string[] {
  const unique = new Set<string>();
  for (const value of values || []) {
    unique.add(normalizeTag(value));
  }
  unique.add(DEFAULT_TAG);
  return [...unique];
}

export function normalizeActions(values: unknown[]): RunAction[] {
  const result: RunAction[] = [];
  const seen = new Set<string>();
  for (const value of values || []) {
    const action = String(value ?? "").toLowerCase() as RunAction;
    if (!action || seen.has(action)) {
      continue;
    }
    if (!VALID_ACTIONS[action]) {
      throw new Error("Unknown action type.");
    }
    seen.add(action);
    result.push(action);
  }
  if (!result.length) {
    throw new Error("Select at least one action.");
  }
  return result;
}

export function selectRunTags(availableValues: unknown[], selectedValues: unknown[]): string[] {
  const available = normalizeAvailableTags(availableValues || []);
  const selected: string[] = [];
  const seen = new Set<string>();

  for (const value of selectedValues || []) {
    const tag = normalizeTag(value);
    if (!seen.has(tag)) {
      seen.add(tag);
      selected.push(tag);
    }
  }
  if (!seen.has(DEFAULT_TAG)) {
    selected.push(DEFAULT_TAG);
    seen.add(DEFAULT_TAG);
  }

  for (const tag of selected) {
    if (!available.includes(tag)) {
      throw new Error(`Unknown tag "${tag}".`);
    }
  }
  return selected;
}

export function getTagColumnIndex(headers: unknown[]): number {
  if (!Array.isArray(headers) || !headers.length) {
    return -1;
  }
  const tagIdx = headers.findIndex((value) => String(value ?? "") === "Tag");
  if (tagIdx !== -1) {
    return tagIdx;
  }
  return headers.findIndex((value) => String(value ?? "") === "Scenario");
}
