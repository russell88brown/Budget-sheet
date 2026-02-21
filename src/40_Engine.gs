// Core forecasting logic that applies events to balances.
const Engine = {
  runForecast: function () {
    toastStep_('Starting forecast...');
    Logger.info('Run started');
    resetRunState_();
    toastStep_('Checking active transfers...');
    deactivateExpiredTransfers_();
    normalizeTransferRows_();
    normalizeRecurrenceRows_();
    toastStep_('Checking active expenses...');
    deactivateExpiredExpenses_();
    toastStep_('Styling inactive transfers...');
    styleTransferRows_();
    toastStep_('Styling inactive expenses...');
    styleExpenseRows_();
    toastStep_('Reading input sheets...');
    Logger.info('Reading inputs...');
    var accounts = Readers.readAccounts();
    Logger.info('Accounts read: ' + accounts.length);
    var accountTypes = buildAccountTypeMap_(accounts);
    var incomeRules = Readers.readIncome();
    Logger.info('Income rules read: ' + incomeRules.length);
    var transferRules = Readers.readTransfers();
    Logger.info('Transfer rules read: ' + transferRules.length);
    var expenseRules = Readers.readExpenses();
    Logger.info('Expense rules read: ' + expenseRules.length);
    var expenseMonthlyTotals = updateExpenseMonthlyAverages_();
    updateAccountMonthlyFlowAverages_(incomeRules, expenseMonthlyTotals);

    toastStep_('Building events...');
    Logger.info('Building events...');
    var events = Events.buildIncomeEvents(incomeRules)
      .concat(Events.buildTransferEvents(transferRules))
      .concat(Events.buildExpenseEvents(expenseRules))
      .concat(Events.buildInterestEvents(accounts));
    Logger.info('Events built: ' + events.length);

    toastStep_('Sorting events by date...');
    Logger.info('Sorting events...');
    events.sort(function (a, b) {
      return a.date.getTime() - b.date.getTime();
    });
    Logger.info('Events sorted');

    Logger.info('Building outputs...');
    toastStep_('Building journal...');
    var journalData = buildJournalRows_(accounts, events);
    toastStep_('Writing journal...');
    Logger.info('Writing outputs...');
    Writers.writeJournal(journalData.rows, journalData.forecastAccounts, accountTypes);
    Logger.info('Outputs built');
    toastStep_('Writing logs...');
    Writers.writeLogs(Logger.flush());
    toastStep_('Forecast complete.');
    Logger.info('Run completed');
  },
};

function toast_(message) {
  try {
    SpreadsheetApp.getActive().toast(String(message), 'Budget Forecast', 5);
  } catch (err) {
    Logger.warn('Toast failed: ' + err);
  }
}

function toastStep_(message, delayMs) {
  toast_(message);
  var wait = typeof delayMs === 'number' ? delayMs : 600;
  if (wait > 0) {
    Utilities.sleep(wait);
  }
}

var runState_ = { creditPaidOffWarned: {} };

function resetRunState_() {
  runState_ = { creditPaidOffWarned: {} };
}

function deactivateExpiredExpenses_() {
  deactivateExpiredRows_(Config.SHEETS.EXPENSE, 'Expense');
}

function deactivateExpiredTransfers_() {
  deactivateExpiredRows_(Config.SHEETS.TRANSFERS, 'Transfer');
}

function deactivateExpiredRows_(sheetName, label) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
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
  var nameIndex = headers.indexOf('Name');

  if (includeIndex === -1 || startDateIndex === -1) {
    Logger.warn(label + ' auto-deactivate skipped: missing Include or Start Date header.');
    return;
  }

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var today = normalizeDate_(new Date());
  var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  var todayKey = Utilities.formatDate(today, tz, 'yyyy-MM-dd');
  var updated = 0;

  values.forEach(function (row, idx) {
    var include = row[includeIndex] === true;
    if (!include) {
      return;
    }
    var endDate = endDateIndex !== -1 ? row[endDateIndex] : null;
    var startDate = row[startDateIndex];
    var shouldDeactivate = false;
    var endKey = endDate ? Utilities.formatDate(normalizeDate_(endDate), tz, 'yyyy-MM-dd') : null;
    var startKey = startDate ? Utilities.formatDate(normalizeDate_(startDate), tz, 'yyyy-MM-dd') : null;

    if (endKey && startKey && endKey < startKey) {
      if (nameIndex !== -1) {
        Logger.warn(label + ' date range invalid (end before start): ' + row[nameIndex]);
      } else {
        Logger.warn(label + ' date range invalid (end before start) at row ' + (idx + 2));
      }
      return;
    }

    if (endKey && endKey < todayKey) {
      shouldDeactivate = true;
    }

    if (shouldDeactivate) {
      row[includeIndex] = false;
      updated += 1;
      if (nameIndex !== -1) {
        Logger.warn(label + ' deactivated (out of date): ' + row[nameIndex]);
      } else {
        Logger.warn(label + ' deactivated (out of date) at row ' + (idx + 2));
      }
    }
  });

  if (updated > 0) {
    sheet.getRange(2, 1, values.length, lastCol).setValues(values);
    Logger.info(label + 's auto-deactivated: ' + updated);
  }
}

function styleExpenseRows_() {
  styleInactiveRows_(Config.SHEETS.EXPENSE, 'Expense');
}

function styleTransferRows_() {
  styleInactiveRows_(Config.SHEETS.TRANSFERS, 'Transfer');
}

function styleInactiveRows_(sheetName, label) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
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
  if (includeIndex === -1) {
    Logger.warn(label + ' row styling skipped: missing Include header.');
    return;
  }

  var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
  var values = dataRange.getValues();
  var backgrounds = values.map(function (row) {
    var active = row[includeIndex] === true;
    var color = active ? '#ffffff' : '#f2f2f2';
    return row.map(function () {
      return color;
    });
  });
  dataRange.setBackgrounds(backgrounds);
}

function normalizeTransferRows_() {
  var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.TRANSFERS);
  if (!sheet) {
    return;
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var typeIdx = headers.indexOf('Transfer Type');
  var amountIdx = headers.indexOf('Amount');
  if (typeIdx === -1 || amountIdx === -1) {
    return;
  }

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var updated = false;
  values.forEach(function (row) {
    var amount = toNumber_(row[amountIdx]);
    var canonicalType = normalizeTransferType_(row[typeIdx], amount);
    if (canonicalType && canonicalType !== row[typeIdx]) {
      row[typeIdx] = canonicalType;
      updated = true;
    }
    if (canonicalType === Config.TRANSFER_TYPES.REPAYMENT_ALL && amount !== 0) {
      row[amountIdx] = 0;
      updated = true;
    }
  });

  if (updated) {
    sheet.getRange(2, 1, values.length, lastCol).setValues(values);
  }
}

function normalizeRecurrenceRows_() {
  normalizeRecurrenceRowsForSheet_(Config.SHEETS.INCOME);
  normalizeRecurrenceRowsForSheet_(Config.SHEETS.EXPENSE);
  normalizeRecurrenceRowsForSheet_(Config.SHEETS.TRANSFERS);
}

function normalizeRecurrenceRowsForSheet_(sheetName) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) {
    return;
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var frequencyIdx = headers.indexOf('Frequency');
  var repeatIdx = headers.indexOf('Repeat Every');
  var startIdx = headers.indexOf('Start Date');
  var endIdx = headers.indexOf('End Date');
  if (frequencyIdx === -1 || repeatIdx === -1) {
    return;
  }

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var updated = false;

  values.forEach(function (row) {
    var mapped = mapLegacyFrequency_(row[frequencyIdx], row[repeatIdx], startIdx === -1 ? null : row[startIdx], endIdx === -1 ? null : row[endIdx]);
    if (mapped.frequency !== row[frequencyIdx]) {
      row[frequencyIdx] = mapped.frequency;
      updated = true;
    }
    if (mapped.repeatEvery !== row[repeatIdx]) {
      row[repeatIdx] = mapped.repeatEvery;
      updated = true;
    }
    if (endIdx !== -1 && mapped.endDate !== row[endIdx]) {
      row[endIdx] = mapped.endDate;
      updated = true;
    }
  });

  if (updated) {
    sheet.getRange(2, 1, values.length, lastCol).setValues(values);
  }
}

function mapLegacyFrequency_(frequencyValue, repeatEveryValue, startDateValue, endDateValue) {
  var frequency = frequencyValue;
  var repeatEvery = repeatEveryValue;
  var endDate = endDateValue;
  var lower = frequency ? String(frequency).trim().toLowerCase() : '';

  if (lower === 'weekly') {
    frequency = Config.FREQUENCIES.WEEKLY;
  } else if (lower === 'biweekly' || lower === 'bi-weekly') {
    frequency = Config.FREQUENCIES.WEEKLY;
    repeatEvery = 2;
  } else if (lower === 'fortnightly') {
    frequency = Config.FREQUENCIES.WEEKLY;
    repeatEvery = 2;
  } else if (lower === 'bi-monthly' || lower === 'bimonthly') {
    frequency = Config.FREQUENCIES.MONTHLY;
    repeatEvery = 2;
  } else if (lower === 'quarterly') {
    frequency = Config.FREQUENCIES.MONTHLY;
    repeatEvery = 3;
  } else if (lower === 'semiannually' || lower === 'semi-annually') {
    frequency = Config.FREQUENCIES.MONTHLY;
    repeatEvery = 6;
  } else if (lower === 'annually') {
    frequency = Config.FREQUENCIES.YEARLY;
    repeatEvery = 1;
  } else if (lower === 'once' || lower === 'one-off') {
    frequency = Config.FREQUENCIES.DAILY;
    repeatEvery = 1;
    if (startDateValue && !endDateValue) {
      endDate = startDateValue;
    }
  } else if (lower === 'daily') {
    frequency = Config.FREQUENCIES.DAILY;
  } else if (lower === 'monthly') {
    frequency = Config.FREQUENCIES.MONTHLY;
  } else if (lower === 'yearly') {
    frequency = Config.FREQUENCIES.YEARLY;
  }

  if (frequency && (repeatEvery === '' || repeatEvery === null || repeatEvery === undefined)) {
    repeatEvery = 1;
  }

  return {
    frequency: frequency,
    repeatEvery: repeatEvery,
    endDate: endDate,
  };
}

function updateExpenseMonthlyAverages_() {
  var ss = SpreadsheetApp.getActive();
  var expenseSheet = ss.getSheetByName(Config.SHEETS.EXPENSE);
  if (!expenseSheet) {
    return {};
  }

  var expenseLastRow = expenseSheet.getLastRow();
  var expenseLastCol = expenseSheet.getLastColumn();
  if (expenseLastRow < 2 || expenseLastCol < 1) {
    return {};
  }

  var expenseHeaders = expenseSheet.getRange(1, 1, 1, expenseLastCol).getValues()[0];
  var includeIdx = expenseHeaders.indexOf('Include');
  var amountIdx = expenseHeaders.indexOf('Amount');
  var freqIdx = expenseHeaders.indexOf('Frequency');
  var repeatIdx = expenseHeaders.indexOf('Repeat Every');
  var startIdx = expenseHeaders.indexOf('Start Date');
  var endIdx = expenseHeaders.indexOf('End Date');
  var fromIdx = expenseHeaders.indexOf('From Account');
  var avgIdx = expenseHeaders.indexOf('Monthly Average');
  if (
    includeIdx === -1 ||
    amountIdx === -1 ||
    freqIdx === -1 ||
    repeatIdx === -1 ||
    fromIdx === -1 ||
    avgIdx === -1
  ) {
    return {};
  }

  var expenseValues = expenseSheet.getRange(2, 1, expenseLastRow - 1, expenseLastCol).getValues();
  var avgOut = [];
  var accountTotals = {};

  expenseValues.forEach(function (row) {
    var include = row[includeIdx] === true;
    var amount = toNumber_(row[amountIdx]);
    var recurrence = normalizeRecurrence_(
      row[freqIdx],
      row[repeatIdx],
      startIdx !== -1 ? row[startIdx] : null,
      endIdx !== -1 ? row[endIdx] : null
    );
    var frequency = recurrence.frequency;
    var repeatEvery = recurrence.repeatEvery;
    var startDate = recurrence.startDate;
    var endDate = recurrence.endDate;
    var fromAccount = row[fromIdx];

    var recurring = isRecurringExpense_(startDate, endDate);
    var monthlyAverage = null;
    if (include && recurring && amount !== null && amount >= 0 && frequency) {
      monthlyAverage = roundUpCents_((amount || 0) * monthlyFactorForRecurrence_(frequency, repeatEvery));
      if (fromAccount) {
        accountTotals[fromAccount] = roundUpCents_((accountTotals[fromAccount] || 0) + monthlyAverage);
      }
    }
    avgOut.push([monthlyAverage === null ? '' : monthlyAverage]);
  });

  expenseSheet.getRange(2, avgIdx + 1, avgOut.length, 1).setValues(avgOut);
  return accountTotals;
}

function updateAccountMonthlyFlowAverages_(incomeRules, expenseTotalsByAccount) {
  var accountsSheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.ACCOUNTS);
  if (!accountsSheet) {
    return;
  }
  expenseTotalsByAccount = expenseTotalsByAccount || {};
  var incomeTotalsByAccount = computeIncomeMonthlyTotals_(incomeRules);

  var lastRow = accountsSheet.getLastRow();
  var lastCol = accountsSheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return;
  }
  var headers = accountsSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var nameIdx = headers.indexOf('Account Name');
  var expenseAvgIdx = headers.indexOf('Expense Avg / Month');
  var incomeAvgIdx = headers.indexOf('Income Avg / Month');
  var netFlowIdx = headers.indexOf('Net Cash Flow / Month');
  if (nameIdx === -1) {
    return;
  }

  var rows = accountsSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var expenseAvgValues = rows.map(function (row) {
    var name = row[nameIdx];
    var value = expenseTotalsByAccount[name];
    return [value === undefined ? '' : value];
  });
  var incomeAvgValues = rows.map(function (row) {
    var name = row[nameIdx];
    var value = incomeTotalsByAccount[name];
    return [value === undefined ? '' : value];
  });
  var netFlowValues = rows.map(function (row) {
    var name = row[nameIdx];
    var expense = expenseTotalsByAccount[name];
    var income = incomeTotalsByAccount[name];
    if (expense === undefined && income === undefined) {
      return [''];
    }
    var expenseValue = expense === undefined ? 0 : expense;
    var incomeValue = income === undefined ? 0 : income;
    return [roundUpCents_(incomeValue - expenseValue)];
  });

  if (expenseAvgIdx !== -1) {
    accountsSheet.getRange(2, expenseAvgIdx + 1, expenseAvgValues.length, 1).setValues(expenseAvgValues);
  }
  if (incomeAvgIdx !== -1) {
    accountsSheet.getRange(2, incomeAvgIdx + 1, incomeAvgValues.length, 1).setValues(incomeAvgValues);
  }
  if (netFlowIdx !== -1) {
    accountsSheet.getRange(2, netFlowIdx + 1, netFlowValues.length, 1).setValues(netFlowValues);
  }
}

function computeIncomeMonthlyTotals_(incomeRules) {
  var totals = {};
  (incomeRules || []).forEach(function (rule) {
    if (!rule) {
      return;
    }
    var amount = toNumber_(rule.amount);
    var toAccount = rule.paidTo;
    var recurring = isRecurringExpense_(rule.startDate, rule.endDate);
    if (!recurring || amount === null || amount < 0 || !rule.frequency || !toAccount) {
      return;
    }
    var monthlyAverage = roundUpCents_((amount || 0) * monthlyFactorForRecurrence_(rule.frequency, rule.repeatEvery));
    totals[toAccount] = roundUpCents_((totals[toAccount] || 0) + monthlyAverage);
  });
  return totals;
}

function isRecurringExpense_(startDateValue, endDateValue) {
  var start = toDate_(startDateValue);
  var end = toDate_(endDateValue);
  if (!start || !end) {
    return true;
  }
  return normalizeDate_(start).getTime() !== normalizeDate_(end).getTime();
}

function monthlyFactorForRecurrence_(frequency, repeatEvery) {
  var periodsPerYear = Recurrence.periodsPerYear(frequency, repeatEvery);
  if (!periodsPerYear) {
    return 0;
  }
  return periodsPerYear / 12;
}

function buildJournalRows_(accounts, events) {
  var balances = buildBalanceMap_(accounts);
  var forecastable = buildForecastableMap_(accounts);
  var accountTypes = buildAccountTypeMap_(accounts);
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
    var snapshots = applyEventWithSnapshots_(balances, event);
    if (event.skipJournal) {
      return;
    }
    rows = rows.concat(
      buildJournalEventRows_(
        event,
        snapshots.afterFrom,
        snapshots.afterTo,
        forecastAccounts,
        accountTypes
      )
    );
  });

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
      '',
    ].concat(balanceSnapshot);
  });
}

function buildBalanceMap_(accounts) {
  var map = {};
  accounts.forEach(function (account) {
    map[account.name] = roundUpCents_(account.balance || 0);
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

function buildJournalEventRows_(
  event,
  balancesAfterFrom,
  balancesAfterTo,
  forecastAccounts,
  accountTypes
) {
  var balanceSnapshotFrom = buildForecastBalanceCells_(balancesAfterFrom, forecastAccounts);
  var balanceSnapshotTo = buildForecastBalanceCells_(balancesAfterTo, forecastAccounts);
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
      var snapshot = accountName === event.to ? balanceSnapshotTo : balanceSnapshotFrom;
      var balanceForRow = accountName === event.to ? balancesAfterTo : balancesAfterFrom;
      var cashNegative =
        accountTypes[accountName] !== Config.ACCOUNT_TYPES.CREDIT && balanceForRow[accountName] < 0;
      var creditPaidOff =
        accountTypes[accountName] === Config.ACCOUNT_TYPES.CREDIT &&
        Math.abs(roundUpCents_(balanceForRow[accountName])) === 0 &&
        rowAmount > 0;
      return [
        event.date,
        accountName,
        event.kind,
        event.name,
        rowAmount,
        buildAlerts_(cashNegative, creditPaidOff),
      ].concat(snapshot);
    });
  }

  var accountName;
  if (event.kind === 'Interest') {
    accountName = event.account;
  } else {
    accountName = event.kind === 'Income' ? event.to : event.from;
  }
  var cashNegative =
    accountTypes[accountName] !== Config.ACCOUNT_TYPES.CREDIT &&
    balancesAfterTo[accountName] < 0;
  var creditPaidOff =
    accountTypes[accountName] === Config.ACCOUNT_TYPES.CREDIT &&
    Math.abs(roundUpCents_(balancesAfterTo[accountName])) === 0 &&
    signedAmount > 0;
  return [
    [
      event.date,
      accountName || '',
      event.kind,
      event.name,
      signedAmount,
      buildAlerts_(cashNegative, creditPaidOff),
    ].concat(balanceSnapshotTo),
  ];
}

function buildAlerts_(cashNegative, creditPaidOff) {
  var alerts = [];
  if (cashNegative) {
    alerts.push('NEGATIVE_CASH');
  }
  if (creditPaidOff) {
    alerts.push('CREDIT_PAID_OFF');
  }
  return alerts.join(' | ');
}

function applyEventWithSnapshots_(balances, event) {
  var pre = cloneBalances_(balances);
  var amount = roundUpCents_(event.amount || 0);

  if (event.kind === 'Income') {
    if (event.to) {
      balances[event.to] = roundUpCents_((balances[event.to] || 0) + amount);
    }
    event.appliedAmount = amount;
    return { afterFrom: cloneBalances_(balances), afterTo: cloneBalances_(balances) };
  }

  if (event.kind === 'Expense') {
    if (event.from) {
      balances[event.from] = roundUpCents_((balances[event.from] || 0) - amount);
    }
    event.appliedAmount = amount;
    return { afterFrom: cloneBalances_(balances), afterTo: cloneBalances_(balances) };
  }

  if (event.kind === 'Interest') {
    var interestAccount = event.account;
    var interestAmount = computeInterestAmount_(balances, event);
    event.appliedAmount = interestAmount;
    if (interestAmount === 0) {
      event.skipJournal = true;
      return { afterFrom: pre, afterTo: pre };
    }
    if (interestAccount) {
      balances[interestAccount] = roundUpCents_((balances[interestAccount] || 0) + interestAmount);
    }
    return { afterFrom: cloneBalances_(balances), afterTo: cloneBalances_(balances) };
  }

  if (event.kind === 'Transfer') {
    var transferResolution = resolveTransferAmount_(balances, event, amount);
    amount = transferResolution.amount;
    if (transferResolution.skip) {
      return { afterFrom: pre, afterTo: pre };
    }

    var afterFrom = cloneBalances_(pre);
    if (event.from) {
      afterFrom[event.from] = roundUpCents_((afterFrom[event.from] || 0) - amount);
    }
    var afterTo = cloneBalances_(afterFrom);
    if (event.to) {
      afterTo[event.to] = roundUpCents_((afterTo[event.to] || 0) + amount);
    }
    Object.keys(afterTo).forEach(function (name) {
      balances[name] = afterTo[name];
    });
    event.appliedAmount = amount;
    return { afterFrom: afterFrom, afterTo: afterTo };
  }

  return { afterFrom: pre, afterTo: pre };
}

function resolveTransferAmount_(balances, event, amount) {
  var transferType = event.behavior;

  if (transferType === Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT) {
    var sourceBalance = event.from ? balances[event.from] || 0 : 0;
    var keepAmount = amount || 0;
    var moveAmount = roundUpCents_(Math.max(0, sourceBalance - keepAmount));
    if (moveAmount <= 0) {
      event.appliedAmount = 0;
      event.skipJournal = true;
      return { amount: 0, skip: true };
    }
    return { amount: moveAmount, skip: false };
  }

  if (transferType === Config.TRANSFER_TYPES.TRANSFER_AMOUNT) {
    if (amount <= 0) {
      event.appliedAmount = 0;
      event.skipJournal = true;
      return { amount: 0, skip: true };
    }
    return { amount: amount, skip: false };
  }

  if (
    transferType !== Config.TRANSFER_TYPES.REPAYMENT_AMOUNT &&
    transferType !== Config.TRANSFER_TYPES.REPAYMENT_ALL
  ) {
    return { amount: amount, skip: false };
  }

  var target = event.to ? balances[event.to] || 0 : 0;
  if (target >= 0) {
    event.appliedAmount = 0;
    event.skipJournal = true;
    if (!runState_.creditPaidOffWarned[event.name]) {
      Logger.warn('Credit paid off, skipping repayment: ' + event.name);
      runState_.creditPaidOffWarned[event.name] = true;
    }
    return { amount: 0, skip: true };
  }

  var required = Math.abs(target);
  var resolvedAmount = amount;
  if (transferType === Config.TRANSFER_TYPES.REPAYMENT_ALL) {
    resolvedAmount = required;
  } else if (resolvedAmount <= 0) {
    event.appliedAmount = 0;
    event.skipJournal = true;
    return { amount: 0, skip: true };
  } else if (resolvedAmount > required) {
    resolvedAmount = roundUpCents_(required);
  }
  return { amount: resolvedAmount, skip: false };
}

function computeInterestAmount_(balances, event) {
  if (!event) {
    return 0;
  }
  var account = event.account;
  if (!account) {
    return 0;
  }
  var rate = event.rate;
  if (rate === null || rate === undefined || rate === '') {
    return 0;
  }
  var frequency = event.frequency;
  var periodsPerYear = Recurrence.periodsPerYear(frequency, event.repeatEvery);
  if (!periodsPerYear) {
    return 0;
  }
  var annualRate = rate / 100;
  var periodRate = annualRate / periodsPerYear;
  if (event.method === Config.INTEREST_METHODS.APY_COMPOUND) {
    periodRate = Math.pow(1 + annualRate, 1 / periodsPerYear) - 1;
  }
  var balance = balances[account] || 0;
  if (!balance) {
    return 0;
  }
  return roundUpCents_(balance * periodRate);
}

function cloneBalances_(balances) {
  return Object.keys(balances).reduce(function (copy, key) {
    copy[key] = balances[key];
    return copy;
  }, {});
}

function roundUpCents_(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  if (typeof value !== 'number' || isNaN(value)) {
    return 0;
  }
  return Math.ceil(value * 100) / 100;
}

