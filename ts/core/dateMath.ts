export function normalizeDate(value: unknown): Date {
  const date = new Date(value as string | number | Date);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonthsClamped(date: Date, months: number): Date {
  const year = date.getFullYear();
  const monthIndex = date.getMonth() + months;
  const day = date.getDate();
  let targetYear = year + Math.floor(monthIndex / 12);
  let targetMonth = monthIndex % 12;
  if (targetMonth < 0) {
    targetMonth += 12;
    targetYear -= 1;
  }

  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDay = Math.min(day, lastDay);
  return new Date(targetYear, targetMonth, clampedDay);
}
