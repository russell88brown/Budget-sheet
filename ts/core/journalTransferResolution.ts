import { resolveTransferAmount, type ResolveTransferAmountResult } from "./applyCalculations";

export type JournalTransferResolutionContext = {
  resolveTransferAmount: (
    balances: Record<string, number>,
    event: Record<string, unknown>,
    amount: number
  ) => ResolveTransferAmountResult;
  markCreditPaidOffWarning: (name: unknown) => void;
};

export function resolveTransferAmountForJournal(
  balances: Record<string, number>,
  event: Record<string, unknown>,
  amount: number,
  ctx: JournalTransferResolutionContext
): { amount: number; skip: boolean } {
  const typed = ctx.resolveTransferAmount(balances, event, amount);
  if (typed.skip) {
    event.appliedAmount = 0;
    event.skipJournal = true;
    if (typed.creditPaidOff) {
      ctx.markCreditPaidOffWarning(event.name);
    }
    return { amount: 0, skip: true };
  }
  return { amount: typed.amount, skip: false };
}

export function resolveTransferAmountForJournalWithDefault(
  balances: Record<string, number>,
  event: Record<string, unknown>,
  amount: number,
  transferResolverContext: Parameters<typeof resolveTransferAmount>[3],
  markCreditPaidOffWarning: (name: unknown) => void
): { amount: number; skip: boolean } {
  return resolveTransferAmountForJournal(balances, event, amount, {
    resolveTransferAmount: (b, e, a) => resolveTransferAmount(b, e, a, transferResolverContext),
    markCreditPaidOffWarning,
  });
}
