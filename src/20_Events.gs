// Build normalized events from input rules.
const Events = {
  buildIncomeEvents: function (incomeRules) {
    return incomeRules.flatMap(function (rule) {
      var dates = Recurrence.expand({
        startDate: rule.startDate,
        frequency: rule.frequency,
        repeatEvery: rule.repeatEvery,
        endDate: rule.endDate,
      });
      return dates.map(function (date) {
        return {
          date: date,
          kind: 'Income',
          behavior: 'Income',
          name: rule.name,
          category: null,
          from: null,
          to: rule.paidTo,
          amount: rule.amount,
        };
      });
    });
  },

  buildExpenseEvents: function (expenseRules) {
    return expenseRules.flatMap(function (rule) {
      var dates = Recurrence.expand({
        startDate: rule.startDate,
        frequency: rule.frequency,
        repeatEvery: rule.repeatEvery,
        endDate: rule.endDate,
      });

      return dates.map(function (date) {
        return {
          date: date,
          kind: 'Expense',
          behavior: Config.BEHAVIOR_LABELS.Expense,
          name: rule.name,
          category: rule.category,
          from: rule.paidFrom,
          to: 'External',
          amount: rule.amount,
        };
      });
    });
  },

  buildTransferEvents: function (transferRules) {
    return transferRules.flatMap(function (rule) {
      var dates = Recurrence.expand({
        startDate: rule.startDate,
        frequency: rule.frequency,
        repeatEvery: rule.repeatEvery,
        endDate: rule.endDate,
      });
      return dates.map(function (date) {
        return {
          date: date,
          kind: 'Transfer',
          behavior: rule.behavior,
          name: rule.name,
          category: null,
          from: rule.paidFrom,
          to: rule.paidTo,
          amount: rule.amount,
        };
      });
    });
  },

  buildInterestEvents: function (accounts) {
    return accounts.flatMap(function (account) {
      if (!account) {
        return [];
      }
      if (!account.interestFrequency || !account.interestRate) {
        return [];
      }
      var window = getForecastWindow_();
      var startDate = account.interestStartDate || window.start;
      var endDate = account.interestEndDate || null;
      var dates = Recurrence.expand({
        startDate: startDate,
        frequency: account.interestFrequency,
        repeatEvery: account.interestRepeatEvery,
        endDate: endDate,
      });
      if (!dates.length) {
        return [];
      }
      return dates.map(function (date) {
        return {
          date: date,
          kind: 'Interest',
          behavior: 'Interest',
          name: 'Interest',
          account: account.name,
          rate: account.interestRate,
          method: account.interestMethod,
          frequency: account.interestFrequency,
          repeatEvery: account.interestRepeatEvery,
        };
      });
    });
  },
};

