// Centralized configuration and enums for the forecast engine.
// 2026-02-22T05:00:23+11:00
const Config = {
  SHEETS: {
    DASHBOARD: 'Dashboard',
    ACCOUNTS: 'Accounts',
    POLICIES: 'Policies',
    GOALS: 'Goals',
    RISK: 'Risk',
    TRANSFERS: 'Transfers',
    INCOME: 'Income',
    EXPENSE: 'Expense',
    JOURNAL: 'Journal',
    DAILY: 'Daily',
    MONTHLY: 'Monthly',
    EXPORT: 'Export',
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
  POLICY_TYPES: {
    AUTO_DEFICIT_COVER: 'Auto Deficit Cover',
  },
  GOAL_FUNDING_POLICIES: {
    FIXED: 'Fixed Amount',
    LEFTOVER: 'Leftover',
    PERCENT: 'Percent of Inflow',
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
