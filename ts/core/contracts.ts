export type BudgetAccount = {
  name: string;
  balance?: number;
  type?: string;
  forecast?: boolean;
};

export type BudgetEvent = {
  kind: string;
  name?: string;
  date?: Date | string;
  amount?: number;
  from?: string;
  to?: string;
  account?: string;
  behavior?: string;
  transferBehavior?: string;
  sourceRuleId?: string;
  alertTag?: string;
};

export type BudgetPolicy = {
  type?: string;
  name?: string;
  triggerAccount?: string;
  fundingAccount?: string;
  threshold?: number;
  maxPerEvent?: number;
  priority?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  ruleId?: string;
};

export type JournalRow = [
  Date | string,
  string,
  string,
  string,
  string,
  number,
  string,
  string,
  ...Array<number | string>
];

export function assertAccountsShape(accounts: unknown): BudgetAccount[] {
  if (!Array.isArray(accounts)) {
    throw new Error("Accounts payload must be an array.");
  }
  return accounts as BudgetAccount[];
}

export function assertPoliciesShape(policies: unknown): BudgetPolicy[] {
  if (!Array.isArray(policies)) {
    throw new Error("Policies payload must be an array.");
  }
  return policies as BudgetPolicy[];
}

export function assertEventsShape(events: unknown): BudgetEvent[] {
  if (!Array.isArray(events)) {
    throw new Error("Events payload must be an array.");
  }
  return events as BudgetEvent[];
}
