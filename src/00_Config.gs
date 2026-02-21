// Centralized configuration and enums for the forecast engine.
const Config = {
  SHEETS: {
    DASHBOARD: 'Dashboard',
    ACCOUNTS: 'Accounts',
    TRANSFERS: 'Transfers',
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
  TRANSFER_TYPES: {
    REPAYMENT_AMOUNT: 'Repayment - Amount',
    REPAYMENT_ALL: 'Repayment - All',
    TRANSFER_AMOUNT: 'Transfer - Amount',
    TRANSFER_EVERYTHING_EXCEPT: 'Transfer - Everything Except',
  },
  ACCOUNT_TYPES: {
    CASH: 'Cash',
    CREDIT: 'Credit',
  },
  INTEREST_METHODS: {
    APR_SIMPLE: 'APR (Simple)',
    APY_COMPOUND: 'APY (Compound)',
  },
  FREQUENCIES: {
    ONCE: 'Once',
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    YEARLY: 'Yearly',
  },
  NAMED_RANGES: {
    ACCOUNT_NAMES: 'AccountNames',
    CATEGORIES: 'ExpenseCategories',
    INCOME_TYPES: 'IncomeTypes',
    FORECAST_START: 'ForecastStartDate',
    FORECAST_END: 'ForecastEndDate',
  },
  LISTS_SHEET: 'Settings',
  FORECAST_DAYS: 365,
};
