export type CompiledEventContext = {
  roundMoney: (value: unknown) => number;
  normalizeDate: (value: unknown) => Date;
  normalizeTag: (value: unknown) => string;
  eventSortPriority: (event: Record<string, unknown>) => number;
};

export function normalizeCompiledEvent(
  event: Record<string, unknown> | null | undefined,
  index: number,
  ctx: CompiledEventContext
): Record<string, unknown> {
  const source = event || {};
  const normalized: Record<string, unknown> = { ...source };

  normalized.id = source.id || `evt_${String(index || 0)}`;
  normalized.date = ctx.normalizeDate(source.date);
  normalized.scenarioId = ctx.normalizeTag(source.scenarioId);
  normalized.kind = source.kind || "";
  normalized.behavior = source.behavior || "";
  normalized.name = source.name || "";
  normalized.category = source.category || "";
  normalized.sourceRuleId = source.sourceRuleId || "";
  normalized.from = source.from || "";
  normalized.to = source.to || "";
  normalized.account = source.account || "";
  normalized.amount = ctx.roundMoney(source.amount || 0);
  if (normalized.transferBehavior === undefined || normalized.transferBehavior === null) {
    normalized.transferBehavior = source.transferBehavior || source.behavior || "";
  }
  if (normalized.memo === undefined || normalized.memo === null) {
    normalized.memo = source.memo || "";
  }
  return normalized;
}

export function compareCompiledEvents(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  ctx: CompiledEventContext
): number {
  const dateDiff =
    ctx.normalizeDate(a.date).getTime() - ctx.normalizeDate(b.date).getTime();
  if (dateDiff !== 0) {
    return dateDiff;
  }

  const priorityDiff = ctx.eventSortPriority(a) - ctx.eventSortPriority(b);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  const ruleA = String(a.sourceRuleId || "");
  const ruleB = String(b.sourceRuleId || "");
  if (ruleA < ruleB) {
    return -1;
  }
  if (ruleA > ruleB) {
    return 1;
  }

  const nameA = String(a.name || "");
  const nameB = String(b.name || "");
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }

  const idA = String(a.id || "");
  const idB = String(b.id || "");
  if (idA < idB) {
    return -1;
  }
  if (idA > idB) {
    return 1;
  }
  return 0;
}
