// Core forecasting logic that applies events to balances.
const Engine = {
  runForecast: function () {
    toastStep_('Starting forecast...');
    Logger.info('Run started');
    resetRunState_();
    toastStep_('Checking active expenses...');
    deactivateExpiredExpenses_();
    toastStep_('Updating monthly spend values...');
    updateMonthlySpend_();
    toastStep_('Sorting expenses...');
    sortExpenseSheet_();
    toastStep_('Styling expense rows...');
    styleExpenseRows_();
    toastStep_('Updating sink fund reference...');
    updateSinkFundReference_();
    toastStep_('Reading input sheets...');
    Logger.info('Reading inputs...');
    var accounts = Readers.readAccounts();
    Logger.info('Accounts read: ' + accounts.length);
    var accountTypes = buildAccountTypeMap_(accounts);
    var incomeRules = Readers.readIncome();
    Logger.info('Income rules read: ' + incomeRules.length);
    var expenseRules = Readers.readExpenses();
    Logger.info('Expense rules read: ' + expenseRules.length);

    toastStep_('Building events...');
    Logger.info('Building events...');
    var events = Events.buildIncomeEvents(incomeRules).concat(
      Events.buildExpenseEvents(expenseRules)
    );
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
    var frequency = freqIndex !== -1 ? row[freqIndex] : null;

    var shouldDeactivate = false;
    var endKey = endDate ? Utilities.formatDate(normalizeDate_(endDate), tz, 'yyyy-MM-dd') : null;
    var startKey = startDate ? Utilities.formatDate(normalizeDate_(startDate), tz, 'yyyy-MM-dd') : null;

    if (endKey && startKey && endKey < startKey) {
      if (nameIndex !== -1) {
        Logger.warn('Expense date range invalid (end before start): ' + row[nameIndex]);
      } else {
        Logger.warn('Expense date range invalid (end before start) at row ' + (idx + 2));
      }
      return;
    }

    if (endKey && endKey < todayKey) {
      shouldDeactivate = true;
    } else if (frequency === Config.FREQUENCIES.ONCE && startKey && startKey < todayKey) {
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

function sortExpenseSheet_() {
  var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.EXPENSE);
  if (!sheet) {
    return;
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 3 || lastCol < 1) {
    return;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var categoryIndex = headers.indexOf('Category') + 1;
  var amountIndex = headers.indexOf('Amount') + 1;
  var startDateIndex = headers.indexOf('Start Date') + 1;
  var archiveIndex = headers.indexOf('Archive') + 1;
  var nameIndex = headers.indexOf('Name') + 1;
  if (!categoryIndex || !amountIndex || !startDateIndex || !archiveIndex || !nameIndex) {
    Logger.warn('Expense sort skipped: missing Archive, Category, Amount, Start Date, or Name header.');
    return;
  }

  clearSheetFilter_(sheet);
  var archiveRange = sheet.getRange(2, archiveIndex, lastRow - 1, 1);
  var archiveValues = archiveRange.getValues();
  var archiveUpdated = false;
  archiveValues.forEach(function (row, idx) {
    if (row[0] === '' || row[0] === null) {
      archiveValues[idx][0] = false;
      archiveUpdated = true;
    }
  });
  if (archiveUpdated) {
    archiveRange.setValues(archiveValues);
  }
  var range = sheet.getRange(2, 1, lastRow - 1, lastCol);
  range.sort([
    { column: archiveIndex, ascending: true },
    { column: categoryIndex, ascending: true },
    { column: startDateIndex, ascending: true },
    { column: nameIndex, ascending: true },
    { column: amountIndex, ascending: false },
  ]);
}

function styleExpenseRows_() {
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
  var archiveIndex = headers.indexOf('Archive');
  if (includeIndex === -1) {
    Logger.warn('Expense row styling skipped: missing Include header.');
    return;
  }

  var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
  var values = dataRange.getValues();
  var backgrounds = values.map(function (row) {
    var active = row[includeIndex] === true;
    var archived = archiveIndex !== -1 ? row[archiveIndex] === true : false;
    var color = '#ffffff';
    if (!active) {
      color = '#f2f2f2';
    } else if (archived) {
      color = '#e0e0e0';
    }
    return row.map(function () {
      return color;
    });
  });
  dataRange.setBackgrounds(backgrounds);
}

function updateMonthlySpend_() {
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
  var notesIndex = headers.indexOf('Notes');
  var monthlyIndex = headers.indexOf('Monthly Spend');
  var archiveIndex = headers.indexOf('Archive');

  if (notesIndex !== -1 && monthlyIndex === -1) {
    sheet.insertColumnBefore(notesIndex + 1);
    sheet.getRange(1, notesIndex + 1).setValue('Monthly Spend').setFontWeight('bold');
    lastCol += 1;
    headers.splice(notesIndex, 0, 'Monthly Spend');
    monthlyIndex = notesIndex;
  }

  if (notesIndex !== -1 && archiveIndex === -1 && monthlyIndex !== -1) {
    sheet.insertColumnAfter(monthlyIndex + 1);
    sheet.getRange(1, monthlyIndex + 2).setValue('Archive').setFontWeight('bold');
    lastCol += 1;
    headers.splice(monthlyIndex + 1, 0, 'Archive');
    archiveIndex = monthlyIndex + 1;
  }

  if (monthlyIndex !== -1 && archiveIndex !== -1 && archiveIndex !== monthlyIndex + 1) {
    var fromRange = sheet.getRange(1, archiveIndex + 1, sheet.getMaxRows(), 1);
    sheet.moveColumns(fromRange, monthlyIndex + 2);
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    archiveIndex = headers.indexOf('Archive');
    monthlyIndex = headers.indexOf('Monthly Spend');
  }

  if (monthlyIndex === -1) {
    Logger.warn('Monthly Spend update skipped: column not found.');
    return;
  }

  var amountIndex = headers.indexOf('Amount');
  var frequencyIndex = headers.indexOf('Frequency');
  var includeIndex = headers.indexOf('Include');
  if (amountIndex === -1 || frequencyIndex === -1 || includeIndex === -1) {
    Logger.warn('Monthly Spend update skipped: missing Include, Amount, or Frequency header.');
    return;
  }

  var rowCount = lastRow - 1;
  if (rowCount <= 0) {
    return;
  }

  var includeCol = columnToLetter_(includeIndex + 1);
  var amountCol = columnToLetter_(amountIndex + 1);
  var freqCol = columnToLetter_(frequencyIndex + 1);
  var sep = getFormulaSeparator_();

  var formulas = [];
  for (var i = 0; i < rowCount; i++) {
    var rowNumber = i + 2;
    var formula =
      '=IF($' +
      includeCol +
      rowNumber +
      sep +
      'IF($' +
      freqCol +
      rowNumber +
      '=\"' +
      Config.FREQUENCIES.DAILY +
      '\"' +
      sep +
      '$' +
      amountCol +
      rowNumber +
      '*30.44' +
      sep +
      'IF($' +
      freqCol +
      rowNumber +
      '=\"' +
      Config.FREQUENCIES.WEEKLY +
      '\"' +
      sep +
      '$' +
      amountCol +
      rowNumber +
      '*(52/12)' +
      sep +
      'IF($' +
      freqCol +
      rowNumber +
      '=\"' +
      Config.FREQUENCIES.FORTNIGHTLY +
      '\"' +
      sep +
      '$' +
      amountCol +
      rowNumber +
      '*(26/12)' +
      sep +
      'IF($' +
      freqCol +
      rowNumber +
      '=\"' +
      Config.FREQUENCIES.MONTHLY +
      '\"' +
      sep +
      '$' +
      amountCol +
      rowNumber +
      sep +
      'IF($' +
      freqCol +
      rowNumber +
      '=\"' +
      Config.FREQUENCIES.BIMONTHLY +
      '\"' +
      sep +
      '$' +
      amountCol +
      rowNumber +
      '/2' +
      sep +
      'IF($' +
      freqCol +
      rowNumber +
      '=\"' +
      Config.FREQUENCIES.QUARTERLY +
      '\"' +
      sep +
      '$' +
      amountCol +
      rowNumber +
      '/3' +
      sep +
      'IF($' +
      freqCol +
      rowNumber +
      '=\"' +
      Config.FREQUENCIES.SEMI_ANNUALLY +
      '\"' +
      sep +
      '$' +
      amountCol +
      rowNumber +
      '/6' +
      sep +
      'IF($' +
      freqCol +
      rowNumber +
      '=\"' +
      Config.FREQUENCIES.ANNUALLY +
      '\"' +
      sep +
      '$' +
      amountCol +
      rowNumber +
      '/12' +
      sep +
      'IF($' +
      freqCol +
      rowNumber +
      '=\"' +
      Config.FREQUENCIES.ONCE +
      '\"' +
      sep +
      '$' +
      amountCol +
      rowNumber +
      '/12' +
      sep +
      '\"\"' +
      ')))))))))' +
      sep +
      '\"\"' +
      ')';
    formulas.push([formula]);
  }

  var targetRange = sheet.getRange(2, monthlyIndex + 1, rowCount, 1);
  targetRange.setFormulas(formulas);
  targetRange.setNumberFormat('0.00');
  sheet.getRange(1, monthlyIndex + 1, rowCount + 1, 1).setBackground('#fff4cc');

  if (archiveIndex !== -1) {
    var archiveRange = sheet.getRange(2, archiveIndex + 1, rowCount, 1);
    var archiveRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    archiveRange.setDataValidation(archiveRule);
  }
}

function monthlyFactorForFrequency_(frequency) {
  switch (frequency) {
    case Config.FREQUENCIES.DAILY:
      return 30.44;
    case Config.FREQUENCIES.WEEKLY:
      return 52 / 12;
    case Config.FREQUENCIES.FORTNIGHTLY:
      return 26 / 12;
    case Config.FREQUENCIES.MONTHLY:
      return 1;
    case Config.FREQUENCIES.BIMONTHLY:
      return 1 / 2;
    case Config.FREQUENCIES.QUARTERLY:
      return 1 / 3;
    case Config.FREQUENCIES.SEMI_ANNUALLY:
      return 1 / 6;
    case Config.FREQUENCIES.ANNUALLY:
      return 1 / 12;
    case Config.FREQUENCIES.ONCE:
      return 1 / 12;
    default:
      return null;
  }
}

function getFormulaSeparator_() {
  var locale = SpreadsheetApp.getActive().getSpreadsheetLocale();
  var semicolonLocales = [
    'de',
    'fr',
    'es',
    'it',
    'pt',
    'nl',
    'fi',
    'sv',
    'da',
    'no',
    'ru',
    'tr',
    'pl',
    'cs',
    'sk',
    'hu',
    'ro',
    'bg',
    'hr',
    'sl',
    'sr',
    'lt',
    'lv',
    'et',
  ];
  var prefix = locale ? locale.split('_')[0] : '';
  return semicolonLocales.indexOf(prefix) !== -1 ? ';' : ',';
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
    var start = rule.startDate ? normalizeDate_(rule.startDate) : null;
    var endForCalc = rule.endDate ? normalizeDate_(rule.endDate) : null;
    if (!start) {
      Logger.warn('Sink fund skip: missing start date - ' + rule.name);
      return sum;
    }

    var divisorWeeks = windowWeeks;
    if (endForCalc) {
      var days = Math.max(1, Math.round((endForCalc.getTime() - start.getTime()) / 86400000));
      divisorWeeks = Math.max(1, Math.round(days / 7));
    }

    if (rule.frequency === Config.FREQUENCIES.ONCE) {
      total = rule.amount || 0;
      count = total ? 1 : 0;
    } else {
      var calcEnd = endForCalc ? endForCalc : addMonthsClamped_(start, 18);
      count = countOccurrences_(start, calcEnd, rule.frequency);
      total = (rule.amount || 0) * count;
    }

    if (total === 0) {
      Logger.warn('Sink fund skip: zero total - ' + rule.name + ' (count=' + count + ')');
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
    return sum + total * (windowWeeks / divisorWeeks);
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
    case Config.FREQUENCIES.DAILY:
      return 365;
    case Config.FREQUENCIES.WEEKLY:
      return 52;
    case Config.FREQUENCIES.FORTNIGHTLY:
      return 26;
    case Config.FREQUENCIES.MONTHLY:
      return 12;
    case Config.FREQUENCIES.BIMONTHLY:
      return 6;
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

function countOccurrences_(start, end, frequency) {
  if (!start || !end || start > end) {
    return 0;
  }
  var count = 0;
  var current = normalizeDate_(start);
  var last = normalizeDate_(end);
  while (current && current <= last) {
    count += 1;
    current = Recurrence.stepForward(current, frequency);
  }
  return count;
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
        forecastable,
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

function applyEvent_(balances, event) {
  var amount = roundUpCents_(event.amount || 0);

  if (event.kind === 'Income') {
    if (event.to) {
      balances[event.to] = roundUpCents_((balances[event.to] || 0) + amount);
    }
    event.appliedAmount = amount;
    return;
  }

  if (event.kind === 'Expense') {
    if (event.from) {
      balances[event.from] = roundUpCents_((balances[event.from] || 0) - amount);
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
          amount = roundUpCents_(required);
        }
      } else {
        event.appliedAmount = 0;
        return;
      }
    }
    if (event.from) {
      balances[event.from] = roundUpCents_((balances[event.from] || 0) - amount);
    }
    if (event.to) {
      balances[event.to] = roundUpCents_((balances[event.to] || 0) + amount);
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
  return {
    cash: roundUpCents_(cash),
    debt: roundUpCents_(debt),
    net: roundUpCents_(cash + debt),
  };
}

function normalizeDate_(value) {
  var date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildJournalEventRows_(
  event,
  balancesAfterFrom,
  balancesAfterTo,
  forecastable,
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

  var accountName = event.kind === 'Income' ? event.to : event.from;
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

  if (event.kind === 'Transfer') {
    if (event.behavior === 'Repayment') {
      var target = event.to ? balances[event.to] || 0 : 0;
      if (target < 0) {
        var required = Math.abs(target);
        if (amount === 0 || amount > required) {
          amount = roundUpCents_(required);
        }
      } else {
        event.appliedAmount = 0;
        event.skipJournal = true;
        if (!runState_.creditPaidOffWarned[event.name]) {
          Logger.warn('Credit paid off, skipping repayment: ' + event.name);
          runState_.creditPaidOffWarned[event.name] = true;
        }
        return { afterFrom: pre, afterTo: pre };
      }
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

