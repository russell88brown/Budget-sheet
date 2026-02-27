export type PolicyRuleContext = {
  autoDeficitCoverType: string;
  normalizeAccountLookupKey: (value: unknown) => string;
  toPositiveInt: (value: unknown) => number | null;
  normalizeDate: (value: unknown) => Date;
};

export function isPolicyActiveOnDate(
  policy: Record<string, unknown> | null | undefined,
  date: unknown,
  normalizeDate: (value: unknown) => Date
): boolean {
  const day = normalizeDate(date || new Date());
  const startDate = policy?.startDate ? normalizeDate(policy.startDate) : null;
  const endDate = policy?.endDate ? normalizeDate(policy.endDate) : null;
  if (startDate && day.getTime() < startDate.getTime()) {
    return false;
  }
  if (endDate && day.getTime() > endDate.getTime()) {
    return false;
  }
  return true;
}

export function getApplicableAutoDeficitPolicies(
  policyRules: Array<Record<string, unknown> | null | undefined>,
  event: Record<string, unknown> | null | undefined,
  ctx: PolicyRuleContext
): Array<Record<string, unknown>> {
  if (!event || !event.from || !Array.isArray(policyRules) || !policyRules.length) {
    return [];
  }
  const eventFromKey = ctx.normalizeAccountLookupKey(event.from);
  return policyRules
    .filter((policy): policy is Record<string, unknown> => {
      if (!policy || policy.type !== ctx.autoDeficitCoverType) {
        return false;
      }
      if (ctx.normalizeAccountLookupKey(policy.triggerAccount) !== eventFromKey) {
        return false;
      }
      return isPolicyActiveOnDate(policy, event.date, ctx.normalizeDate);
    })
    .sort((a, b) => {
      const pa = ctx.toPositiveInt(a.priority) || 100;
      const pb = ctx.toPositiveInt(b.priority) || 100;
      if (pa !== pb) {
        return pa - pb;
      }
      const na = String(a.name || "");
      const nb = String(b.name || "");
      return na < nb ? -1 : na > nb ? 1 : 0;
    });
}
