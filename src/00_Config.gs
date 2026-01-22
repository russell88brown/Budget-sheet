// Centralized configuration and enums for the forecast engine.
const Config = {
  SHEETS: {
    ACCOUNTS: 'Accounts',
    INCOME: 'Income',
    EXPENSE: 'Expense',
    JOURNAL: 'Forecast Journal',
    DAILY_SUMMARY: 'Daily Summary',
    OVERVIEW: 'Overview',
    LOGS: 'Logs',
  },
  BEHAVIORS: {
    SCHEDULED: 'Scheduled',
    PROVISION: 'Provision',
    CAP_ONLY: 'CapOnly',
    ONE_OFF: 'OneOff',
  },
  ACCOUNT_TYPES: {
    CASH: 'Cash',
    CREDIT: 'Credit',
  },
  FREQUENCIES: {
    WEEKLY: 'Weekly',
    FORTNIGHTLY: 'Fortnightly',
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    SEMI_ANNUALLY: 'SemiAnnually',
    ANNUALLY: 'Annually',
    ONCE: 'Once',
  },
  FORECAST_DAYS: 365,
};
