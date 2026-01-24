// Core forecasting logic that applies events to balances.
const Engine = {
  runForecast: function () {
    var accounts = Readers.readAccounts();
    var incomeRules = Readers.readIncome();
    var expenseRules = Readers.readExpenses();

    var events = Events.buildIncomeEvents(incomeRules).concat(
      Events.buildExpenseEvents(expenseRules)
    );

    events.sort(function (a, b) {
      return a.date.getTime() - b.date.getTime();
    });

    var journalData = buildJournalRows_(accounts, events);
    var dailySummaryData = buildDailySummaryRows_(accounts, events);
    var overviewData = buildOverviewRows_(accounts, events, dailySummaryData.rows);

    Writers.writeJournal(journalData.rows, journalData.forecastAccounts);
    Writers.writeDailySummary(dailySummaryData.rows, dailySummaryData.forecastAccounts);
    Writers.writeOverview(overviewData.rows, overviewData.forecastAccounts);
    Writers.writeLogs([]);
  },
};

function buildJournalRows_(accounts, events) {
  var balances = buildBalanceMap_(accounts);
  var forecastable = buildForecastableMap_(accounts);
  var forecastAccounts = accounts
    .filter(function (account) {
      return forecastable[account.name];
    })
    .map(function (account) {
      return account.name;
    });
  var rows = [];
  var openingDate = events.length ? normalizeDate_(events[0].date) : normalizeDate_(new Date());

  rows = rows.concat(buildOpeningRows_(accounts, openingDate, forecastAccounts, balances));

  events.forEach(function (event) {
    applyEvent_(balances, event);
    rows = rows.concat(buildJournalEventRows_(event, balances, forecastable, forecastAccounts));
  });

  return { rows: rows, forecastAccounts: forecastAccounts };
}

function buildDailySummaryRows_(accounts, events) {
  if (events.length === 0) {
    return { rows: [], forecastAccounts: [] };
  }

  var balances = buildBalanceMap_(accounts);
  var accountTypes = buildAccountTypeMap_(accounts);
  var forecastable = buildForecastableMap_(accounts);
  var forecastAccounts = accounts
    .filter(function (account) {
      return forecastable[account.name];
    })
    .map(function (account) {
      return account.name;
    });

  var startDate = normalizeDate_(events[0].date);
  var endDate = normalizeDate_(events[events.length - 1].date);
  var index = 0;
  var rows = [];

  for (var current = startDate; current <= endDate; current = addDays_(current, 1)) {
    while (index < events.length && normalizeDate_(events[index].date).getTime() === current.getTime()) {
      applyEvent_(balances, events[index]);
      index += 1;
    }

    var totals = computeTotals_(balances, accountTypes);
    var snapshot = buildForecastBalanceCells_(balances, forecastAccounts);
    rows.push([new Date(current.getTime()), totals.cash, totals.debt, totals.net].concat(snapshot));
  }

  return { rows: rows, forecastAccounts: forecastAccounts };
}

function buildOpeningRows_(accounts, date, forecastAccounts, balances) {
  return accounts.map(function (account) {
    var balanceSnapshot = buildForecastBalanceCells_(balances, forecastAccounts);
    return [
      new Date(date.getTime()),
      account.name,
      'Opening',
      'Opening Balance',
      account.balance || 0,
      account.name,
    ].concat(balanceSnapshot);
  });
}

function buildOverviewRows_(accounts, events, dailySummaryRows) {
  var openingTotals = computeTotals_(buildBalanceMap_(accounts), buildAccountTypeMap_(accounts));
  var endingBalances = buildBalanceMap_(accounts);
  events.forEach(function (event) {
    applyEvent_(endingBalances, event);
  });
  var endingTotals = computeTotals_(endingBalances, buildAccountTypeMap_(accounts));
  var forecastable = buildForecastableMap_(accounts);
  var forecastAccounts = accounts
    .filter(function (account) {
      return forecastable[account.name];
    })
    .map(function (account) {
      return account.name;
    });

  var minCash = null;
  var minCashDate = null;
  var maxCash = null;
  var maxCashDate = null;
  var minNet = null;
  var minNetDate = null;
  var maxNet = null;
  var maxNetDate = null;
  var maxDebt = null;
  var maxDebtDate = null;
  dailySummaryRows.forEach(function (row) {
    var cash = row[1];
    var date = row[0];
    var debt = row[2];
    var net = row[3];
    if (minCash === null || cash < minCash) {
      minCash = cash;
      minCashDate = date;
    }
    if (maxCash === null || cash > maxCash) {
      maxCash = cash;
      maxCashDate = date;
    }
    if (minNet === null || net < minNet) {
      minNet = net;
      minNetDate = date;
    }
    if (maxNet === null || net > maxNet) {
      maxNet = net;
      maxNetDate = date;
    }
    if (maxDebt === null || debt > maxDebt) {
      maxDebt = debt;
      maxDebtDate = date;
    }
  });

  var totalsByKind = { Income: 0, Expense: 0, Transfer: 0, Opening: 0 };
  var totalsByBehavior = {};
  var totalsByCategory = {};

  events.forEach(function (event) {
    var amount = event.appliedAmount !== undefined ? event.appliedAmount : event.amount || 0;
    totalsByKind[event.kind] = (totalsByKind[event.kind] || 0) + amount;
    totalsByBehavior[event.behavior] = (totalsByBehavior[event.behavior] || 0) + amount;
    if (event.category) {
      totalsByCategory[event.category] = (totalsByCategory[event.category] || 0) + amount;
    }
  });

  var dateRange =
    events.length > 0
      ? normalizeDate_(events[0].date).toDateString() +
        ' to ' +
        normalizeDate_(events[events.length - 1].date).toDateString()
      : '';

  var rows = [
    ['Date Range', dateRange],
    ['Opening Cash', openingTotals.cash],
    ['Opening Debt', openingTotals.debt],
    ['Opening Net', openingTotals.net],
    ['Ending Cash', endingTotals.cash],
    ['Ending Debt', endingTotals.debt],
    ['Ending Net', endingTotals.net],
    ['Net Change', endingTotals.net - openingTotals.net],
    ['Minimum Cash', minCash === null ? '' : minCash],
    ['Minimum Cash Date', minCashDate ? minCashDate : ''],
    ['Maximum Cash', maxCash === null ? '' : maxCash],
    ['Maximum Cash Date', maxCashDate ? maxCashDate : ''],
    ['Minimum Net', minNet === null ? '' : minNet],
    ['Minimum Net Date', minNetDate ? minNetDate : ''],
    ['Maximum Net', maxNet === null ? '' : maxNet],
    ['Maximum Net Date', maxNetDate ? maxNetDate : ''],
    ['Maximum Debt', maxDebt === null ? '' : maxDebt],
    ['Maximum Debt Date', maxDebtDate ? maxDebtDate : ''],
    ['Total Income', totalsByKind.Income || 0],
    ['Total Expenses', totalsByKind.Expense || 0],
    ['Total Transfers', totalsByKind.Transfer || 0],
  ];

  if (forecastAccounts.length) {
    rows.push(['', '']);
    rows.push(['Forecast Balances (Ending)', '']);
    rows.push(['', ''].concat(buildForecastBalanceCells_(endingBalances, forecastAccounts)));
  }

  rows.push(['', '']);
  rows.push(['By Behavior', '']);
  Object.keys(totalsByBehavior)
    .sort()
    .forEach(function (behavior) {
      rows.push([behavior, totalsByBehavior[behavior]]);
    });

  rows.push(['', '']);
  rows.push(['By Category', '']);
  Object.keys(totalsByCategory)
    .sort()
    .forEach(function (category) {
      rows.push([category, totalsByCategory[category]]);
    });

  rows.push(['', '']);
  rows.push(['Ending Balances', '']);
  accounts.forEach(function (account) {
    rows.push([account.name, endingBalances[account.name] || 0]);
  });

  return { rows: rows, forecastAccounts: forecastAccounts };
}

function buildBalanceMap_(accounts) {
  var map = {};
  accounts.forEach(function (account) {
    map[account.name] = account.balance || 0;
  });
  return map;
}

function buildAccountTypeMap_(accounts) {
  var map = {};
  accounts.forEach(function (account) {
    map[account.name] = account.type;
  });
  return map;
}

function buildForecastableMap_(accounts) {
  var map = {};
  accounts.forEach(function (account) {
    map[account.name] = account.forecast === true;
  });
  return map;
}

function buildForecastBalanceCells_(balances, forecastAccounts) {
  return forecastAccounts.map(function (name) {
    return balances[name] || 0;
  });
}

function applyEvent_(balances, event) {
  var amount = event.amount || 0;

  if (event.kind === 'Income') {
    if (event.to) {
      balances[event.to] = (balances[event.to] || 0) + amount;
    }
    event.appliedAmount = amount;
    return;
  }

  if (event.kind === 'Expense') {
    if (event.from) {
      balances[event.from] = (balances[event.from] || 0) - amount;
    }
    event.appliedAmount = amount;
    return;
  }

  if (event.kind === 'Transfer') {
    if (event.from) {
      if (event.behavior === 'Internal Transfer' && amount === 0) {
        var target = event.to ? balances[event.to] || 0 : 0;
        if (target < 0) {
          amount = Math.abs(target);
        }
      }
      balances[event.from] = (balances[event.from] || 0) - amount;
    }
    if (event.to) {
      balances[event.to] = (balances[event.to] || 0) + amount;
    }
    event.appliedAmount = amount;
  }
}

function computeTotals_(balances, accountTypes) {
  var cash = 0;
  var debt = 0;
  Object.keys(balances).forEach(function (name) {
    var amount = balances[name] || 0;
    if (accountTypes[name] === Config.ACCOUNT_TYPES.CREDIT) {
      debt += amount;
    } else {
      cash += amount;
    }
  });
  return { cash: cash, debt: debt, net: cash - debt };
}

function normalizeDate_(value) {
  var date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildJournalEventRows_(event, balances, forecastable, forecastAccounts) {
  var balanceSnapshot = buildForecastBalanceCells_(balances, forecastAccounts);
  var amount = event.appliedAmount !== undefined ? event.appliedAmount : event.amount || 0;
  if (event.kind === 'Transfer') {
    var accounts = [event.from, event.to].filter(function (name) {
      return name && name !== 'External';
    });
    return accounts.map(function (accountName) {
      return [
        event.date,
        accountName,
        event.kind,
        event.name,
        amount,
        event.behavior,
      ].concat(balanceSnapshot);
    });
  }

  var accountName = event.kind === 'Income' ? event.to : event.from;
  return [
    [
      event.date,
      accountName || '',
      event.kind,
      event.name,
      amount,
      event.behavior,
    ].concat(balanceSnapshot),
  ];
}
