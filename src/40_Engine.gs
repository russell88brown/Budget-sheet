// Core forecasting logic that applies events to balances.
const Engine = {
  runForecast: function () {
    Logger.info('Run started');
    deactivateExpiredExpenses_();
    updateSinkFundReference_();
    var accounts = Readers.readAccounts();
    Logger.info('Accounts read: ' + accounts.length);
    var incomeRules = Readers.readIncome();
    Logger.info('Income rules read: ' + incomeRules.length);
    var expenseRules = Readers.readExpenses();
    Logger.info('Expense rules read: ' + expenseRules.length);

    var events = Events.buildIncomeEvents(incomeRules).concat(
      Events.buildExpenseEvents(expenseRules)
    );
    Logger.info('Events built: ' + events.length);

    events.sort(function (a, b) {
      return a.date.getTime() - b.date.getTime();
    });

    var journalData = buildJournalRows_(accounts, events);
    var dailySummaryData = buildDailySummaryRows_(accounts, events);
    var overviewData = buildOverviewRows_(accounts, events, dailySummaryData.rows);

    Writers.writeJournal(journalData.rows, journalData.forecastAccounts);
    Writers.writeDailySummary(dailySummaryData.rows, dailySummaryData.forecastAccounts);
    Writers.writeOverview(overviewData.rows, overviewData.forecastAccounts);
    Writers.writeLogs(Logger.flush());
    Logger.info('Run completed');
  },
};

function deactivateExpiredExpenses_() {
  var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.EXPENSE);
  if (!sheet) {
    return;
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var includeIndex = headers.indexOf('Include');
  var endDateIndex = headers.indexOf('End Date');
  var startDateIndex = headers.indexOf('Start Date');
  var freqIndex = headers.indexOf('Frequency');
  var nameIndex = headers.indexOf('Name');

  if (includeIndex === -1 || startDateIndex === -1) {
    Logger.warn('Expense auto-deactivate skipped: missing Include or Start Date header.');
    return;
  }

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var today = normalizeDate_(new Date());
  var updated = 0;

  values.forEach(function (row, idx) {
    var include = row[includeIndex] === true;
    if (!include) {
      return;
    }
    var endDate = endDateIndex !== -1 ? row[endDateIndex] : null;
    var startDate = row[startDateIndex];
    var frequency = freqIndex !== -1 ? row[freqIndex] : null;

    var shouldDeactivate = false;
    if (endDate && normalizeDate_(endDate) < today) {
      shouldDeactivate = true;
    } else if (frequency === Config.FREQUENCIES.ONCE && startDate && normalizeDate_(startDate) < today) {
      shouldDeactivate = true;
    }

    if (shouldDeactivate) {
      row[includeIndex] = false;
      updated += 1;
      if (nameIndex !== -1) {
        Logger.warn('Expense deactivated (out of date): ' + row[nameIndex]);
      } else {
        Logger.warn('Expense deactivated (out of date) at row ' + (idx + 2));
      }
    }
  });

  if (updated > 0) {
    sheet.getRange(2, 1, values.length, lastCol).setValues(values);
    Logger.info('Expenses auto-deactivated: ' + updated);
  }
}

function updateSinkFundReference_() {
  var sheet = SpreadsheetApp.getActive().getSheetByName(Config.LISTS_SHEET);
  if (!sheet) {
    return;
  }

  var accounts = Readers.readAccounts();
  var sinkFunds = accounts.filter(function (account) {
    return account.sinkFund === true;
  });
  var sinkFundNames = sinkFunds.map(function (account) {
    return account.name;
  });
  var sinkFundSet = {};
  sinkFundNames.forEach(function (name) {
    sinkFundSet[name] = true;
  });

  var expenses = Readers.readExpenses();
  var window = getSinkFundWindow_();
  var windowWeeks = 78; // 18 months assumed at 4.333 weeks/month

  var totalInWindow = expenses.reduce(function (sum, rule) {
    if (!rule) {
      Logger.warn('Sink fund skip: empty rule');
      return sum;
    }
    if (!rule.paidFrom || !sinkFundSet[rule.paidFrom]) {
      return sum;
    }
    if (rule.behavior !== 'Expense') {
      Logger.warn('Sink fund skip: not Expense - ' + rule.name);
      return sum;
    }
    if (!rule.frequency) {
      Logger.warn('Sink fund skip: missing frequency - ' + rule.name);
      return sum;
    }
    var total = 0;
    var count = 0;
    if (rule.frequency === Config.FREQUENCIES.ONCE) {
      total = rule.amount || 0;
      count = total ? 1 : 0;
    } else {
      var annualFactor = frequencyToAnnualFactor_(rule.frequency);
      if (!annualFactor) {
        Logger.warn('Sink fund skip: invalid frequency - ' + rule.name);
        return sum;
      }
      count = annualFactor * 1.5;
      total = (rule.amount || 0) * count;
    }

    if (total === 0) {
      Logger.warn('Sink fund skip: zero total - ' + rule.name);
      return sum;
    }
    Logger.info(
      'Sink fund include: ' +
        rule.name +
        ' amount=' +
        rule.amount +
        ' freq=' +
        rule.frequency +
        ' count=' +
        count +
        ' total=' +
        total
    );
    return sum + total;
  }, 0);

  var weeklyTotal = totalInWindow / windowWeeks;

  sheet.getRange('D1').setValue('Sink Fund Account');
  sheet.getRange('E1').setValue('Sink Fund Amount Per Week');
  sheet.getRange('D2').setValue(sinkFundNames.length ? sinkFundNames.join(', ') : '');
  sheet.getRange('E2').setValue(weeklyTotal);
}

function getSinkFundWindow_() {
  var defaults = {
    start: normalizeDate_(new Date()),
    end: addMonthsClamped_(normalizeDate_(new Date()), 6),
  };
  var sheet = SpreadsheetApp.getActive().getSheetByName(Config.LISTS_SHEET);
  if (!sheet) {
    return defaults;
  }
  var startValue = sheet.getRange('A2').getValue();
  var endValue = sheet.getRange('B2').getValue();
  var start = startValue ? normalizeDate_(startValue) : defaults.start;
  var end = endValue ? normalizeDate_(endValue) : defaults.end;
  if (start > end) {
    return defaults;
  }
  return { start: start, end: end };
}

function frequencyToAnnualFactor_(frequency) {
  switch (frequency) {
    case Config.FREQUENCIES.WEEKLY:
      return 52;
    case Config.FREQUENCIES.FORTNIGHTLY:
      return 26;
    case Config.FREQUENCIES.MONTHLY:
      return 12;
    case Config.FREQUENCIES.QUARTERLY:
      return 4;
    case Config.FREQUENCIES.SEMI_ANNUALLY:
      return 2;
    case Config.FREQUENCIES.ANNUALLY:
      return 1;
    case Config.FREQUENCIES.ONCE:
      return 1;
    default:
      return 0;
  }
}

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
  var sinkFunds = accounts.filter(function (account) {
    return account.sinkFund === true;
  });
  var openingBalances = buildBalanceMap_(accounts);
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
  var dailyRowsForStats = [];

  var currentMonthKey = null;
  var lastTotals = null;
  var lastSnapshot = null;

  for (var current = startDate; current <= endDate; current = addDays_(current, 1)) {
    while (index < events.length && normalizeDate_(events[index].date).getTime() === current.getTime()) {
      applyEvent_(balances, events[index]);
      index += 1;
    }

    var monthKey = Utilities.formatDate(current, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM');
    if (!currentMonthKey || monthKey !== currentMonthKey) {
      if (currentMonthKey && lastTotals) {
        rows.push(buildMonthSummaryRow_(currentMonthKey, lastTotals, lastSnapshot));
        rows.push(new Array(4 + forecastAccounts.length).fill(''));
      }
      currentMonthKey = monthKey;
      rows.push(buildMonthHeaderRow_(currentMonthKey, forecastAccounts.length));
    }

    var totals = computeTotals_(balances, accountTypes);
    var snapshot = buildForecastBalanceCells_(balances, forecastAccounts);
    rows.push([
      new Date(current.getTime()),
      totals.cash,
      totals.debt,
      totals.net,
    ].concat(snapshot));

    dailyRowsForStats.push([totals.cash, totals.debt, totals.net]);
    lastTotals = totals;
    lastSnapshot = snapshot;
  }

  if (currentMonthKey && lastTotals) {
    rows.push(buildMonthSummaryRow_(currentMonthKey, lastTotals, lastSnapshot));
    rows.push(new Array(4 + forecastAccounts.length).fill(''));
  }

  var endingBalances = balances;
  var creditDelta = computeCreditDelta_(openingBalances, endingBalances, accountTypes);
  var sinkDelta = computeSinkFundDelta_(openingBalances, endingBalances, sinkFunds);

  rows.push(['Summary', '', '', '']);
  rows.push(['Avg Cash', averageColumn_(dailyRowsForStats, 0), '', '']);
  rows.push(['Avg Debt', averageColumn_(dailyRowsForStats, 1), '', '']);
  rows.push(['Min Cash', minColumn_(dailyRowsForStats, 0), '', '']);
  rows.push(['Max Cash', maxColumn_(dailyRowsForStats, 0), '', '']);
  rows.push(['Net Change', endingBalancesDelta_(openingBalances, endingBalances), '', '']);
  rows.push(['Credit Delta', creditDelta, '', '']);
  rows.push(['Sink Fund Delta', sinkDelta, '', '']);

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
      'Opening',
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

  var daysInRange = dailySummaryRows.length || 1;
  var monthsInRange = daysInRange / 30.44;
  var avgMonthlyIncome = (totalsByKind.Income || 0) / monthsInRange;
  var avgMonthlyExpense = (totalsByKind.Expense || 0) / monthsInRange;
  var largestExpense = getLargestExpense_(events);
  var cashRunwayMonths = avgMonthlyExpense ? endingTotals.cash / avgMonthlyExpense : '';

  var rows = [];
  var cols = Math.max(8, 2 + forecastAccounts.length);

  function addRow(values) {
    var row = new Array(cols).fill('');
    for (var i = 0; i < values.length && i < cols; i++) {
      row[i] = values[i];
    }
    rows.push(row);
  }

  addRow(['## End of Forecast']);
  addRow(['Date Range', dateRange, '', '', 'Days in Range', daysInRange]);
  addRow(['Ending Cash', endingTotals.cash, 'Ending Debt', endingTotals.debt, 'Ending Net', endingTotals.net, 'Net Change', endingTotals.net - openingTotals.net]);
  addRow(['Minimum Cash', minCash === null ? '' : minCash, 'Minimum Cash Date', minCashDate ? minCashDate : '', 'Maximum Cash', maxCash === null ? '' : maxCash, 'Maximum Cash Date', maxCashDate ? maxCashDate : '']);
  addRow(['Minimum Net', minNet === null ? '' : minNet, 'Minimum Net Date', minNetDate ? minNetDate : '', 'Maximum Net', maxNet === null ? '' : maxNet, 'Maximum Net Date', maxNetDate ? maxNetDate : '']);
  addRow(['Maximum Debt', maxDebt === null ? '' : maxDebt, 'Maximum Debt Date', maxDebtDate ? maxDebtDate : '', 'Days Cash < 0', countCashBelowZero_(dailySummaryRows), 'Cash Runway (mo)', cashRunwayMonths]);
  addRow(['', '']);

  if (forecastAccounts.length) {
    if (forecastAccounts.length + 2 > cols) {
      cols = forecastAccounts.length + 2;
    }
    addRow(['## Forecast Balances (Ending)']);
    addRow(['', ''].concat(forecastAccounts));
    addRow(['', ''].concat(buildForecastBalanceCells_(endingBalances, forecastAccounts)));
    addRow(['', '']);
  }

  addRow(['## Monthly Averages']);
  addRow(['Avg Monthly Income', avgMonthlyIncome, 'Avg Monthly Expenses', avgMonthlyExpense, 'Income - Expenses', (totalsByKind.Income || 0) - (totalsByKind.Expense || 0), 'Total Transfers', totalsByKind.Transfer || 0]);
  addRow(['Largest Expense', largestExpense ? largestExpense.name : '', 'Largest Expense Amount', largestExpense ? largestExpense.amount : '', '', '', '', '']);
  addRow(['', '']);

  addRow(['## Credit Accounts']);
  accounts
    .filter(function (account) {
      return account.type === Config.ACCOUNT_TYPES.CREDIT;
    })
    .forEach(function (account) {
      var series = getAccountSeriesFromDailySummary_(dailySummaryRows, forecastAccounts, account.name);
      var payoff = series ? getPayoffDate_(series) : '';
      var minBalance = series ? getMinValue_(series) : '';
      var maxBalance = series ? getMaxValue_(series) : '';
      addRow([account.name, '', '', '', '', '', '', '']);
      addRow(['Opening', account.balance || 0, 'Ending', endingBalances[account.name] || 0, 'Payoff Date', payoff || 'Not paid off', 'Lowest', minBalance]);
      addRow(['Highest', maxBalance, '', '', '', '', '', '']);
      addRow(['', '']);
    });

  addRow(['## Sink Funds']);
  accounts
    .filter(function (account) {
      return account.sinkFund === true;
    })
    .forEach(function (account) {
      var stats = getSinkFundStats_(events, account.name);
      var series = getAccountSeriesFromDailySummary_(dailySummaryRows, forecastAccounts, account.name);
      addRow([account.name, '', '', '', '', '', '', '']);
      addRow(['Opening', account.balance || 0, 'Ending', endingBalances[account.name] || 0, 'Min', series ? getMinValue_(series) : '', 'Min Date', series ? getMinDate_(series) : '']);
      addRow(['Inflows', stats.inflow, 'Outflows', stats.outflow, 'Net', stats.inflow - stats.outflow, '', '']);
      addRow(['', '']);
    });

  addRow(['## Breakdown']);
  addRow(['Transaction Type', 'Total', '', '', 'Behavior', 'Total', '', '']);
  Object.keys(totalsByKind)
    .sort()
    .forEach(function (kind) {
      addRow([kind, totalsByKind[kind] || 0]);
    });

  addRow(['', '']);
  addRow(['## Categories']);
  addRow(['Category', 'Total']);
  Object.keys(totalsByCategory)
    .sort()
    .forEach(function (category) {
      addRow([category, totalsByCategory[category]]);
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

function averageColumn_(rows, index) {
  var values = rows
    .map(function (row) {
      return row[index];
    })
    .filter(function (value) {
      return typeof value === 'number' && !isNaN(value);
    });
  if (!values.length) {
    return '';
  }
  return values.reduce(function (sum, value) {
    return sum + value;
  }, 0) / values.length;
}

function minColumn_(rows, index) {
  var values = rows
    .map(function (row) {
      return row[index];
    })
    .filter(function (value) {
      return typeof value === 'number' && !isNaN(value);
    });
  if (!values.length) {
    return '';
  }
  return Math.min.apply(null, values);
}

function maxColumn_(rows, index) {
  var values = rows
    .map(function (row) {
      return row[index];
    })
    .filter(function (value) {
      return typeof value === 'number' && !isNaN(value);
    });
  if (!values.length) {
    return '';
  }
  return Math.max.apply(null, values);
}

function endingBalancesDelta_(opening, ending) {
  var sum = 0;
  Object.keys(ending).forEach(function (name) {
    sum += (ending[name] || 0) - (opening[name] || 0);
  });
  return sum;
}

function computeCreditDelta_(opening, ending, accountTypes) {
  var sum = 0;
  Object.keys(ending).forEach(function (name) {
    if (accountTypes[name] === Config.ACCOUNT_TYPES.CREDIT) {
      sum += (ending[name] || 0) - (opening[name] || 0);
    }
  });
  return sum;
}

function computeSinkFundDelta_(opening, ending, sinkFunds) {
  return sinkFunds.reduce(function (sum, account) {
    return sum + ((ending[account.name] || 0) - (opening[account.name] || 0));
  }, 0);
}

function buildMonthHeaderRow_(monthKey, forecastCount) {
  var dateLabel = Utilities.formatDate(new Date(monthKey + '-01'), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'MMMM yyyy');
  var row = new Array(4 + forecastCount).fill('');
  row[0] = dateLabel;
  return row;
}

function buildMonthSummaryRow_(monthKey, totals, snapshot) {
  var dateLabel = Utilities.formatDate(new Date(monthKey + '-01'), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'MMM yyyy');
  var row = [
    dateLabel,
    'Month Summary',
    totals.cash,
    totals.debt,
  ];
  return row.concat(snapshot || []);
}

function getAccountSeriesFromDailySummary_(dailySummaryRows, forecastAccounts, accountName) {
  var idx = forecastAccounts.indexOf(accountName);
  if (idx === -1) {
    return null;
  }
  var colIndex = 4 + idx;
  return dailySummaryRows.map(function (row) {
    return { date: row[0], value: row[colIndex] };
  });
}

function getPayoffDate_(series) {
  for (var i = 0; i < series.length; i++) {
    if (series[i].value >= 0) {
      return series[i].date;
    }
  }
  return '';
}

function getMinValue_(series) {
  return series.reduce(function (min, point) {
    return min === null || point.value < min ? point.value : min;
  }, null);
}

function getMaxValue_(series) {
  return series.reduce(function (max, point) {
    return max === null || point.value > max ? point.value : max;
  }, null);
}

function getMinDate_(series) {
  var min = null;
  var date = '';
  series.forEach(function (point) {
    if (min === null || point.value < min) {
      min = point.value;
      date = point.date;
    }
  });
  return date;
}

function getSinkFundStats_(events, accountName) {
  return events.reduce(
    function (acc, event) {
      var amount = event.appliedAmount !== undefined ? event.appliedAmount : event.amount || 0;
      if (event.kind === 'Transfer' && event.to === accountName) {
        acc.inflow += amount;
      } else if (event.kind === 'Transfer' && event.from === accountName) {
        acc.outflow += amount;
      } else if (event.kind === 'Expense' && event.from === accountName) {
        acc.outflow += amount;
      }
      return acc;
    },
    { inflow: 0, outflow: 0 }
  );
}

function getLargestExpense_(events) {
  var largest = null;
  events.forEach(function (event) {
    if (event.kind !== 'Expense') {
      return;
    }
    var amount = event.appliedAmount !== undefined ? event.appliedAmount : event.amount || 0;
    if (!largest || amount > largest.amount) {
      largest = { name: event.name, amount: amount };
    }
  });
  return largest;
}

function countCashBelowZero_(dailySummaryRows) {
  return dailySummaryRows.reduce(function (count, row) {
    return row[1] < 0 ? count + 1 : count;
  }, 0);
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
    if (event.behavior === 'Repayment') {
      var target = event.to ? balances[event.to] || 0 : 0;
      if (target < 0) {
        var required = Math.abs(target);
        if (amount === 0 || amount > required) {
          amount = required;
        }
      } else {
        event.appliedAmount = 0;
        return;
      }
    }
    if (event.from) {
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
  var signedAmount = amount;
  if (event.kind === 'Expense' || (event.kind === 'Transfer' && event.from)) {
    signedAmount = -amount;
  }
  if (event.kind === 'Transfer') {
    var accounts = [event.from, event.to].filter(function (name) {
      return name && name !== 'External';
    });
    return accounts.map(function (accountName) {
      var rowAmount = signedAmount;
      if (accountName === event.to) {
        rowAmount = amount;
      }
      return [
        event.date,
        accountName,
        event.kind,
        event.name,
        rowAmount,
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
      signedAmount,
      event.behavior,
    ].concat(balanceSnapshot),
  ];
}
