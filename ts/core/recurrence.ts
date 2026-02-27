export type RecurrenceFrequencies = {
  ONCE: string;
  DAILY: string;
  WEEKLY: string;
  MONTHLY: string;
  YEARLY: string;
};

export type RecurrenceStepContext = {
  frequencies: RecurrenceFrequencies;
  addDays: (date: Date, days: number) => Date;
  addMonthsClamped: (date: Date, months: number) => Date;
};

export type RecurrenceContext = RecurrenceStepContext & {
  normalizeDate: (value: unknown) => Date;
  window: { start: Date; end: Date };
  today?: unknown;
};

export type ExpandRecurrenceOptions = {
  startDate: unknown;
  frequency: unknown;
  repeatEvery?: unknown;
  endDate?: unknown;
};

export function normalizeRepeatEvery(repeatEvery: unknown): number {
  const raw = Number(repeatEvery);
  if (!Number.isFinite(raw) || raw < 1) {
    return 1;
  }
  return Math.floor(raw);
}

export function getStepMonths(
  frequency: unknown,
  repeatEvery: unknown,
  frequencies: RecurrenceFrequencies
): number | null {
  const every = normalizeRepeatEvery(repeatEvery);
  if (frequency === frequencies.MONTHLY) {
    return every;
  }
  if (frequency === frequencies.YEARLY) {
    return every * 12;
  }
  return null;
}

export function getStepDays(
  frequency: unknown,
  repeatEvery: unknown,
  frequencies: RecurrenceFrequencies
): number | null {
  if (frequency === frequencies.DAILY) {
    return normalizeRepeatEvery(repeatEvery);
  }
  if (frequency === frequencies.WEEKLY) {
    return normalizeRepeatEvery(repeatEvery) * 7;
  }
  return null;
}

export function periodsPerYear(
  frequency: unknown,
  repeatEvery: unknown,
  frequencies: RecurrenceFrequencies
): number {
  const every = normalizeRepeatEvery(repeatEvery);
  switch (frequency) {
    case frequencies.ONCE:
      return 0;
    case frequencies.DAILY:
      return 365 / every;
    case frequencies.WEEKLY:
      return (365 / 7) / every;
    case frequencies.MONTHLY:
      return 12 / every;
    case frequencies.YEARLY:
      return 1 / every;
    default:
      return 0;
  }
}

export function stepForward(
  date: Date,
  frequency: unknown,
  repeatEvery: unknown,
  ctx: RecurrenceStepContext
): Date | null {
  const stepDays = getStepDays(frequency, repeatEvery, ctx.frequencies);
  if (stepDays) {
    return ctx.addDays(date, stepDays);
  }

  const stepMonths = getStepMonths(frequency, repeatEvery, ctx.frequencies);
  if (stepMonths) {
    return ctx.addMonthsClamped(date, stepMonths);
  }

  return null;
}

export function alignToWindow(
  anchor: Date,
  frequency: unknown,
  repeatEvery: unknown,
  windowStart: Date,
  ctx: RecurrenceStepContext
): Date | null {
  if (anchor > windowStart) {
    return anchor;
  }

  const stepDays = getStepDays(frequency, repeatEvery, ctx.frequencies);
  if (stepDays) {
    const daysDiff = Math.floor((windowStart.getTime() - anchor.getTime()) / 86400000);
    const steps = Math.floor(daysDiff / stepDays);
    let candidate = ctx.addDays(anchor, steps * stepDays);
    if (candidate < windowStart) {
      candidate = ctx.addDays(candidate, stepDays);
    }
    return candidate;
  }

  const stepMonths = getStepMonths(frequency, repeatEvery, ctx.frequencies);
  if (!stepMonths) {
    return null;
  }

  const monthsDiff =
    (windowStart.getFullYear() - anchor.getFullYear()) * 12 +
    (windowStart.getMonth() - anchor.getMonth());
  const stepsMonths = Math.floor(monthsDiff / stepMonths);
  let candidate = ctx.addMonthsClamped(anchor, stepsMonths * stepMonths);
  if (candidate < windowStart) {
    candidate = ctx.addMonthsClamped(candidate, stepMonths);
  }
  return candidate;
}

export function expandRecurrence(options: ExpandRecurrenceOptions, ctx: RecurrenceContext): Date[] {
  const startDate = options.startDate;
  const frequency = options.frequency;
  const repeatEvery = normalizeRepeatEvery(options.repeatEvery);

  if (!startDate || !frequency) {
    return [];
  }

  const anchor = ctx.normalizeDate(startDate);
  const windowStartBase = ctx.normalizeDate(ctx.window.start);
  const windowEnd = ctx.normalizeDate(ctx.window.end);
  let end = options.endDate ? ctx.normalizeDate(options.endDate) : windowEnd;
  const today = ctx.normalizeDate(ctx.today ?? new Date());

  const windowStart = windowStartBase > today ? windowStartBase : today;
  if (frequency === ctx.frequencies.ONCE) {
    if (anchor < windowStart) {
      return [];
    }
    if (anchor > windowEnd) {
      return [];
    }
    return [new Date(anchor.getTime())];
  }

  if (options.endDate && anchor.getTime() === end.getTime()) {
    if (anchor < windowStart) {
      return [];
    }
    if (anchor > windowEnd) {
      return [];
    }
    return [new Date(anchor.getTime())];
  }

  const start = alignToWindow(anchor, frequency, repeatEvery, windowStart, ctx);
  if (!start) {
    return [];
  }

  if (end > windowEnd) {
    end = windowEnd;
  }
  if (start > end) {
    return [];
  }

  const dates: Date[] = [];
  let current: Date | null = start;
  while (current && current <= end) {
    dates.push(new Date(current.getTime()));
    current = stepForward(current, frequency, repeatEvery, ctx);
  }
  return dates;
}
