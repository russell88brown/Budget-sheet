export type TopSourceTuple = [string, number, number];

export function summarizeNegativeCashTopSourcesFromRows(
  rows: unknown[][],
  alertsIndex: number,
  amountIndex: number,
  sourceRuleIdIndex: number,
  toNumber: (value: unknown) => number | null,
  roundMoney: (value: unknown) => number
): TopSourceTuple[] {
  const totals: Record<string, { total: number; events: number }> = {};

  (rows || []).forEach((row) => {
    const alerts = String((row && row[alertsIndex]) || "");
    if (alerts.indexOf("NEGATIVE_CASH") === -1) {
      return;
    }
    const rawAmount = toNumber(row && row[amountIndex]);
    if (rawAmount === null || rawAmount >= 0) {
      return;
    }
    const key = String((row && row[sourceRuleIdIndex]) || "").trim() || "(Unattributed)";
    const amount = Math.abs(rawAmount);
    if (!totals[key]) {
      totals[key] = { total: 0, events: 0 };
    }
    totals[key].total = roundMoney(totals[key].total + amount);
    totals[key].events += 1;
  });

  const keys = Object.keys(totals).sort((left, right) => {
    const diff = totals[right].total - totals[left].total;
    if (diff !== 0) {
      return diff;
    }
    return left < right ? -1 : left > right ? 1 : 0;
  });

  return keys.slice(0, 5).map((key) => [key, totals[key].total, totals[key].events]);
}
