// Centralized configuration and enums for the forecast engine.
const Config = {
  SHEETS: {
    DASHBOARD: 'Dashboard',
    ACCOUNTS: 'Accounts',
    INCOME: 'Income',
    EXPENSE: 'Expense',
    JOURNAL: 'Journal',
    DAILY: 'Daily',
    MONTHLY: 'Monthly',
    EXPORT: 'Export',
    LOGS: 'Logs',
  },
  BEHAVIORS: {
    SCHEDULED: 'Scheduled',
    PROVISION: 'Provision',
    CAP_ONLY: 'CapOnly',
    ONE_OFF: 'OneOff',
  },
  BEHAVIOR_LABELS: {
    Expense: 'Expense',
    Repayment: 'Repayment',
    Transfer: 'Transfer',
  },
  ACCOUNT_TYPES: {
    CASH: 'Cash',
    CREDIT: 'Credit',
  },
  FREQUENCIES: {
    ONCE: 'One-off',
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    FORTNIGHTLY: 'Fortnightly',
    MONTHLY: 'Monthly',
    BIMONTHLY: 'Bi-Monthly',
    QUARTERLY: 'Quarterly',
    SEMI_ANNUALLY: 'SemiAnnually',
    ANNUALLY: 'Annually',
  },
  NAMED_RANGES: {
    CATEGORIES: 'ExpenseCategories',
    SINK_FUNDS: 'SinkFundAccounts',
  },
  LISTS_SHEET: 'Reference',
  FORECAST_DAYS: 365,
};
