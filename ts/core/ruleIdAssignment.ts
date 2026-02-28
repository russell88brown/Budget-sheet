export type RuleIdAssignmentResult = {
  rows: any[][];
  assigned: number;
};

export function hasMeaningfulRowDataForRuleId(row: unknown[], ruleIdIdx: number): boolean {
  for (let i = 0; i < row.length; i += 1) {
    if (i === ruleIdIdx) {
      continue;
    }
    const value = row[i];
    if (value === null || value === "") {
      continue;
    }
    if (value === false) {
      continue;
    }
    return true;
  }
  return false;
}

export function assignMissingRuleIdsRows(
  sourceRows: unknown[][],
  ruleIdIdx: number,
  prefix: string,
): RuleIdAssignmentResult {
  const rows = sourceRows.map((row) => row.slice()) as any[][];
  const existing: Record<string, true> = {};

  rows.forEach((row) => {
    const id = row[ruleIdIdx] ? String(row[ruleIdIdx]).trim() : "";
    if (id) {
      existing[id] = true;
    }
  });

  let nextNumber = 1;
  let assigned = 0;

  rows.forEach((row) => {
    const current = row[ruleIdIdx] ? String(row[ruleIdIdx]).trim() : "";
    if (current) {
      return;
    }
    if (!hasMeaningfulRowDataForRuleId(row, ruleIdIdx)) {
      return;
    }

    let candidate = "";
    while (!candidate) {
      const serial = ("00000" + nextNumber).slice(-5);
      const trial = `${prefix}-${serial}`;
      nextNumber += 1;
      if (!existing[trial]) {
        candidate = trial;
      }
    }

    row[ruleIdIdx] = candidate;
    existing[candidate] = true;
    assigned += 1;
  });

  return { rows, assigned };
}
