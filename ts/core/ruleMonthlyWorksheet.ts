export function computeRuleMonthlyWorksheet(
  rows: unknown[][],
  indexes: {
    include: number;
    scenario: number;
    amount: number;
    frequency: number;
    repeat: number;
    start: number;
    end: number;
    account: number;
    total: number;
  },
  params: {
    activeScenarioId: string;
    defaultScenarioId: string;
    normalizeScenarioId: (value: unknown) => string;
    toBoolean: (value: unknown) => boolean;
    toNumber: (value: unknown) => number | null;
    normalizeRecurrence: (
      frequencyValue: unknown,
      repeatEveryValue: unknown,
      startDateValue: unknown,
      endDateValue: unknown,
    ) => { frequency: unknown; repeatEvery: unknown; startDate: unknown; endDate: unknown; isSingleOccurrence: boolean };
    isRecurringForMonthlyAverage: (rule: {
      startDate: unknown;
      endDate: unknown;
      isSingleOccurrence: boolean;
    }) => boolean;
    monthlyFactorForRecurrence: (frequency: unknown, repeatEvery: unknown) => number;
    roundMoney: (value: number) => number;
  },
): Array<[unknown]> {
  return rows.map((row) => {
    const rowScenarioId =
      indexes.scenario === -1
        ? params.defaultScenarioId
        : params.normalizeScenarioId(row[indexes.scenario]);
    if (rowScenarioId !== params.activeScenarioId) {
      return [row[indexes.total]];
    }
    const include = params.toBoolean(row[indexes.include]);
    const amount = params.toNumber(row[indexes.amount]);
    const recurrence = params.normalizeRecurrence(
      row[indexes.frequency],
      row[indexes.repeat],
      indexes.start === -1 ? null : row[indexes.start],
      indexes.end === -1 ? null : row[indexes.end],
    );
    const recurring = params.isRecurringForMonthlyAverage({
      startDate: recurrence.startDate,
      endDate: recurrence.endDate,
      isSingleOccurrence: recurrence.isSingleOccurrence,
    });
    if (
      !include ||
      !recurring ||
      amount === null ||
      amount < 0 ||
      !recurrence.frequency ||
      !row[indexes.account]
    ) {
      return [""];
    }
    const monthlyTotal = params.roundMoney(
      (amount || 0) * params.monthlyFactorForRecurrence(recurrence.frequency, recurrence.repeatEvery),
    );
    return [monthlyTotal];
  });
}
