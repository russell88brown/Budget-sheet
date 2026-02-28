export function buildRunExtensions(runModelWithExtensions: unknown): { policies: any[]; goals: any[] } {
  const model = (runModelWithExtensions || {}) as { policies?: unknown; goals?: unknown };
  return {
    policies: Array.isArray(model.policies) ? model.policies : [],
    goals: Array.isArray(model.goals) ? model.goals : [],
  };
}
