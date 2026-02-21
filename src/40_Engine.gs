// Core forecasting logic that applies events to balances.
const Engine = {
  runForecast: function () {
    runJournalPipeline_({
      modeLabel: 'Forecast',
      startToast: 'Starting forecast...',
      completionToast: 'Forecast complete.',
      preprocessInputs: true,
      refreshSummaries: true,
    });
  },
  runJournalOnly: function () {
    runJournalPipeline_({
      modeLabel: 'Journal',
      startToast: 'Running journal...',
      completionToast: 'Journal run complete.',
      preprocessInputs: false,
      refreshSummaries: false,
    });
  },
};

function runJournalPipeline_(options) {
  options = options || {};
  var modeLabel = options.modeLabel || 'Run';
  var preprocessInputs = options.preprocessInputs === true;
  var refreshSummaries = options.refreshSummaries === true;

  toastStep_(options.startToast || 'Running...');
  Logger.info(modeLabel + ' started');
  resetRunState_();

  if (preprocessInputs) {
    preprocessInputSheets_();
  }

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

  if (refreshSummaries) {
    refreshAccountSummaries_(incomeRules);
  }

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
    var dateDiff = a.date.getTime() - b.date.getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }
    var priorityDiff = eventSortPriority_(a) - eventSortPriority_(b);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    var nameA = a.name || '';
    var nameB = b.name || '';
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
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
  toastStep_(options.completionToast || 'Run complete.');
  Logger.info(modeLabel + ' completed');
}

function preprocessInputSheets_() {
  normalizeAccountRows_();
  normalizeTransferRows_();
  normalizeRecurrenceRows_();
  toastStep_('Reviewing input sheets...');
  reviewAndCleanupInputSheets_();
  toastStep_('Checking active income...');
  deactivateExpiredIncome_();
  toastStep_('Checking active transfers...');
  deactivateExpiredTransfers_();
  toastStep_('Checking active expenses...');
  deactivateExpiredExpenses_();
  toastStep_('Styling inactive income...');
  styleIncomeRows_();
  toastStep_('Styling inactive transfers...');
  styleTransferRows_();
  toastStep_('Styling inactive expenses...');
  styleExpenseRows_();
}

function reviewAndCleanupInputSheets_() {
  var validAccounts = validateAccountsSheet_();
  validateIncomeSheet_(validAccounts);
  validateTransferSheet_(validAccounts);
  validateExpenseSheet_(validAccounts);
}

function buildAccountLookup_() {
  var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.ACCOUNTS);
  var lookup = {};
  var counts = {};
  if (!sheet) {
    return lookup;
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return lookup;
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var nameIdx = headers.indexOf('Account Name');
  if (nameIdx === -1) {
    return lookup;
  }
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  values.forEach(function (row) {
    var name = row[nameIdx];
    if (!name) {
      return;
    }
    var key = String(name).trim();
    counts[key] = (counts[key] || 0) + 1;
  });
  Object.keys(counts).forEach(function (name) {
    if (counts[name] === 1) {
      lookup[name] = true;
    }
  });
  return lookup;
}

function validateAccountsSheet_() {
  var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.ACCOUNTS);
  if (!sheet) {
    return {};
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return {};
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var nameIdx = headers.indexOf('Account Name');
  var includeIdx = headers.indexOf('Include');
  var typeIdx = headers.indexOf('Type');
  var balanceIdx = headers.indexOf('Balance');
  if (nameIdx === -1 || includeIdx === -1 || typeIdx === -1 || balanceIdx === -1) {
    return buildAccountLookup_();
  }

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var seen = {};

  values.forEach(function (row, idx) {
    if (!toBoolean_(row[includeIdx])) {
      return;
    }
    var name = row[nameIdx] ? String(row[nameIdx]).trim() : '';
    var type = normalizeAccountType_(row[typeIdx]);
    var balance = toNumber_(row[balanceIdx]);
    var reasons = [];

    if (!name) {
      reasons.push('missing account name');
    } else {
      if (seen[name]) {
        reasons.push('duplicate account name');
      }
      seen[name] = true;
    }
    if (type !== Config.ACCOUNT_TYPES.CASH && type !== Config.ACCOUNT_TYPES.CREDIT) {
      reasons.push('invalid account type');
    }
    if (balance === null) {
      reasons.push('invalid balance');
    }

    if (reasons.length) {
      Logger.warn('Account invalid: row ' + (idx + 2) + ' [' + reasons.join(', ') + ']');
    }
  });

  return buildAccountLookup_();
}

function validateIncomeSheet_(validAccounts) {
  validateAndDeactivateRows_(Config.SHEETS.INCOME, 'Income', function (row, indexes) {
    var reasons = [];
    if (!row[indexes.name]) {
      reasons.push('missing name');
    }
    var amount = toNumber_(row[indexes.amount]);
    if (amount === null || amount <= 0) {
      reasons.push('amount must be > 0');
    }
    if (!row[indexes.frequency]) {
      reasons.push('missing frequency');
    }
    if (!toDate_(row[indexes.start])) {
      reasons.push('missing/invalid start date');
    }
    var account = row[indexes.account] ? String(row[indexes.account]).trim() : '';
    if (!account) {
      reasons.push('missing to account');
    } else if (!validAccounts[account]) {
      reasons.push('unknown to account');
    }
    return reasons;
  });
}

function validateTransferSheet_(validAccounts) {
  validateAndDeactivateRows_(Config.SHEETS.TRANSFERS, 'Transfer', function (row, indexes) {
    var reasons = [];
    if (!row[indexes.name]) {
      reasons.push('missing name');
    }
    var amount = toNumber_(row[indexes.amount]);
    if (amount === null || amount < 0) {
      reasons.push('amount must be >= 0');
    }
    if (!row[indexes.frequency]) {
      reasons.push('missing frequency');
    }
    if (!toDate_(row[indexes.start])) {
      reasons.push('missing/invalid start date');
    }
    var transferType = normalizeTransferType_(row[indexes.type], amount);
    var validType =
      transferType === Config.TRANSFER_TYPES.REPAYMENT_AMOUNT ||
      transferType === Config.TRANSFER_TYPES.REPAYMENT_ALL ||
      transferType === Config.TRANSFER_TYPES.TRANSFER_AMOUNT ||
      transferType === Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT;
    if (!validType) {
      reasons.push('invalid transfer type');
    }
    var fromAccount = row[indexes.from] ? String(row[indexes.from]).trim() : '';
    var toAccount = row[indexes.to] ? String(row[indexes.to]).trim() : '';
    if (!fromAccount) {
      reasons.push('missing from account');
    } else if (!validAccounts[fromAccount]) {
      reasons.push('unknown from account');
    }
    if (!toAccount) {
      reasons.push('missing to account');
    } else if (!validAccounts[toAccount]) {
      reasons.push('unknown to account');
    }
    if (fromAccount && toAccount && fromAccount === toAccount) {
      reasons.push('from and to account cannot match');
    }
    return reasons;
  });
}

function validateExpenseSheet_(validAccounts) {
  validateAndDeactivateRows_(Config.SHEETS.EXPENSE, 'Expense', function (row, indexes) {
    var reasons = [];
    if (!row[indexes.name]) {
      reasons.push('missing name');
    }
    var amount = toNumber_(row[indexes.amount]);
    if (amount === null || amount < 0) {
      reasons.push('amount must be >= 0');
    }
    if (!row[indexes.frequency]) {
      reasons.push('missing frequency');
    }
    if (!toDate_(row[indexes.start])) {
      reasons.push('missing/invalid start date');
    }
    var fromAccount = row[indexes.from] ? String(row[indexes.from]).trim() : '';
    if (!fromAccount) {
      reasons.push('missing from account');
    } else if (!validAccounts[fromAccount]) {
      reasons.push('unknown from account');
    }
    return reasons;
  });
}

function validateAndDeactivateRows_(sheetName, label, validator) {
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
  var indexes = {
    include: headers.indexOf('Include'),
    type: headers.indexOf('Transfer Type'),
    name: headers.indexOf('Name'),
    amount: headers.indexOf('Amount'),
    frequency: headers.indexOf('Frequency'),
    start: headers.indexOf('Start Date'),
    account: headers.indexOf('To Account'),
    from: headers.indexOf('From Account'),
    to: headers.indexOf('To Account'),
  };

  if (
    indexes.include === -1 ||
    indexes.name === -1 ||
    indexes.amount === -1 ||
    indexes.frequency === -1 ||
    indexes.start === -1
  ) {
    Logger.warn(label + ' validation skipped: missing required headers.');
    return;
  }

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var updated = 0;
  values.forEach(function (row, idx) {
    if (!toBoolean_(row[indexes.include])) {
      return;
    }
    var reasons = validator(row, indexes) || [];
    if (!reasons.length) {
      return;
    }
    row[indexes.include] = false;
    updated += 1;
    Logger.warn(label + ' deactivated (invalid): row ' + (idx + 2) + ' [' + reasons.join(', ') + ']');
  });

  if (updated > 0) {
    sheet.getRange(2, 1, values.length, lastCol).setValues(values);
    Logger.info(label + 's deactivated for validation issues: ' + updated);
  }
}

function refreshAccountSummaries_(incomeRules) {
  var rules = incomeRules || Readers.readIncome();
  var expenseMonthlyTotals = updateExpenseMonthlyAverages_();
  updateAccountMonthlyFlowAverages_(rules, expenseMonthlyTotals);
}

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

var runState_ = {
  creditPaidOffWarned: {},
  interest: {},
};

function resetRunState_() {
  runState_ = {
    creditPaidOffWarned: {},
    interest: {},
  };
}

function deactivateExpiredExpenses_() {
  deactivateExpiredRows_(Config.SHEETS.EXPENSE, 'Expense');
}

function deactivateExpiredIncome_() {
  deactivateExpiredRows_(Config.SHEETS.INCOME, 'Income');
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
    var include = toBoolean_(row[includeIndex]);
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

function styleIncomeRows_() {
  styleInactiveRows_(Config.SHEETS.INCOME, 'Income');
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
    var active = toBoolean_(row[includeIndex]);
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
  } else if (lower === 'once' || lower === 'one-off' || lower === 'one off') {
    frequency = Config.FREQUENCIES.ONCE;
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

function normalizeAccountRows_() {
  var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.ACCOUNTS);
  if (!sheet) {
    return;
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return;
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var typeIdx = headers.indexOf('Type');
  var includeIdx = headers.indexOf('Include');
  var interestAvgIdx = headers.indexOf('Interest Avg / Month');
  var expenseAvgIdx = headers.indexOf('Expense Avg / Month');
  var incomeAvgIdx = headers.indexOf('Income Avg / Month');
  var netFlowIdx = headers.indexOf('Net Cash Flow / Month');
  var rateIdx = headers.indexOf('Interest Rate (APR %)');
  var feeIdx = headers.indexOf('Interest Fee / Month');
  var methodIdx = headers.indexOf('Interest Method');
  var freqIdx = headers.indexOf('Interest Frequency');
  var repeatIdx = headers.indexOf('Interest Repeat Every');
  if (typeIdx === -1 || includeIdx === -1 || methodIdx === -1 || freqIdx === -1 || repeatIdx === -1) {
    return;
  }

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var updated = false;
  values.forEach(function (row) {
    var method = normalizeInterestMethod_(row[methodIdx]);
    var frequency = normalizeInterestFrequency_(row[freqIdx]);
    var methodLooksLikeFrequency = normalizeInterestFrequency_(row[methodIdx]);
    var frequencyLooksLikeMethod = normalizeInterestMethod_(row[freqIdx]);
    if (!method && !frequency && methodLooksLikeFrequency && frequencyLooksLikeMethod) {
      method = frequencyLooksLikeMethod;
      frequency = methodLooksLikeFrequency;
    }

    if (typeIdx !== -1 && row[typeIdx]) {
      var normalizedType = normalizeAccountType_(row[typeIdx]);
      if (normalizedType && normalizedType !== row[typeIdx]) {
        row[typeIdx] = normalizedType;
        updated = true;
      }
    }
    if (includeIdx !== -1 && row[includeIdx] !== '' && row[includeIdx] !== null) {
      var include = toBoolean_(row[includeIdx]);
      if (include !== row[includeIdx]) {
        row[includeIdx] = include;
        updated = true;
      }
    }
    if (expenseAvgIdx !== -1 && !isValidAccountSummaryNumber_(row[expenseAvgIdx])) {
      row[expenseAvgIdx] = '';
      updated = true;
    }
    if (interestAvgIdx !== -1 && !isValidAccountSummaryNumber_(row[interestAvgIdx])) {
      row[interestAvgIdx] = '';
      updated = true;
    }
    if (incomeAvgIdx !== -1 && !isValidAccountSummaryNumber_(row[incomeAvgIdx])) {
      row[incomeAvgIdx] = '';
      updated = true;
    }
    if (netFlowIdx !== -1 && !isValidAccountSummaryNumber_(row[netFlowIdx])) {
      row[netFlowIdx] = '';
      updated = true;
    }
    if (rateIdx !== -1 && !isValidNumberOrBlank_(row[rateIdx])) {
      row[rateIdx] = '';
      updated = true;
    }
    if (feeIdx !== -1 && !isValidNumberOrBlank_(row[feeIdx])) {
      row[feeIdx] = '';
      updated = true;
    }
    if (method !== row[methodIdx]) {
      row[methodIdx] = method || '';
      updated = true;
    }
    if (frequency !== row[freqIdx]) {
      row[freqIdx] = frequency || '';
      updated = true;
    }

    var repeatEvery = toPositiveInt_(row[repeatIdx]);
    var normalizedRepeat = frequency ? (repeatEvery || 1) : '';
    if (normalizedRepeat !== row[repeatIdx]) {
      row[repeatIdx] = normalizedRepeat;
      updated = true;
    }
  });

  if (updated) {
    sheet.getRange(2, 1, values.length, lastCol).setValues(values);
  }
}

function normalizeInterestMethod_(value) {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  var lower = String(value).trim().toLowerCase();
  if (lower === String(Config.INTEREST_METHODS.APR_SIMPLE).toLowerCase()) {
    return Config.INTEREST_METHODS.APR_SIMPLE;
  }
  if (lower === String(Config.INTEREST_METHODS.APY_COMPOUND).toLowerCase()) {
    return Config.INTEREST_METHODS.APY_COMPOUND;
  }
  return '';
}

function normalizeInterestFrequency_(value) {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  var lower = String(value).trim().toLowerCase();
  if (lower === String(Config.FREQUENCIES.DAILY).toLowerCase()) {
    return Config.FREQUENCIES.DAILY;
  }
  if (lower === String(Config.FREQUENCIES.WEEKLY).toLowerCase()) {
    return Config.FREQUENCIES.WEEKLY;
  }
  if (lower === String(Config.FREQUENCIES.MONTHLY).toLowerCase()) {
    return Config.FREQUENCIES.MONTHLY;
  }
  if (lower === String(Config.FREQUENCIES.YEARLY).toLowerCase()) {
    return Config.FREQUENCIES.YEARLY;
  }
  return '';
}

function normalizeAccountType_(value) {
  var lower = String(value).trim().toLowerCase();
  if (lower === String(Config.ACCOUNT_TYPES.CASH).toLowerCase()) {
    return Config.ACCOUNT_TYPES.CASH;
  }
  if (lower === String(Config.ACCOUNT_TYPES.CREDIT).toLowerCase()) {
    return Config.ACCOUNT_TYPES.CREDIT;
  }
  return value;
}

function isValidNumberOrBlank_(value) {
  if (value === '' || value === null || value === undefined) {
    return true;
  }
  return toNumber_(value) !== null;
}

function isValidAccountSummaryNumber_(value) {
  if (value === '' || value === null || value === undefined) {
    return true;
  }
  return typeof value === 'number' && !isNaN(value);
}

function eventSortPriority_(event) {
  if (!event || !event.kind) {
    return 50;
  }
  if (event.kind === 'Interest' && event.interestAccrual === true) {
    return 20;
  }
  if (event.kind === 'Interest') {
    return 30;
  }
  return 10;
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

    var recurring = isRecurringForMonthlyAverage_({
      startDate: startDate,
      endDate: endDate,
      isSingleOccurrence: recurrence.isSingleOccurrence,
    });
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
  var balanceIdx = headers.indexOf('Balance');
  var includeIdx = headers.indexOf('Include');
  var interestAvgIdx = headers.indexOf('Interest Avg / Month');
  var expenseAvgIdx = headers.indexOf('Expense Avg / Month');
  var incomeAvgIdx = headers.indexOf('Income Avg / Month');
  var netFlowIdx = headers.indexOf('Net Cash Flow / Month');
  var rateIdx = headers.indexOf('Interest Rate (APR %)');
  var feeIdx = headers.indexOf('Interest Fee / Month');
  var methodIdx = headers.indexOf('Interest Method');
  var frequencyIdx = headers.indexOf('Interest Frequency');
  if (nameIdx === -1) {
    return;
  }

  var rows = accountsSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var interestAvgValues = rows.map(function (row) {
    var included = includeIdx === -1 || toBoolean_(row[includeIdx]);
    if (!included) {
      return [''];
    }
    var rate = rateIdx === -1 ? null : toNumber_(row[rateIdx]);
    var balance = balanceIdx === -1 ? null : toNumber_(row[balanceIdx]);
    var frequency = frequencyIdx === -1 ? null : row[frequencyIdx];
    var method = methodIdx === -1 ? '' : row[methodIdx];
    if (rate === null || balance === null || !frequency) {
      return [0];
    }
    return [computeEstimatedMonthlyInterest_(balance, rate, method)];
  });
  var expenseAvgValues = rows.map(function (row) {
    var included = includeIdx === -1 || toBoolean_(row[includeIdx]);
    if (!included) {
      return [''];
    }
    var name = row[nameIdx];
    var value = expenseTotalsByAccount[name];
    var fee = feeIdx === -1 ? null : toNumber_(row[feeIdx]);
    var total = value === undefined ? 0 : value;
    if (fee !== null && fee > 0) {
      total = roundUpCents_(total + fee);
    }
    return [total];
  });
  var incomeAvgValues = rows.map(function (row) {
    var included = includeIdx === -1 || toBoolean_(row[includeIdx]);
    if (!included) {
      return [''];
    }
    var name = row[nameIdx];
    var value = incomeTotalsByAccount[name];
    return [value === undefined ? 0 : value];
  });
  var netFlowValues = rows.map(function (row) {
    var included = includeIdx === -1 || toBoolean_(row[includeIdx]);
    if (!included) {
      return [''];
    }
    var name = row[nameIdx];
    var expense = expenseTotalsByAccount[name];
    var income = incomeTotalsByAccount[name];
    var fee = feeIdx === -1 ? null : toNumber_(row[feeIdx]);
    var hasFee = fee !== null && fee > 0;
    var expenseValue = expense === undefined ? 0 : expense;
    if (hasFee) {
      expenseValue = roundUpCents_(expenseValue + fee);
    }
    var incomeValue = income === undefined ? 0 : income;
    return [roundUpCents_(incomeValue - expenseValue)];
  });

  if (expenseAvgIdx !== -1) {
    accountsSheet.getRange(2, expenseAvgIdx + 1, expenseAvgValues.length, 1).setValues(expenseAvgValues);
  }
  if (interestAvgIdx !== -1) {
    accountsSheet.getRange(2, interestAvgIdx + 1, interestAvgValues.length, 1).setValues(interestAvgValues);
  }
  if (incomeAvgIdx !== -1) {
    accountsSheet.getRange(2, incomeAvgIdx + 1, incomeAvgValues.length, 1).setValues(incomeAvgValues);
  }
  if (netFlowIdx !== -1) {
    accountsSheet.getRange(2, netFlowIdx + 1, netFlowValues.length, 1).setValues(netFlowValues);
  }
}

function computeEstimatedMonthlyInterest_(balance, ratePercent, method) {
  var annualRate = ratePercent / 100;
  var monthlyRate = annualRate / 12;
  if (method === Config.INTEREST_METHODS.APY_COMPOUND) {
    monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
  }
  return roundUpCents_(balance * monthlyRate);
}

function computeIncomeMonthlyTotals_(incomeRules) {
  var totals = {};
  (incomeRules || []).forEach(function (rule) {
    if (!rule) {
      return;
    }
    var amount = toNumber_(rule.amount);
    var toAccount = rule.paidTo;
    var recurring = isRecurringForMonthlyAverage_(rule);
    if (!recurring || amount === null || amount < 0 || !rule.frequency || !toAccount) {
      return;
    }
    var monthlyAverage = roundUpCents_((amount || 0) * monthlyFactorForRecurrence_(rule.frequency, rule.repeatEvery));
    totals[toAccount] = roundUpCents_((totals[toAccount] || 0) + monthlyAverage);
  });
  return totals;
}

function isRecurringExpense_(startDateValue, endDateValue) {
  return isRecurringForMonthlyAverage_({
    startDate: startDateValue,
    endDate: endDateValue,
    isSingleOccurrence: false,
  });
}

function isRecurringForMonthlyAverage_(rule) {
  if (rule && rule.isSingleOccurrence) {
    return false;
  }
  var startDateValue = rule ? rule.startDate : null;
  var endDateValue = rule ? rule.endDate : null;
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
  if (event.interestAccrual) {
    accrueDailyInterest_(balances, event);
    return 0;
  }
  var account = event.account;
  if (!account) {
    return 0;
  }
  var bucket = getInterestBucket_(account);
  var accrued = bucket.accrued || 0;
  var fee = computeInterestFeePerPosting_(event);
  bucket.accrued = 0;
  bucket.lastPostingDate = event.date ? normalizeDate_(event.date) : null;
  return roundUpCents_(accrued - fee);
}

function accrueDailyInterest_(balances, event) {
  var account = event.account;
  if (!account) {
    return;
  }
  var rate = event.rate;
  if (rate === null || rate === undefined || rate === '') {
    return;
  }
  var balance = balances[account] || 0;
  if (!balance) {
    return;
  }
  var annualRate = rate / 100;
  var dailyRate = annualRate / 365;
  if (event.method === Config.INTEREST_METHODS.APY_COMPOUND) {
    dailyRate = Math.pow(1 + annualRate, 1 / 365) - 1;
  }
  var bucket = getInterestBucket_(account);
  bucket.accrued = (bucket.accrued || 0) + balance * dailyRate;
}

function computeInterestFeePerPosting_(event) {
  var monthlyFee = toNumber_(event.monthlyFee);
  if (monthlyFee === null || monthlyFee <= 0) {
    return 0;
  }
  var periodsPerYear = Recurrence.periodsPerYear(event.frequency, event.repeatEvery);
  if (!periodsPerYear) {
    return monthlyFee;
  }
  return monthlyFee * (12 / periodsPerYear);
}

function getInterestBucket_(accountName) {
  runState_.interest = runState_.interest || {};
  if (!runState_.interest[accountName]) {
    runState_.interest[accountName] = { accrued: 0, lastPostingDate: null };
  }
  return runState_.interest[accountName];
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
  var absolute = Math.abs(value);
  var rounded = Math.round((absolute + Number.EPSILON) * 100) / 100;
  return value < 0 ? -rounded : rounded;
}

