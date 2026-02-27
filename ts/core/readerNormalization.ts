export type FrequencyNormalizationResult = {
  frequency: unknown;
  repeatEvery: number | null;
  isSingleOccurrence: boolean;
};

export type RecurrenceNormalizationResult = {
  frequency: unknown;
  repeatEvery: number;
  isSingleOccurrence: boolean;
  startDate: Date | null;
  endDate: Date | null;
};

export type ReaderFrequencyConfig = {
  DAILY: string;
  WEEKLY: string;
  MONTHLY: string;
  YEARLY: string;
  ONCE: string;
};

export type ReaderTransferConfig = {
  REPAYMENT_AMOUNT: string;
  REPAYMENT_ALL: string;
  TRANSFER_AMOUNT: string;
  TRANSFER_EVERYTHING_EXCEPT: string;
};

export type ReaderPolicyConfig = {
  AUTO_DEFICIT_COVER: string;
};

export function toBoolean(value: unknown): boolean {
  return value === true || value === "TRUE" || value === "true" || value === 1;
}

export function toNumber(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

export function toDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return value as Date;
  }
  const parsed = new Date(value as string | number | Date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toPositiveInt(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return null;
  }
  if (num < 1) {
    return null;
  }
  return Math.floor(num);
}

export function normalizeFrequency(
  value: unknown,
  frequencies: ReaderFrequencyConfig
): FrequencyNormalizationResult {
  if (!value) {
    return { frequency: value, repeatEvery: null, isSingleOccurrence: false };
  }

  const cleaned = String(value).trim();
  const lower = cleaned.toLowerCase();

  if (lower === "daily") {
    return { frequency: frequencies.DAILY, repeatEvery: null, isSingleOccurrence: false };
  }
  if (lower === "once" || lower === "one-off" || lower === "one off") {
    return { frequency: frequencies.ONCE, repeatEvery: 1, isSingleOccurrence: true };
  }
  if (lower === "weekly") {
    return { frequency: frequencies.WEEKLY, repeatEvery: null, isSingleOccurrence: false };
  }
  if (lower === "monthly") {
    return { frequency: frequencies.MONTHLY, repeatEvery: null, isSingleOccurrence: false };
  }
  if (lower === "yearly" || lower === "annually") {
    return {
      frequency: frequencies.YEARLY,
      repeatEvery: lower === "annually" ? 1 : null,
      isSingleOccurrence: false,
    };
  }
  return { frequency: cleaned, repeatEvery: null, isSingleOccurrence: false };
}

export function normalizeRecurrence(
  frequencyValue: unknown,
  repeatEveryValue: unknown,
  startDateValue: unknown,
  endDateValue: unknown,
  frequencies: ReaderFrequencyConfig
): RecurrenceNormalizationResult {
  const startDate = toDate(startDateValue);
  let endDate = toDate(endDateValue);
  const normalized = normalizeFrequency(frequencyValue, frequencies);
  const repeatEvery = normalized.repeatEvery || toPositiveInt(repeatEveryValue) || 1;

  if (normalized.isSingleOccurrence && startDate && !endDate) {
    endDate = startDate;
  }

  return {
    frequency: normalized.frequency,
    repeatEvery,
    isSingleOccurrence: normalized.isSingleOccurrence,
    startDate,
    endDate,
  };
}

export function normalizeTransferType(
  value: unknown,
  amountValue: unknown,
  transferTypes: ReaderTransferConfig
): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  const cleaned = String(value).trim();
  if (!cleaned) {
    return cleaned;
  }
  const lower = cleaned.toLowerCase();
  if (lower === String(transferTypes.REPAYMENT_AMOUNT).toLowerCase()) {
    return transferTypes.REPAYMENT_AMOUNT;
  }
  if (lower === String(transferTypes.REPAYMENT_ALL).toLowerCase()) {
    return transferTypes.REPAYMENT_ALL;
  }
  if (lower === String(transferTypes.TRANSFER_AMOUNT).toLowerCase()) {
    return transferTypes.TRANSFER_AMOUNT;
  }
  if (lower === String(transferTypes.TRANSFER_EVERYTHING_EXCEPT).toLowerCase()) {
    return transferTypes.TRANSFER_EVERYTHING_EXCEPT;
  }

  if (lower === "repayment") {
    const amount = toNumber(amountValue);
    if (amount === 0) {
      return transferTypes.REPAYMENT_ALL;
    }
    return transferTypes.REPAYMENT_AMOUNT;
  }
  if (lower === "transfer") {
    return transferTypes.TRANSFER_AMOUNT;
  }

  return cleaned;
}

export function normalizePolicyType(value: unknown, policyTypes: ReaderPolicyConfig): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  const cleaned = String(value).trim();
  if (!cleaned) {
    return cleaned;
  }
  const lower = cleaned.toLowerCase();
  if (lower === String(policyTypes.AUTO_DEFICIT_COVER).toLowerCase()) {
    return policyTypes.AUTO_DEFICIT_COVER;
  }
  return cleaned;
}
