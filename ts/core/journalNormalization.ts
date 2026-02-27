export type FrequencyConfig = {
  DAILY: string;
  WEEKLY: string;
  MONTHLY: string;
  YEARLY: string;
  ONCE: string;
};

export type InterestMethodConfig = {
  APR_SIMPLE: string;
  APY_COMPOUND: string;
};

export type AccountTypeConfig = {
  CASH: string;
  CREDIT: string;
};

export function mapLegacyFrequency(
  frequencyValue: unknown,
  repeatEveryValue: unknown,
  startDateValue: unknown,
  endDateValue: unknown,
  frequencies: FrequencyConfig
): { frequency: unknown; repeatEvery: unknown; endDate: unknown } {
  let frequency = frequencyValue;
  let repeatEvery = repeatEveryValue;
  let endDate = endDateValue;
  const lower = frequency ? String(frequency).trim().toLowerCase() : "";

  if (lower === "weekly") {
    frequency = frequencies.WEEKLY;
  } else if (lower === "biweekly" || lower === "bi-weekly" || lower === "fortnightly") {
    frequency = frequencies.WEEKLY;
    repeatEvery = 2;
  } else if (lower === "bi-monthly" || lower === "bimonthly") {
    frequency = frequencies.MONTHLY;
    repeatEvery = 2;
  } else if (lower === "quarterly") {
    frequency = frequencies.MONTHLY;
    repeatEvery = 3;
  } else if (lower === "semiannually" || lower === "semi-annually") {
    frequency = frequencies.MONTHLY;
    repeatEvery = 6;
  } else if (lower === "annually") {
    frequency = frequencies.YEARLY;
    repeatEvery = 1;
  } else if (lower === "once" || lower === "one-off" || lower === "one off") {
    frequency = frequencies.ONCE;
    repeatEvery = 1;
    if (startDateValue && !endDateValue) {
      endDate = startDateValue;
    }
  } else if (lower === "daily") {
    frequency = frequencies.DAILY;
  } else if (lower === "monthly") {
    frequency = frequencies.MONTHLY;
  } else if (lower === "yearly") {
    frequency = frequencies.YEARLY;
  }

  if (frequency && (repeatEvery === "" || repeatEvery === null || repeatEvery === undefined)) {
    repeatEvery = 1;
  }

  return { frequency, repeatEvery, endDate };
}

export function normalizeInterestMethod(
  value: unknown,
  interestMethods: InterestMethodConfig
): string {
  if (value === "" || value === null || value === undefined) {
    return "";
  }
  const lower = String(value).trim().toLowerCase();
  if (lower === String(interestMethods.APR_SIMPLE).toLowerCase()) {
    return interestMethods.APR_SIMPLE;
  }
  if (lower === String(interestMethods.APY_COMPOUND).toLowerCase()) {
    return interestMethods.APY_COMPOUND;
  }
  return "";
}

export function normalizeInterestFrequency(
  value: unknown,
  frequencies: FrequencyConfig
): string {
  if (value === "" || value === null || value === undefined) {
    return "";
  }
  const lower = String(value).trim().toLowerCase();
  if (lower === String(frequencies.DAILY).toLowerCase()) return frequencies.DAILY;
  if (lower === String(frequencies.WEEKLY).toLowerCase()) return frequencies.WEEKLY;
  if (lower === String(frequencies.MONTHLY).toLowerCase()) return frequencies.MONTHLY;
  if (lower === String(frequencies.YEARLY).toLowerCase()) return frequencies.YEARLY;
  return "";
}

export function normalizeAccountType(value: unknown, accountTypes: AccountTypeConfig): unknown {
  const lower = String(value || "").trim().toLowerCase();
  if (lower === String(accountTypes.CASH).toLowerCase()) {
    return accountTypes.CASH;
  }
  if (lower === String(accountTypes.CREDIT).toLowerCase()) {
    return accountTypes.CREDIT;
  }
  return value;
}

export function isValidNumberOrBlank(
  value: unknown,
  toNumber: (input: unknown) => number | null
): boolean {
  if (value === "" || value === null || value === undefined) {
    return true;
  }
  return toNumber(value) !== null;
}

export function isValidAccountSummaryNumber(value: unknown): boolean {
  if (value === "" || value === null || value === undefined) {
    return true;
  }
  return typeof value === "number" && !Number.isNaN(value);
}
