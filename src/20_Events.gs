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
          scenarioId: rule.scenarioId,
          kind: 'Income',
          behavior: rule.type || 'Income',
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
        var expenseNameParts = [];
        if (rule.type) {
          expenseNameParts.push(String(rule.type));
        }
        if (rule.name) {
          expenseNameParts.push(String(rule.name));
        }
        var expenseName = expenseNameParts.join(' - ');
        return {
          date: date,
          scenarioId: rule.scenarioId,
          kind: 'Expense',
          behavior: rule.type || Config.BEHAVIOR_LABELS.Expense,
          name: expenseName,
          category: rule.type,
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
          scenarioId: rule.scenarioId,
          kind: 'Transfer',
          behavior: rule.type || rule.behavior,
          transferBehavior: rule.type || rule.behavior,
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
      if (!account.interestPostingFrequency || !account.interestRate) {
        return [];
      }
      var window = getForecastWindow_();
      var startDate = account.interestPostingStartDate || window.start;
      var endDate = null;
      var postingDates = Recurrence.expand({
        startDate: startDate,
        frequency: account.interestPostingFrequency,
        repeatEvery: account.interestPostingRepeatEvery,
        endDate: endDate,
      });
      if (!postingDates.length) {
        return [];
      }
      var accrualDates = Recurrence.expand({
        startDate: startDate,
        frequency: Config.FREQUENCIES.DAILY,
        repeatEvery: 1,
        endDate: endDate,
      });
      var accrualEvents = accrualDates.map(function (date) {
        return {
          date: date,
          scenarioId: account.scenarioId,
          kind: 'Interest',
          behavior: 'Interest Accrual',
          name: 'Interest Accrual',
          account: account.name,
          rate: account.interestRate,
          method: account.interestMethod,
          interestAccrual: true,
          skipJournal: true,
        };
      });
      var postingEvents = postingDates.map(function (date) {
        return {
          date: date,
          scenarioId: account.scenarioId,
          kind: 'Interest',
          behavior: 'Interest',
          name: 'Interest',
          account: account.name,
          rate: account.interestRate,
          monthlyFee: account.interestMonthlyFee,
          method: account.interestMethod,
          frequency: account.interestPostingFrequency,
          repeatEvery: account.interestPostingRepeatEvery,
        };
      });
      return accrualEvents.concat(postingEvents);
    });
  },
};

