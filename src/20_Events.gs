// Build normalized events from input rules.
const Events = {
  buildIncomeEvents: function (incomeRules) {
    return incomeRules.flatMap(function (rule) {
      var dates = Recurrence.expand({
        startDate: rule.startDate,
        frequency: rule.frequency,
        endDate: rule.endDate,
      });
      return dates.map(function (date) {
        return {
          date: date,
          kind: 'Income',
          behavior: 'Scheduled',
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
      if (rule.behavior === 'Budget Limit (no spend)') {
        return [];
      }

      var dates;
      if (rule.behavior === 'One-time') {
        if (!rule.startDate) {
          return [];
        }
        dates = [normalizeDate_(rule.startDate)];
      } else {
        dates = Recurrence.expand({
          startDate: rule.startDate,
          frequency: rule.frequency,
          endDate: rule.endDate,
        });
      }

      return dates.map(function (date) {
        var to = rule.paidTo;
        var kind = rule.behavior === 'Internal Transfer' ? 'Transfer' : 'Expense';
        return {
          date: date,
          kind: kind,
          behavior: rule.behavior,
          name: rule.name,
          category: rule.category,
          from: rule.paidFrom,
          to: to,
          amount: rule.amount,
        };
      });
    });
  },
};
