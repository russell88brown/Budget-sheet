export type EventSortConfig = {
  transferAmount: string;
  repaymentAmount: string;
  repaymentAll: string;
  transferEverythingExcept: string;
};

export function getEventSortOrder(config: EventSortConfig): string[] {
  return [
    "Income",
    "Transfer:" + config.transferAmount,
    "Transfer:" + config.repaymentAmount,
    "Transfer:" + config.repaymentAll,
    "Expense",
    "InterestAccrual",
    "Interest",
    "Transfer:" + config.transferEverythingExcept,
  ];
}

export function getEventSortKey(
  event: Record<string, unknown> | null | undefined,
  normalizeTransferType: (value: unknown, amountValue: unknown) => string
): string {
  if (!event || !event.kind) {
    return "";
  }
  if (event.kind === "Transfer") {
    const behavior = normalizeTransferType(event.transferBehavior ?? event.behavior, event.amount);
    return "Transfer:" + behavior;
  }
  if (event.kind === "Interest" && event.interestAccrual === true) {
    return "InterestAccrual";
  }
  return String(event.kind);
}

export function eventSortPriority(
  event: Record<string, unknown> | null | undefined,
  normalizeTransferType: (value: unknown, amountValue: unknown) => string,
  config: EventSortConfig
): number {
  const order = getEventSortOrder(config);
  const lookup: Record<string, number> = {};
  order.forEach((key, idx) => {
    lookup[key] = idx;
  });
  const key = getEventSortKey(event, normalizeTransferType);
  return Object.prototype.hasOwnProperty.call(lookup, key) ? lookup[key] : order.length + 1;
}
