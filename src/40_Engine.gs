// Core forecasting logic that applies events to balances.
const Engine = {
  runForecast: function () {
    this.runForecastForScenario(Config.SCENARIOS.DEFAULT);
  },
  runForecastForScenario: function (scenarioId) {
    var activeScenarioId = resolveScenarioId_(scenarioId);
    runJournalPipeline_({
      modeLabel: 'Forecast',
      startToast: 'Starting forecast...',
      completionToast: 'Forecast complete.',
      preprocessInputs: true,
      refreshSummaries: activeScenarioId === Config.SCENARIOS.DEFAULT,
      toastDelayMs: 600,
      scenarioId: activeScenarioId,
    });
  },
  runJournalOnly: function () {
    this.runJournalForScenario(Config.SCENARIOS.DEFAULT);
  },
  runJournalForScenario: function (scenarioId) {
    var activeScenarioId = resolveScenarioId_(scenarioId);
    runJournalPipeline_({
      modeLabel: 'Journal',
      startToast: 'Running journal...',
      completionToast: 'Journal run complete.',
      preprocessInputs: false,
      refreshSummaries: false,
      toastDelayMs: 0,
      scenarioId: activeScenarioId,
    });
  },
  runJournalForScenarioModel: function (scenarioModel) {
    var model = scenarioModel || buildScenarioModel_(Config.SCENARIOS.DEFAULT);
    runJournalPipeline_({
      modeLabel: 'Journal',
      startToast: 'Running journal...',
      completionToast: 'Journal run complete.',
      preprocessInputs: false,
      refreshSummaries: false,
      toastDelayMs: 0,
      scenarioId: resolveScenarioId_(model.scenarioId),
      scenarioModel: model,
    });
  },
};

function runJournalPipeline_(options) {
  options = options || {};
  var modeLabel = options.modeLabel || 'Run';
  var scenarioId = resolveScenarioId_(options.scenarioId);
  var scenarioModel = options.scenarioModel || null;
  var preprocessInputs = options.preprocessInputs === true;
  var refreshSummaries = options.refreshSummaries === true;
  var totalSteps = preprocessInputs ? 10 : 7;
  var preprocessReport = null;
  resetForecastWindowCache_();
  getForecastWindow_();

  try {
    startRunProgress_(modeLabel, totalSteps);
    toastStep_(options.startToast || 'Running...');
    resetRunState_();

    if (preprocessInputs) {
      preprocessReport = preprocessInputSheets_();
    }

    toastStep_('Reading input sheets...');
    if (!scenarioModel) {
      scenarioModel = buildScenarioModel_(scenarioId);
    }
    var accounts = scenarioModel.accounts || [];
    assertUniqueScenarioAccountNames_(scenarioModel.scenarioId, accounts);
    var accountTypes = buildAccountTypeMap_(accounts);
    var incomeRules = scenarioModel.incomeRules || [];
    var transferRules = scenarioModel.transferRules || [];
    var expenseRules = scenarioModel.expenseRules || [];
    var policies = scenarioModel.policies || [];
    var goals = scenarioModel.goals || [];
    var riskSettings = scenarioModel.riskSettings || [];

    if (refreshSummaries) {
      refreshAccountSummariesForScenarioModel_(scenarioModel);
    }

    toastStep_('Building events...');
    var events = Events.buildIncomeEvents(incomeRules)
      .concat(Events.buildTransferEvents(transferRules))
      .concat(Events.buildExpenseEvents(expenseRules))
      .concat(Events.buildInterestEvents(accounts));

    toastStep_('Sorting events by date...');
    events.sort(function (a, b) {
      var dateDiff = normalizeDate_(a.date).getTime() - normalizeDate_(b.date).getTime();
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

    toastStep_('Building journal...');
    var journalData = buildJournalRows_(accounts, events, policies, riskSettings, scenarioId);
    toastStep_('Writing journal...');
    Writers.writeJournal(journalData.rows, journalData.forecastAccounts, accountTypes);
    recordLastRunMetadata_(modeLabel, scenarioId, 'Success', preprocessReport);
    toastStep_(options.completionToast || 'Run complete.');
  } catch (err) {
    recordLastRunMetadata_(modeLabel, scenarioId, 'Failed', preprocessReport);
    throw err;
  } finally {
    endRunProgress_();
    resetForecastWindowCache_();
  }
}

function resolveScenarioId_(scenarioId) {
  return normalizeScenario_(scenarioId);
}

function filterByScenario_(rows, scenarioId) {
  if (!Array.isArray(rows) || !rows.length) {
    return [];
  }
  var activeScenarioId = resolveScenarioId_(scenarioId);
  return rows.filter(function (row) {
    var rowScenarioId = row ? resolveScenarioId_(row.scenarioId) : Config.SCENARIOS.DEFAULT;
    return rowScenarioId === activeScenarioId;
  });
}

function filterByScenarioSet_(rows, scenarioIds) {
  if (!Array.isArray(rows) || !rows.length) {
    return [];
  }
  var ids = Array.isArray(scenarioIds) ? scenarioIds : [scenarioIds];
  var lookup = {};
  ids.forEach(function (scenarioId) {
    lookup[resolveScenarioId_(scenarioId)] = true;
  });
  return rows.filter(function (row) {
    var rowScenarioId = row ? resolveScenarioId_(row.scenarioId) : Config.SCENARIOS.DEFAULT;
    return !!lookup[rowScenarioId];
  });
}

function preprocessInputSheets_() {
  toastStep_('Normalizing input rows...');
  normalizeAccountRows_();
  normalizeTransferRows_();
  normalizeRecurrenceRows_();
  toastStep_('Reviewing and validating input sheets...');
  var validationReport = reviewAndCleanupInputSheets_();
  toastStep_('Applying date-based include flags...');
  flagExpiredIncome_();
  flagExpiredTransfers_();
  flagExpiredExpenses_();
  flagExpiredPolicies_();
  return {
    scenarioValidation: validationReport && validationReport.scenarioValidation
      ? validationReport.scenarioValidation
      : { totalDisabled: 0, bySheet: {} },
  };
}

function reviewAndCleanupInputSheets_() {
  var validScenarios = buildScenarioLookup_();
  var scenarioValidation = validateScenariosAcrossInputs_(validScenarios);
  if (scenarioValidation.totalDisabled > 0) {
    toastStep_(
      'Disabled ' +
        scenarioValidation.totalDisabled +
        ' row(s) with unknown scenario values.'
    );
  }
  var validAccounts = validateAccountsSheet_();
  validatePoliciesSheet_(validAccounts);
  validateGoalsSheet_(validAccounts);
  validateRiskSheet_(validAccounts);
  validateIncomeSheet_(validAccounts);
  validateTransferSheet_(validAccounts);
  validateExpenseSheet_(validAccounts);
  return {
    scenarioValidation: scenarioValidation,
  };
}

function buildScenarioLookup_() {
  var scenarios = Readers.readScenarios();
  var lookup = {};
  (scenarios || []).forEach(function (scenarioId) {
    lookup[resolveScenarioId_(scenarioId)] = true;
  });
  lookup[Config.SCENARIOS.DEFAULT] = true;
  return lookup;
}

function validateScenariosAcrossInputs_(validScenarios) {
  var inputSheets = [
    Config.SHEETS.ACCOUNTS,
    Config.SHEETS.POLICIES,
    Config.SHEETS.GOALS,
    Config.SHEETS.RISK,
    Config.SHEETS.INCOME,
    Config.SHEETS.TRANSFERS,
    Config.SHEETS.EXPENSE,
  ];
  var summary = { totalDisabled: 0, bySheet: {} };
  inputSheets.forEach(function (sheetName) {
    var disabledCount = disableRowsWithUnknownScenario_(sheetName, validScenarios);
    if (disabledCount > 0) {
      summary.bySheet[sheetName] = disabledCount;
      summary.totalDisabled += disabledCount;
    }
  });
  return summary;
}

function disableRowsWithUnknownScenario_(sheetName, validScenarios) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) {
    return 0;
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return 0;
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var includeIdx = headers.indexOf('Include');
  var scenarioIdx = headers.indexOf('Scenario');
  if (includeIdx === -1 || scenarioIdx === -1) {
    return 0;
  }

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var updated = false;
  var disabledCount = 0;
  values.forEach(function (row) {
    if (!toBoolean_(row[includeIdx])) {
      return;
    }
    var scenarioId = resolveScenarioId_(row[scenarioIdx]);
    if (!validScenarios[scenarioId]) {
      row[includeIdx] = false;
      updated = true;
      disabledCount += 1;
    }
  });

  if (updated) {
    sheet.getRange(2, 1, values.length, lastCol).setValues(values);
  }
  return disabledCount;
}

function recordLastRunMetadata_(modeLabel, scenarioId, status, details) {
  var ss = SpreadsheetApp.getActive();
  var settingsSheet = ss.getSheetByName(Config.LISTS_SHEET);
  if (!settingsSheet) {
    return;
  }
  setupReferenceLayout_(ss, settingsSheet);
  settingsSheet.getRange('B5').setValue(modeLabel || 'Run');
  settingsSheet.getRange('B6').setValue(resolveScenarioId_(scenarioId));
  settingsSheet.getRange('B7').setValue(new Date());
  settingsSheet.getRange('B8').setValue(status || '');
  settingsSheet.getRange('C5').setValue('');
  settingsSheet.getRange('B7').setNumberFormat('yyyy-mm-dd hh:mm');
  appendRunLogEntry_(settingsSheet, modeLabel, scenarioId, status, details);
}

function appendRunLogEntry_(settingsSheet, modeLabel, scenarioId, status, details) {
  if (!settingsSheet) {
    return;
  }
  var scenarioValidation = details && details.scenarioValidation ? details.scenarioValidation : null;
  var notes = '';
  if (scenarioValidation && scenarioValidation.totalDisabled > 0) {
    notes = 'Disabled unknown scenario rows: ' + scenarioValidation.totalDisabled;
  }

  var row = 2;
  var maxRows = settingsSheet.getMaxRows();
  while (row <= maxRows && settingsSheet.getRange(row, 10).getValue() !== '') {
    row += 1;
  }
  if (row > maxRows) {
    settingsSheet.insertRowsAfter(maxRows, 1);
    row = maxRows + 1;
  }
  settingsSheet.getRange(row, 10, 1, 5).setValues([
    [new Date(), modeLabel || 'Run', resolveScenarioId_(scenarioId), status || '', notes],
  ]);
  settingsSheet.getRange(row, 10).setNumberFormat('yyyy-mm-dd hh:mm');
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
    var key = normalizeAccountLookupKey_(name);
    if (!key) {
      return;
    }
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

  var validAccounts = buildAccountLookup_();
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
    }
  });

  return validAccounts;
}

function validatePoliciesSheet_(validAccounts) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.POLICIES);
  if (!sheet) {
    return;
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var idx = {
    include: headers.indexOf('Include'),
    type: headers.indexOf('Policy Type'),
    name: headers.indexOf('Name'),
    priority: headers.indexOf('Priority'),
    start: headers.indexOf('Start Date'),
    end: headers.indexOf('End Date'),
    trigger: headers.indexOf('Trigger Account'),
    funding: headers.indexOf('Funding Account'),
    threshold: headers.indexOf('Threshold'),
    maxPerEvent: headers.indexOf('Max Per Event'),
  };
  if (
    idx.include === -1 ||
    idx.type === -1 ||
    idx.name === -1 ||
    idx.trigger === -1 ||
    idx.funding === -1
  ) {
    return;
  }

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var updated = 0;
  values.forEach(function (row, rowIndex) {
    if (!toBoolean_(row[idx.include])) {
      return;
    }
    var reasons = [];
    var policyType = normalizePolicyType_(row[idx.type]);
    var name = row[idx.name] ? String(row[idx.name]).trim() : '';
    var trigger = normalizeAccountLookupKey_(row[idx.trigger]);
    var funding = normalizeAccountLookupKey_(row[idx.funding]);
    var threshold = idx.threshold === -1 ? null : toNumber_(row[idx.threshold]);
    var maxPerEvent = idx.maxPerEvent === -1 ? null : toNumber_(row[idx.maxPerEvent]);

    if (policyType !== Config.POLICY_TYPES.AUTO_DEFICIT_COVER) {
      reasons.push('invalid policy type');
    }
    if (!name) {
      reasons.push('missing name');
    }
    if (!trigger) {
      reasons.push('missing trigger account');
    } else if (!validAccounts[trigger]) {
      reasons.push('unknown trigger account');
    }
    if (!funding) {
      reasons.push('missing funding account');
    } else if (!validAccounts[funding]) {
      reasons.push('unknown funding account');
    }
    if (trigger && funding && trigger === funding) {
      reasons.push('trigger and funding account cannot match');
    }
    if (idx.priority !== -1 && row[idx.priority] !== '' && toPositiveInt_(row[idx.priority]) === null) {
      reasons.push('invalid priority');
    }
    if (idx.start !== -1 && row[idx.start] && !toDate_(row[idx.start])) {
      reasons.push('invalid start date');
    }
    if (idx.end !== -1 && row[idx.end] && !toDate_(row[idx.end])) {
      reasons.push('invalid end date');
    }
    if (threshold !== null && threshold < 0) {
      reasons.push('threshold must be >= 0');
    }
    if (maxPerEvent !== null && maxPerEvent <= 0) {
      reasons.push('max per event must be > 0');
    }

    if (!reasons.length) {
      return;
    }
    row[idx.include] = false;
    updated += 1;
  });

  if (updated > 0) {
    sheet.getRange(2, 1, values.length, lastCol).setValues(values);
  }
}

function validateGoalsSheet_(validAccounts) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.GOALS);
  if (!sheet) {
    return;
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var idx = {
    include: headers.indexOf('Include'),
    name: headers.indexOf('Goal Name'),
    targetAmount: headers.indexOf('Target Amount'),
    targetDate: headers.indexOf('Target Date'),
    priority: headers.indexOf('Priority'),
    fundingAccount: headers.indexOf('Funding Account'),
    fundingPolicy: headers.indexOf('Funding Policy'),
    amountPerMonth: headers.indexOf('Amount Per Month'),
    percentOfInflow: headers.indexOf('Percent Of Inflow'),
  };
  if (
    idx.include === -1 ||
    idx.name === -1 ||
    idx.targetAmount === -1 ||
    idx.targetDate === -1 ||
    idx.fundingAccount === -1 ||
    idx.fundingPolicy === -1
  ) {
    return;
  }

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var updated = 0;
  values.forEach(function (row, rowIndex) {
    if (!toBoolean_(row[idx.include])) {
      return;
    }
    var reasons = [];
    var goalName = row[idx.name] ? String(row[idx.name]).trim() : '';
    var targetAmount = toNumber_(row[idx.targetAmount]);
    var targetDate = toDate_(row[idx.targetDate]);
    var fundingAccount = normalizeAccountLookupKey_(row[idx.fundingAccount]);
    var fundingPolicy = row[idx.fundingPolicy];
    var amountPerMonth = idx.amountPerMonth === -1 ? null : toNumber_(row[idx.amountPerMonth]);
    var percentOfInflow = idx.percentOfInflow === -1 ? null : toNumber_(row[idx.percentOfInflow]);

    if (!goalName) {
      reasons.push('missing goal name');
    }
    if (targetAmount === null || targetAmount <= 0) {
      reasons.push('target amount must be > 0');
    }
    if (!targetDate) {
      reasons.push('invalid target date');
    }
    if (!fundingAccount) {
      reasons.push('missing funding account');
    } else if (!validAccounts[fundingAccount]) {
      reasons.push('unknown funding account');
    }
    if (
      fundingPolicy !== Config.GOAL_FUNDING_POLICIES.FIXED &&
      fundingPolicy !== Config.GOAL_FUNDING_POLICIES.LEFTOVER &&
      fundingPolicy !== Config.GOAL_FUNDING_POLICIES.PERCENT
    ) {
      reasons.push('invalid funding policy');
    }
    if (idx.priority !== -1 && row[idx.priority] !== '' && toPositiveInt_(row[idx.priority]) === null) {
      reasons.push('invalid priority');
    }
    if (fundingPolicy === Config.GOAL_FUNDING_POLICIES.FIXED && (amountPerMonth === null || amountPerMonth <= 0)) {
      reasons.push('amount per month must be > 0 for fixed policy');
    }
    if (
      fundingPolicy === Config.GOAL_FUNDING_POLICIES.PERCENT &&
      (percentOfInflow === null || percentOfInflow <= 0)
    ) {
      reasons.push('percent of inflow must be > 0 for percent policy');
    }

    if (!reasons.length) {
      return;
    }
    row[idx.include] = false;
    updated += 1;
  });

  if (updated > 0) {
    sheet.getRange(2, 1, values.length, lastCol).setValues(values);
  }
}

function validateRiskSheet_(validAccounts) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.RISK);
  if (!sheet) {
    return;
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var idx = {
    include: headers.indexOf('Include'),
    scenario: headers.indexOf('Scenario Name'),
    bufferAccount: headers.indexOf('Emergency Buffer Account'),
    bufferMinimum: headers.indexOf('Emergency Buffer Minimum'),
    incomeShock: headers.indexOf('Income Shock Percent'),
    expenseShock: headers.indexOf('Expense Shock Percent'),
  };
  if (idx.include === -1 || idx.scenario === -1) {
    return;
  }

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var updated = 0;
  values.forEach(function (row, rowIndex) {
    if (!toBoolean_(row[idx.include])) {
      return;
    }
    var reasons = [];
    var scenario = row[idx.scenario] ? String(row[idx.scenario]).trim() : '';
    var bufferAccount = idx.bufferAccount === -1 ? '' : normalizeAccountLookupKey_(row[idx.bufferAccount]);
    var bufferMinimum = idx.bufferMinimum === -1 ? null : toNumber_(row[idx.bufferMinimum]);
    var incomeShock = idx.incomeShock === -1 ? null : toNumber_(row[idx.incomeShock]);
    var expenseShock = idx.expenseShock === -1 ? null : toNumber_(row[idx.expenseShock]);

    if (!scenario) {
      reasons.push('missing scenario name');
    }
    if (bufferAccount && !validAccounts[bufferAccount]) {
      reasons.push('unknown emergency buffer account');
    }
    if (bufferMinimum !== null && bufferMinimum < 0) {
      reasons.push('emergency buffer minimum must be >= 0');
    }
    if (incomeShock !== null && incomeShock < 0) {
      reasons.push('income shock percent must be >= 0');
    }
    if (expenseShock !== null && expenseShock < 0) {
      reasons.push('expense shock percent must be >= 0');
    }

    if (!reasons.length) {
      return;
    }
    row[idx.include] = false;
    updated += 1;
  });

  if (updated > 0) {
    sheet.getRange(2, 1, values.length, lastCol).setValues(values);
  }
}

function validateIncomeSheet_(validAccounts) {
  validateAndDeactivateRows_(Config.SHEETS.INCOME, 'Income', function (row, indexes) {
    var reasons = [];
    if (!row[indexes.type]) {
      reasons.push('missing type');
    }
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
    var account = normalizeAccountLookupKey_(row[indexes.account]);
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
    var fromAccount = normalizeAccountLookupKey_(row[indexes.from]);
    var toAccount = normalizeAccountLookupKey_(row[indexes.to]);
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
    if (!row[indexes.type]) {
      reasons.push('missing type');
    }
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
    var fromAccount = normalizeAccountLookupKey_(row[indexes.from]);
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
    type: headers.indexOf('Type'),
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
    indexes.type === -1 ||
    indexes.name === -1 ||
    indexes.amount === -1 ||
    indexes.frequency === -1 ||
    indexes.start === -1
  ) {
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
  });

  if (updated > 0) {
    sheet.getRange(2, 1, values.length, lastCol).setValues(values);
  }
}

function refreshAccountSummaries_() {
  refreshAccountSummariesForScenarioModel_(buildScenarioModel_(Config.SCENARIOS.DEFAULT));
}

function refreshAccountSummariesForScenarioModel_(scenarioModel) {
  scenarioModel = scenarioModel || buildScenarioModel_(Config.SCENARIOS.DEFAULT);
  var accounts = Array.isArray(scenarioModel.accounts) ? scenarioModel.accounts : [];
  // Prevent ambiguous per-account writes when a scenario has duplicate account names.
  assertUniqueScenarioAccountNames_(scenarioModel.scenarioId, accounts);
  var incomeTotalsByAccount = updateIncomeMonthlyTotalsForScenarioModel_(scenarioModel);
  var expenseTotalsByAccount = updateExpenseMonthlyTotalsForScenarioModel_(scenarioModel);
  var transferTotals = updateTransferMonthlyTotalsForScenarioModel_(
    scenarioModel,
    incomeTotalsByAccount,
    expenseTotalsByAccount
  );
  updateAccountMonthlyFlowAveragesForScenarioModel_(
    scenarioModel.scenarioId,
    accounts,
    incomeTotalsByAccount,
    transferTotals,
    expenseTotalsByAccount
  );
}

function buildIncomeMonthlyTotalsForScenarioModel_(incomeRules) {
  var totals = {};
  (incomeRules || []).forEach(function (rule) {
    if (!rule || !rule.paidTo || !rule.frequency) {
      return;
    }
    if (!isRecurringForMonthlyAverage_(rule)) {
      return;
    }
    var amount = toNumber_(rule.amount);
    if (amount === null || amount < 0) {
      return;
    }
    var monthly = roundUpCents_(amount * monthlyFactorForRecurrence_(rule.frequency, rule.repeatEvery));
    var key = normalizeAccountLookupKey_(rule.paidTo);
    totals[key] = roundUpCents_((totals[key] || 0) + monthly);
  });
  return totals;
}

function buildExpenseMonthlyTotalsForScenarioModel_(expenseRules) {
  var totals = {};
  (expenseRules || []).forEach(function (rule) {
    if (!rule || !rule.paidFrom || !rule.frequency) {
      return;
    }
    if (!isRecurringForMonthlyAverage_(rule)) {
      return;
    }
    var amount = toNumber_(rule.amount);
    if (amount === null || amount < 0) {
      return;
    }
    var monthly = roundUpCents_(amount * monthlyFactorForRecurrence_(rule.frequency, rule.repeatEvery));
    var key = normalizeAccountLookupKey_(rule.paidFrom);
    totals[key] = roundUpCents_((totals[key] || 0) + monthly);
  });
  return totals;
}

function buildTransferMonthlyTotalsForScenarioModel_(
  transferRules,
  accounts,
  incomeTotalsByAccount,
  expenseTotalsByAccount
) {
  var credits = {};
  var debits = {};
  var accountBalances = {};
  (accounts || []).forEach(function (account) {
    if (!account || !account.name) {
      return;
    }
    accountBalances[normalizeAccountLookupKey_(account.name)] = toNumber_(account.balance) || 0;
  });

  (transferRules || []).forEach(function (rule) {
    if (!rule || !rule.frequency) {
      return;
    }
    if (!isRecurringForMonthlyAverage_(rule)) {
      return;
    }
    var fromKey = normalizeAccountLookupKey_(rule.paidFrom);
    var toKey = normalizeAccountLookupKey_(rule.paidTo);
    if (!fromKey || !toKey) {
      return;
    }
    var amount = toNumber_(rule.amount);
    var behavior = normalizeTransferType_(rule.type || rule.behavior, amount);
    var factor = monthlyFactorForRecurrence_(rule.frequency, rule.repeatEvery);
    if (factor <= 0) {
      return;
    }

    var monthly = null;
    if (
      behavior === Config.TRANSFER_TYPES.TRANSFER_AMOUNT ||
      behavior === Config.TRANSFER_TYPES.REPAYMENT_AMOUNT
    ) {
      if (amount === null || amount < 0) {
        return;
      }
      monthly = roundUpCents_(amount * factor);
    } else if (behavior === Config.TRANSFER_TYPES.REPAYMENT_ALL) {
      var debt = roundUpCents_(Math.max(0, -(accountBalances[toKey] || 0)));
      monthly = roundUpCents_(debt * factor);
    } else if (behavior === Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT) {
      var keep = amount === null || amount < 0 ? 0 : amount;
      var sourceBalance = accountBalances[fromKey] || 0;
      var sourceIncome = incomeTotalsByAccount[fromKey] || 0;
      var sourceExpense = expenseTotalsByAccount[fromKey] || 0;
      monthly = roundUpCents_(Math.max(0, sourceBalance + sourceIncome - sourceExpense - keep));
    }

    if (monthly === null || monthly <= 0) {
      return;
    }
    debits[fromKey] = roundUpCents_((debits[fromKey] || 0) + monthly);
    credits[toKey] = roundUpCents_((credits[toKey] || 0) + monthly);
  });

  return { credits: credits, debits: debits };
}

function updateIncomeMonthlyTotalsForScenarioModel_(scenarioModel) {
  scenarioModel = scenarioModel || buildScenarioModel_(Config.SCENARIOS.DEFAULT);
  var totals = buildIncomeMonthlyTotalsForScenarioModel_(scenarioModel.incomeRules || []);

  var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.INCOME);
  if (!sheet) {
    return totals;
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return totals;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var includeIdx = headers.indexOf('Include');
  var scenarioIdx = headers.indexOf('Scenario');
  var amountIdx = headers.indexOf('Amount');
  var freqIdx = headers.indexOf('Frequency');
  var repeatIdx = headers.indexOf('Repeat Every');
  var startIdx = headers.indexOf('Start Date');
  var endIdx = headers.indexOf('End Date');
  var toIdx = headers.indexOf('To Account');
  var totalIdx = headers.indexOf('Monthly Total');
  if (
    includeIdx === -1 ||
    amountIdx === -1 ||
    freqIdx === -1 ||
    repeatIdx === -1 ||
    toIdx === -1 ||
    totalIdx === -1
  ) {
    return totals;
  }

  var activeScenarioId = normalizeScenario_(scenarioModel.scenarioId);
  var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var out = rows.map(function (row) {
    var rowScenarioId = scenarioIdx === -1 ? Config.SCENARIOS.DEFAULT : normalizeScenario_(row[scenarioIdx]);
    if (rowScenarioId !== activeScenarioId) {
      return [row[totalIdx]];
    }
    var include = toBoolean_(row[includeIdx]);
    var amount = toNumber_(row[amountIdx]);
    var recurrence = normalizeRecurrence_(
      row[freqIdx],
      row[repeatIdx],
      startIdx === -1 ? null : row[startIdx],
      endIdx === -1 ? null : row[endIdx]
    );
    var recurring = isRecurringForMonthlyAverage_({
      startDate: recurrence.startDate,
      endDate: recurrence.endDate,
      isSingleOccurrence: recurrence.isSingleOccurrence,
    });
    if (!include || !recurring || amount === null || amount < 0 || !recurrence.frequency || !row[toIdx]) {
      return [''];
    }
    var monthlyTotal = roundUpCents_(
      (amount || 0) * monthlyFactorForRecurrence_(recurrence.frequency, recurrence.repeatEvery)
    );
    return [monthlyTotal];
  });
  sheet.getRange(2, totalIdx + 1, out.length, 1).setValues(out);
  return totals;
}

function updateExpenseMonthlyTotalsForScenarioModel_(scenarioModel) {
  scenarioModel = scenarioModel || buildScenarioModel_(Config.SCENARIOS.DEFAULT);
  var totals = buildExpenseMonthlyTotalsForScenarioModel_(scenarioModel.expenseRules || []);

  var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.EXPENSE);
  if (!sheet) {
    return totals;
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return totals;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var includeIdx = headers.indexOf('Include');
  var scenarioIdx = headers.indexOf('Scenario');
  var amountIdx = headers.indexOf('Amount');
  var freqIdx = headers.indexOf('Frequency');
  var repeatIdx = headers.indexOf('Repeat Every');
  var startIdx = headers.indexOf('Start Date');
  var endIdx = headers.indexOf('End Date');
  var fromIdx = headers.indexOf('From Account');
  var totalIdx = headers.indexOf('Monthly Total');
  if (
    includeIdx === -1 ||
    amountIdx === -1 ||
    freqIdx === -1 ||
    repeatIdx === -1 ||
    fromIdx === -1 ||
    totalIdx === -1
  ) {
    return totals;
  }

  var activeScenarioId = normalizeScenario_(scenarioModel.scenarioId);
  var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var out = rows.map(function (row) {
    var rowScenarioId = scenarioIdx === -1 ? Config.SCENARIOS.DEFAULT : normalizeScenario_(row[scenarioIdx]);
    if (rowScenarioId !== activeScenarioId) {
      return [row[totalIdx]];
    }
    var include = toBoolean_(row[includeIdx]);
    var amount = toNumber_(row[amountIdx]);
    var recurrence = normalizeRecurrence_(
      row[freqIdx],
      row[repeatIdx],
      startIdx === -1 ? null : row[startIdx],
      endIdx === -1 ? null : row[endIdx]
    );
    var recurring = isRecurringForMonthlyAverage_({
      startDate: recurrence.startDate,
      endDate: recurrence.endDate,
      isSingleOccurrence: recurrence.isSingleOccurrence,
    });
    if (!include || !recurring || amount === null || amount < 0 || !recurrence.frequency || !row[fromIdx]) {
      return [''];
    }
    var monthlyTotal = roundUpCents_(
      (amount || 0) * monthlyFactorForRecurrence_(recurrence.frequency, recurrence.repeatEvery)
    );
    return [monthlyTotal];
  });
  sheet.getRange(2, totalIdx + 1, out.length, 1).setValues(out);
  return totals;
}

function updateTransferMonthlyTotalsForScenarioModel_(
  scenarioModel,
  incomeTotalsByAccount,
  expenseTotalsByAccount
) {
  scenarioModel = scenarioModel || buildScenarioModel_(Config.SCENARIOS.DEFAULT);
  incomeTotalsByAccount = normalizeAccountTotalsKeys_(incomeTotalsByAccount);
  expenseTotalsByAccount = normalizeAccountTotalsKeys_(expenseTotalsByAccount);
  var transferTotals = buildTransferMonthlyTotalsForScenarioModel_(
    scenarioModel.transferRules || [],
    scenarioModel.accounts || [],
    incomeTotalsByAccount,
    expenseTotalsByAccount
  );

  var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.TRANSFERS);
  if (!sheet) {
    return transferTotals;
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return transferTotals;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var includeIdx = headers.indexOf('Include');
  var scenarioIdx = headers.indexOf('Scenario');
  var typeIdx = headers.indexOf('Type');
  var amountIdx = headers.indexOf('Amount');
  var freqIdx = headers.indexOf('Frequency');
  var repeatIdx = headers.indexOf('Repeat Every');
  var startIdx = headers.indexOf('Start Date');
  var endIdx = headers.indexOf('End Date');
  var fromIdx = headers.indexOf('From Account');
  var toIdx = headers.indexOf('To Account');
  var totalIdx = headers.indexOf('Monthly Total');
  if (
    includeIdx === -1 ||
    typeIdx === -1 ||
    amountIdx === -1 ||
    freqIdx === -1 ||
    repeatIdx === -1 ||
    fromIdx === -1 ||
    toIdx === -1 ||
    totalIdx === -1
  ) {
    return transferTotals;
  }

  var accountBalances = {};
  (scenarioModel.accounts || []).forEach(function (account) {
    if (!account || !account.name) {
      return;
    }
    accountBalances[normalizeAccountLookupKey_(account.name)] = toNumber_(account.balance) || 0;
  });

  var activeScenarioId = normalizeScenario_(scenarioModel.scenarioId);
  var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var out = rows.map(function (row) {
    return [row[totalIdx]];
  });
  var credits = {};
  var debits = {};
  var everythingExceptRows = [];

  rows.forEach(function (row, rowIndex) {
    var rowScenarioId = scenarioIdx === -1 ? Config.SCENARIOS.DEFAULT : normalizeScenario_(row[scenarioIdx]);
    if (rowScenarioId !== activeScenarioId) {
      return;
    }

    var include = toBoolean_(row[includeIdx]);
    var amount = toNumber_(row[amountIdx]);
    var recurrence = normalizeRecurrence_(
      row[freqIdx],
      row[repeatIdx],
      startIdx === -1 ? null : row[startIdx],
      endIdx === -1 ? null : row[endIdx]
    );
    var recurring = isRecurringForMonthlyAverage_({
      startDate: recurrence.startDate,
      endDate: recurrence.endDate,
      isSingleOccurrence: recurrence.isSingleOccurrence,
    });

    var fromKey = normalizeAccountLookupKey_(row[fromIdx]);
    var toKey = normalizeAccountLookupKey_(row[toIdx]);
    var monthlyTotal = null;
    if (
      include &&
      recurring &&
      amount !== null &&
      amount >= 0 &&
      recurrence.frequency &&
      fromKey &&
      toKey
    ) {
      var behavior = normalizeTransferType_(row[typeIdx], amount);
      var factor = monthlyFactorForRecurrence_(recurrence.frequency, recurrence.repeatEvery);
      if (factor > 0) {
        if (behavior === Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT) {
          everythingExceptRows.push({
            rowIndex: rowIndex,
            fromKey: fromKey,
            toKey: toKey,
            keepAmount: amount || 0,
          });
        } else if (
          behavior === Config.TRANSFER_TYPES.TRANSFER_AMOUNT ||
          behavior === Config.TRANSFER_TYPES.REPAYMENT_AMOUNT
        ) {
          monthlyTotal = roundUpCents_(amount * factor);
        } else if (behavior === Config.TRANSFER_TYPES.REPAYMENT_ALL) {
          var debt = roundUpCents_(Math.max(0, -(accountBalances[toKey] || 0)));
          monthlyTotal = roundUpCents_(debt * factor);
        }
      }
    }

    if (monthlyTotal !== null && monthlyTotal > 0) {
      debits[fromKey] = roundUpCents_((debits[fromKey] || 0) + monthlyTotal);
      credits[toKey] = roundUpCents_((credits[toKey] || 0) + monthlyTotal);
      out[rowIndex] = [monthlyTotal];
      return;
    }
    out[rowIndex] = [''];
  });

  everythingExceptRows.forEach(function (item) {
    var sourceBalance = accountBalances[item.fromKey] || 0;
    var sourceIncome = incomeTotalsByAccount[item.fromKey] || 0;
    var sourceExpense = expenseTotalsByAccount[item.fromKey] || 0;
    var baseIn = roundUpCents_(sourceIncome + (credits[item.fromKey] || 0));
    var baseOut = roundUpCents_(sourceExpense + (debits[item.fromKey] || 0));
    var monthlySweep = roundUpCents_(Math.max(0, sourceBalance + baseIn - baseOut - item.keepAmount));
    if (monthlySweep > 0) {
      debits[item.fromKey] = roundUpCents_((debits[item.fromKey] || 0) + monthlySweep);
      credits[item.toKey] = roundUpCents_((credits[item.toKey] || 0) + monthlySweep);
      out[item.rowIndex] = [monthlySweep];
      return;
    }
    out[item.rowIndex] = [''];
  });

  sheet.getRange(2, totalIdx + 1, out.length, 1).setValues(out);
  return transferTotals;
}

function updateAccountMonthlyFlowAveragesForScenarioModel_(
  scenarioId,
  accounts,
  incomeTotalsByAccount,
  transferTotals,
  expenseTotalsByAccount
) {
  var accountsSheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.ACCOUNTS);
  if (!accountsSheet) {
    return;
  }
  var lastRow = accountsSheet.getLastRow();
  var lastCol = accountsSheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return;
  }

  var headers = accountsSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var nameIdx = headers.indexOf('Account Name');
  var scenarioIdx = headers.indexOf('Scenario');
  var summaryIndexes = getAccountSummaryHeaderIndexes_(headers);
  var interestAvgIdx = summaryIndexes.interest;
  var expenseAvgIdx = summaryIndexes.debits;
  var incomeAvgIdx = summaryIndexes.credits;
  var netFlowIdx = summaryIndexes.net;
  if (nameIdx === -1) {
    return;
  }

  transferTotals = normalizeTransferTotalsKeys_(transferTotals || { credits: {}, debits: {} });
  var transferCredits = transferTotals.credits || {};
  var transferDebits = transferTotals.debits || {};
  incomeTotalsByAccount = normalizeAccountTotalsKeys_(incomeTotalsByAccount || {});
  expenseTotalsByAccount = normalizeAccountTotalsKeys_(expenseTotalsByAccount || {});

  var accountByKey = {};
  var activeScenarioId = normalizeScenario_(scenarioId);
  (accounts || []).forEach(function (account) {
    if (!account || !account.name) {
      return;
    }
    var key = normalizeAccountLookupKey_(account.name);
    if (!key || accountByKey[key]) {
      return;
    }
    accountByKey[key] = account;
  });

  var rows = accountsSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var interestAvgValues = [];
  var expenseAvgValues = [];
  var incomeAvgValues = [];
  var netFlowValues = [];

  rows.forEach(function (row) {
    var existingInterest = interestAvgIdx === -1 ? '' : row[interestAvgIdx];
    var existingExpense = expenseAvgIdx === -1 ? '' : row[expenseAvgIdx];
    var existingIncome = incomeAvgIdx === -1 ? '' : row[incomeAvgIdx];
    var existingNet = netFlowIdx === -1 ? '' : row[netFlowIdx];
    var rowScenarioId = scenarioIdx === -1 ? Config.SCENARIOS.DEFAULT : normalizeScenario_(row[scenarioIdx]);
    if (rowScenarioId !== activeScenarioId) {
      interestAvgValues.push([existingInterest]);
      expenseAvgValues.push([existingExpense]);
      incomeAvgValues.push([existingIncome]);
      netFlowValues.push([existingNet]);
      return;
    }

    var name = row[nameIdx];
    var key = normalizeAccountLookupKey_(name);
    var account = accountByKey[key];
    if (!account || account.forecast !== true) {
      interestAvgValues.push(['']);
      expenseAvgValues.push(['']);
      incomeAvgValues.push(['']);
      netFlowValues.push(['']);
      return;
    }

    var rate = toNumber_(account.interestRate);
    var balance = toNumber_(account.balance);
    var frequency = account.interestPostingFrequency;
    var method = account.interestMethod || '';
    var fee = toNumber_(account.interestMonthlyFee);

    var interest = 0;
    if (rate !== null && balance !== null && frequency) {
      interest = computeEstimatedMonthlyInterest_(balance, rate, method);
    }

    var income = roundUpCents_((incomeTotalsByAccount[key] || 0) + (transferCredits[key] || 0));
    var expense = roundUpCents_((expenseTotalsByAccount[key] || 0) + (transferDebits[key] || 0));
    if (fee !== null && fee > 0) {
      expense = roundUpCents_(expense + fee);
    }
    var net = roundUpCents_(income + interest - expense);

    interestAvgValues.push([interest]);
    expenseAvgValues.push([expense]);
    incomeAvgValues.push([income]);
    netFlowValues.push([net]);
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

function toast_(_message) {
  if (!_message) {
    return;
  }
  var title = runProgress_.label ? 'Budget Forecast: ' + runProgress_.label : 'Budget Forecast';
  SpreadsheetApp.getActive().toast(String(_message), title, 3);
  SpreadsheetApp.flush();
}

function toastStep_(_message, _delayMs) {
  if (!_message) {
    return;
  }
  var message = nextProgressMessage_(String(_message));
  var title = runProgress_.label ? 'Budget Forecast: ' + runProgress_.label : 'Budget Forecast';
  SpreadsheetApp.getActive().toast(message, title, 3);
  SpreadsheetApp.flush();
  var delayMs = toNumber_(_delayMs);
  if (delayMs && delayMs > 0) {
    Utilities.sleep(delayMs);
  }
}

var runProgress_ = {
  active: false,
  label: '',
  step: 0,
  total: 0,
};

function startRunProgress_(label, totalSteps) {
  runProgress_ = {
    active: true,
    label: label ? String(label) : '',
    step: 0,
    total: toPositiveInt_(totalSteps) || 0,
  };
}

function endRunProgress_() {
  runProgress_ = {
    active: false,
    label: '',
    step: 0,
    total: 0,
  };
}

function nextProgressMessage_(message) {
  if (!runProgress_.active) {
    return message;
  }
  runProgress_.step += 1;
  if (runProgress_.total > 0) {
    return '(' + runProgress_.step + '/' + runProgress_.total + ') ' + message;
  }
  return '(' + runProgress_.step + ') ' + message;
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

function flagExpiredExpenses_() {
  flagExpiredRows_(Config.SHEETS.EXPENSE, 'Expense');
}

function flagExpiredIncome_() {
  flagExpiredRows_(Config.SHEETS.INCOME, 'Income');
}

function flagExpiredTransfers_() {
  flagExpiredRows_(Config.SHEETS.TRANSFERS, 'Transfer');
}

function flagExpiredPolicies_() {
  flagExpiredRows_(Config.SHEETS.POLICIES, 'Policy');
}

function flagExpiredRows_(sheetName, label) {
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
    return;
  }

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var today = normalizeDate_(new Date());
  var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  var todayKey = Utilities.formatDate(today, tz, 'yyyy-MM-dd');
  var flagged = 0;

  values.forEach(function (row, idx) {
    var include = toBoolean_(row[includeIndex]);
    if (!include) {
      return;
    }
    var endDate = endDateIndex !== -1 ? row[endDateIndex] : null;
    var startDate = row[startDateIndex];
    var endKey = endDate ? Utilities.formatDate(normalizeDate_(endDate), tz, 'yyyy-MM-dd') : null;
    var startKey = startDate ? Utilities.formatDate(normalizeDate_(startDate), tz, 'yyyy-MM-dd') : null;

    if (endKey && startKey && endKey < startKey) {
      if (nameIndex !== -1) {
      } else {
      }
      return;
    }

    if (endKey && endKey < todayKey) {
      flagged += 1;
      if (nameIndex !== -1) {
      } else {
      }
    }
  });

  if (flagged > 0) {
  }
}

function normalizeAccountLookupKey_(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim().toLowerCase();
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
  var typeIdx = headers.indexOf('Type');
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
  var summaryIndexes = getAccountSummaryHeaderIndexes_(headers);
  var interestAvgIdx = summaryIndexes.interest;
  var expenseAvgIdx = summaryIndexes.debits;
  var incomeAvgIdx = summaryIndexes.credits;
  var netFlowIdx = summaryIndexes.net;
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
  if (
    event.kind === 'Transfer' &&
    (event.transferBehavior || event.behavior) === Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT
  ) {
    return 99;
  }
  if (event.kind === 'Income') {
    return 0;
  }
  if (event.kind === 'Transfer') {
    var transferPriority = transferBehaviorSortPriority_(event.behavior);
    return 10 + transferPriority;
  }
  if (event.kind === 'Expense') {
    return 20;
  }
  if (event.kind === 'Interest' && event.interestAccrual === true) {
    return 30;
  }
  if (event.kind === 'Interest') {
    return 40;
  }
  return 10;
}

function transferBehaviorSortPriority_(behavior) {
  if (behavior === Config.TRANSFER_TYPES.TRANSFER_AMOUNT) {
    return 0;
  }
  if (behavior === Config.TRANSFER_TYPES.REPAYMENT_AMOUNT) {
    return 1;
  }
  if (behavior === Config.TRANSFER_TYPES.REPAYMENT_ALL) {
    return 2;
  }
  if (behavior === Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT) {
    return 3;
  }
  return 9;
}

function updateExpenseMonthlyTotals_() {
  var scenarioModel = buildScenarioModel_(Config.SCENARIOS.DEFAULT);
  return updateExpenseMonthlyTotalsForScenarioModel_(scenarioModel);
}

function updateAccountMonthlyFlowAverages_(incomeTotalsByAccount, transferTotals, expenseTotalsByAccount) {
  var scenarioModel = buildScenarioModel_(Config.SCENARIOS.DEFAULT);
  updateAccountMonthlyFlowAveragesForScenarioModel_(
    Config.SCENARIOS.DEFAULT,
    scenarioModel.accounts || [],
    normalizeAccountTotalsKeys_(incomeTotalsByAccount),
    normalizeTransferTotalsKeys_(transferTotals),
    normalizeAccountTotalsKeys_(expenseTotalsByAccount)
  );
}

function computeEstimatedMonthlyInterest_(balance, ratePercent, method) {
  var annualRate = ratePercent / 100;
  var monthlyRate = annualRate / 12;
  if (method === Config.INTEREST_METHODS.APY_COMPOUND) {
    monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
  }
  return roundUpCents_(balance * monthlyRate);
}

function updateIncomeMonthlyTotals_() {
  var scenarioModel = buildScenarioModel_(Config.SCENARIOS.DEFAULT);
  return updateIncomeMonthlyTotalsForScenarioModel_(scenarioModel);
}

function updateTransferMonthlyTotals_(incomeTotalsByAccount, expenseTotalsByAccount) {
  var scenarioModel = buildScenarioModel_(Config.SCENARIOS.DEFAULT);
  var normalizedIncomeTotals = normalizeAccountTotalsKeys_(incomeTotalsByAccount);
  var normalizedExpenseTotals = normalizeAccountTotalsKeys_(expenseTotalsByAccount);

  if (!Object.keys(normalizedIncomeTotals).length) {
    normalizedIncomeTotals = updateIncomeMonthlyTotalsForScenarioModel_(scenarioModel);
  }
  if (!Object.keys(normalizedExpenseTotals).length) {
    normalizedExpenseTotals = updateExpenseMonthlyTotalsForScenarioModel_(scenarioModel);
  }

  return updateTransferMonthlyTotalsForScenarioModel_(
    scenarioModel,
    normalizedIncomeTotals,
    normalizedExpenseTotals
  );
}

function normalizeAccountTotalsKeys_(totalsByAccount) {
  var normalized = {};
  if (!totalsByAccount) {
    return normalized;
  }
  Object.keys(totalsByAccount).forEach(function (key) {
    var normalizedKey = normalizeAccountLookupKey_(key);
    if (!normalizedKey) {
      return;
    }
    var value = toNumber_(totalsByAccount[key]);
    if (value === null) {
      return;
    }
    normalized[normalizedKey] = roundUpCents_((normalized[normalizedKey] || 0) + value);
  });
  return normalized;
}

function assertUniqueScenarioAccountNames_(scenarioId, accounts) {
  var seen = {};
  var duplicates = [];
  (accounts || []).forEach(function (account) {
    if (!account || !account.name) {
      return;
    }
    var key = normalizeAccountLookupKey_(account.name);
    if (!key) {
      return;
    }
    if (seen[key]) {
      duplicates.push(account.name);
      return;
    }
    seen[key] = true;
  });
  if (!duplicates.length) {
    return;
  }
  var unique = duplicates
    .map(function (name) { return String(name || '').trim(); })
    .filter(function (name, idx, arr) { return name && arr.indexOf(name) === idx; });
  throw new Error(
    'Duplicate account names in scenario "' +
      normalizeScenario_(scenarioId) +
      '": ' +
      unique.join(', ') +
      '.'
  );
}

function normalizeTransferTotalsKeys_(transferTotals) {
  return {
    credits: normalizeAccountTotalsKeys_(transferTotals && transferTotals.credits),
    debits: normalizeAccountTotalsKeys_(transferTotals && transferTotals.debits),
  };
}

function getAccountSummaryHeaderIndexes_(headers) {
  return {
    credits: headers.indexOf('Money In / Month'),
    debits: headers.indexOf('Money Out / Month'),
    interest: headers.indexOf('Net Interest / Month'),
    net: headers.indexOf('Net Change / Month'),
  };
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

function buildJournalArtifactsForScenarioModel_(scenarioModel) {
  var model = scenarioModel || buildScenarioModel_(Config.SCENARIOS.DEFAULT);
  var activeScenarioId = resolveScenarioId_(model.scenarioId);
  var accounts = model.accounts || [];
  assertUniqueScenarioAccountNames_(activeScenarioId, accounts);
  var accountTypes = buildAccountTypeMap_(accounts);
  var incomeRules = model.incomeRules || [];
  var transferRules = model.transferRules || [];
  var expenseRules = model.expenseRules || [];
  var policies = model.policies || [];
  var riskSettings = model.riskSettings || [];

  var events = Events.buildIncomeEvents(incomeRules)
    .concat(Events.buildTransferEvents(transferRules))
    .concat(Events.buildExpenseEvents(expenseRules))
    .concat(Events.buildInterestEvents(accounts));

  events.sort(function (a, b) {
    var dateDiff = normalizeDate_(a.date).getTime() - normalizeDate_(b.date).getTime();
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

  var journalData = buildJournalRows_(accounts, events, policies, riskSettings, activeScenarioId);
  return {
    rows: journalData.rows || [],
    forecastAccounts: journalData.forecastAccounts || [],
    accountTypes: accountTypes,
    scenarioId: activeScenarioId,
  };
}

function runJournalForScenarioIds_(scenarioIds) {
  var ids = Array.isArray(scenarioIds) ? scenarioIds : [scenarioIds];
  ids = ids
    .map(function (value) { return resolveScenarioId_(value); })
    .filter(function (value, idx, arr) { return value && arr.indexOf(value) === idx; });
  if (!ids.length) {
    ids = [Config.SCENARIOS.DEFAULT];
  }
  if (ids.length === 1) {
    if (Engine && Engine.runJournalForScenario) {
      Engine.runJournalForScenario(ids[0]);
      return;
    }
  }

  startRunProgress_('Journal (' + ids.join(', ') + ')', ids.length + 2);
  try {
    toastStep_('Reading input sheets...');
    var artifacts = ids.map(function (scenarioId) {
      return buildJournalArtifactsForScenarioModel_(buildScenarioModel_(scenarioId));
    });

    toastStep_('Combining journal rows...');
    var forecastLookup = {};
    var globalForecastAccounts = [];
    var accountTypes = {};
    artifacts.forEach(function (artifact) {
      (artifact.forecastAccounts || []).forEach(function (name) {
        if (forecastLookup[name]) {
          return;
        }
        forecastLookup[name] = true;
        globalForecastAccounts.push(name);
      });
      Object.keys(artifact.accountTypes || {}).forEach(function (name) {
        if (!accountTypes[name]) {
          accountTypes[name] = artifact.accountTypes[name];
        }
      });
    });

    var combinedRows = [];
    artifacts.forEach(function (artifact) {
      var localIndex = {};
      (artifact.forecastAccounts || []).forEach(function (name, idx) {
        localIndex[name] = idx;
      });
      (artifact.rows || []).forEach(function (row) {
        var base = row.slice(0, 7);
        var localSnapshot = row.slice(7);
        var aligned = globalForecastAccounts.map(function (name) {
          var idx = localIndex[name];
          if (idx === undefined) {
            return '';
          }
          return idx < localSnapshot.length ? localSnapshot[idx] : '';
        });
        combinedRows.push(base.concat(aligned));
      });
    });

    toastStep_('Writing journal...');
    Writers.writeJournal(combinedRows, globalForecastAccounts, accountTypes);
    recordLastRunMetadata_('Journal', ids.join(', '), 'Success');
    toastStep_('Journal run complete.');
  } catch (err) {
    recordLastRunMetadata_('Journal', ids.join(', '), 'Failed');
    throw err;
  } finally {
    endRunProgress_();
  }
}

function buildJournalRows_(accounts, events, policies, riskSettings, scenarioId) {
  var balances = buildBalanceMap_(accounts);
  var forecastable = buildForecastableMap_(accounts);
  var accountTypes = buildAccountTypeMap_(accounts);
  var policyRules = policies || [];
  var riskContext = resolveRiskContext_(riskSettings || []);
  var forecastAccounts = accounts
    .filter(function (account) {
      return forecastable[account.name];
    })
    .map(function (account) {
      return account.name;
    });
  var rows = [];
  var openingDate = events.length ? normalizeDate_(events[0].date) : normalizeDate_(new Date());

  rows = rows.concat(buildOpeningRows_(accounts, openingDate, forecastAccounts, balances, scenarioId));

  events.forEach(function (event) {
    rows = rows.concat(
      applyAutoDeficitCoverRowsBeforeEvent_(
        balances,
        event,
        accountTypes,
        policyRules,
        riskContext,
        forecastAccounts,
        scenarioId
      )
    );
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
        accountTypes,
        scenarioId
      )
    );
  });

  return { rows: rows, forecastAccounts: forecastAccounts };
}

function buildOpeningRows_(accounts, date, forecastAccounts, balances, scenarioId) {
  return accounts.map(function (account) {
    var balanceSnapshot = buildForecastBalanceCells_(balances, forecastAccounts);
    return [
      new Date(date.getTime()),
      scenarioId,
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
  accountTypes,
  scenarioId
) {
  var balanceSnapshotFrom = buildForecastBalanceCells_(balancesAfterFrom, forecastAccounts);
  var balanceSnapshotTo = buildForecastBalanceCells_(balancesAfterTo, forecastAccounts);
  var transactionType = deriveJournalTransactionType_(event);
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
        scenarioId,
        accountName,
        transactionType,
        event.name,
        rowAmount,
        buildAlerts_(cashNegative, creditPaidOff, event.alertTag),
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
      scenarioId,
      accountName || '',
      transactionType,
      event.name,
      signedAmount,
      buildAlerts_(cashNegative, creditPaidOff, event.alertTag),
    ].concat(balanceSnapshotTo),
  ];
}

function buildAlerts_(cashNegative, creditPaidOff, explicitAlert) {
  var alerts = [];
  if (cashNegative) {
    alerts.push('NEGATIVE_CASH');
  }
  if (creditPaidOff) {
    alerts.push('CREDIT_PAID_OFF');
  }
  if (explicitAlert) {
    alerts.push(explicitAlert);
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

function deriveJournalTransactionType_(event) {
  if (!event || !event.kind) {
    return '';
  }
  if (event.kind === 'Income') {
    return 'Income';
  }
  if (event.kind === 'Expense') {
    return 'Expense';
  }
  if (event.kind === 'Transfer') {
    var transferDetail = event.behavior || event.transferBehavior;
    if (transferDetail) {
      return 'Transfer (' + transferDetail + ')';
    }
    return 'Transfer';
  }
  if (event.kind === 'Interest') {
    return 'Interest';
  }
  return event.kind;
}

function applyAutoDeficitCoverRowsBeforeEvent_(
  balances,
  event,
  accountTypes,
  policyRules,
  riskContext,
  forecastAccounts,
  scenarioId
) {
  var applicablePolicies = getApplicableAutoDeficitPolicies_(policyRules, event);
  if (!applicablePolicies.length) {
    return [];
  }

  var threshold = applicablePolicies.reduce(function (maxValue, policy) {
    var value = toNumber_(policy.threshold);
    if (value === null || value < 0) {
      value = 0;
    }
    return value > maxValue ? value : maxValue;
  }, 0);
  var coverageNeed = getDeficitCoverageNeedForEvent_(balances, event, accountTypes, threshold);
  if (!coverageNeed || !coverageNeed.account || coverageNeed.amount <= 0) {
    return [];
  }
  var coveredAccount = coverageNeed.account;
  var remainingNeed = coverageNeed.amount;
  var rows = [];

  for (var i = 0; i < applicablePolicies.length && remainingNeed > 0; i += 1) {
    var policy = applicablePolicies[i];
    var sourceAccount = (policy.fundingAccount || '').toString().trim();
    if (!sourceAccount || sourceAccount === coveredAccount) {
      continue;
    }
    if (balances[sourceAccount] === undefined) {
      continue;
    }
    var available = roundUpCents_(Math.max(0, balances[sourceAccount] || 0));
    var reservedBuffer = getReservedEmergencyBufferForSource_(riskContext, sourceAccount);
    if (reservedBuffer > 0) {
      available = roundUpCents_(Math.max(0, available - reservedBuffer));
    }
    if (available <= 0) {
      continue;
    }

    var maxPerEvent = toNumber_(policy.maxPerEvent);
    var cap = maxPerEvent !== null && maxPerEvent > 0 ? maxPerEvent : remainingNeed;
    var amount = roundUpCents_(Math.min(remainingNeed, available, cap));
    if (amount <= 0) {
      continue;
    }

    var coverEvent = {
      date: event.date,
      kind: 'Transfer',
      behavior: Config.POLICY_TYPES.AUTO_DEFICIT_COVER,
      transferBehavior: Config.TRANSFER_TYPES.TRANSFER_AMOUNT,
      name: policy.name || ('Auto deficit cover - ' + coveredAccount),
      from: sourceAccount,
      to: coveredAccount,
      amount: amount,
      alertTag: 'AUTO_DEFICIT_COVER',
    };
    var snapshots = applyEventWithSnapshots_(balances, coverEvent);
    if (coverEvent.skipJournal) {
      continue;
    }
    rows = rows.concat(
      buildJournalEventRows_(
        coverEvent,
        snapshots.afterFrom,
        snapshots.afterTo,
        forecastAccounts,
        accountTypes,
        scenarioId
      )
    );
    remainingNeed = roundUpCents_(remainingNeed - amount);
  }

  return rows;
}

function getApplicableAutoDeficitPolicies_(policyRules, event) {
  if (!event || !event.from || !Array.isArray(policyRules) || !policyRules.length) {
    return [];
  }
  var eventFromKey = normalizeAccountLookupKey_(event.from);
  return policyRules
    .filter(function (policy) {
      if (!policy || policy.type !== Config.POLICY_TYPES.AUTO_DEFICIT_COVER) {
        return false;
      }
      if (normalizeAccountLookupKey_(policy.triggerAccount) !== eventFromKey) {
        return false;
      }
      return isPolicyActiveOnDate_(policy, event.date);
    })
    .sort(function (a, b) {
      var pa = toPositiveInt_(a.priority) || 100;
      var pb = toPositiveInt_(b.priority) || 100;
      if (pa !== pb) {
        return pa - pb;
      }
      var na = a.name || '';
      var nb = b.name || '';
      return na < nb ? -1 : na > nb ? 1 : 0;
    });
}

function resolveRiskContext_(riskSettings) {
  if (!Array.isArray(riskSettings) || !riskSettings.length) {
    return null;
  }
  return riskSettings[0];
}

function getReservedEmergencyBufferForSource_(riskContext, sourceAccount) {
  if (!riskContext || !sourceAccount) {
    return 0;
  }
  var bufferAccount = (riskContext.emergencyBufferAccount || '').toString().trim();
  if (!bufferAccount) {
    return 0;
  }
  if (normalizeAccountLookupKey_(bufferAccount) !== normalizeAccountLookupKey_(sourceAccount)) {
    return 0;
  }
  var minValue = toNumber_(riskContext.emergencyBufferMinimum);
  if (minValue === null || minValue <= 0) {
    return 0;
  }
  return roundUpCents_(minValue);
}

function isPolicyActiveOnDate_(policy, date) {
  var day = normalizeDate_(date || new Date());
  var startDate = policy && policy.startDate ? normalizeDate_(policy.startDate) : null;
  var endDate = policy && policy.endDate ? normalizeDate_(policy.endDate) : null;
  if (startDate && day.getTime() < startDate.getTime()) {
    return false;
  }
  if (endDate && day.getTime() > endDate.getTime()) {
    return false;
  }
  return true;
}

function getDeficitCoverageNeedForEvent_(balances, event, accountTypes, threshold) {
  if (!event || !event.kind) {
    return null;
  }
  if (event.kind !== 'Expense' && event.kind !== 'Transfer') {
    return null;
  }
  if (!event.from || accountTypes[event.from] === Config.ACCOUNT_TYPES.CREDIT) {
    return null;
  }
  if ((event.transferBehavior || event.behavior) === Config.POLICY_TYPES.AUTO_DEFICIT_COVER) {
    return null;
  }

  var outgoing = 0;
  if (event.kind === 'Expense') {
    outgoing = roundUpCents_(event.amount || 0);
  } else {
    outgoing = estimateTransferOutgoingAmount_(balances, event);
  }

  if (outgoing <= 0) {
    return null;
  }
  var currentBalance = roundUpCents_(balances[event.from] || 0);
  var safeThreshold = toNumber_(threshold);
  if (safeThreshold === null || safeThreshold < 0) {
    safeThreshold = 0;
  }
  var needed = roundUpCents_(Math.max(0, outgoing + safeThreshold - currentBalance));
  if (needed <= 0) {
    return null;
  }
  return {
    account: event.from,
    amount: needed,
  };
}

function estimateTransferOutgoingAmount_(balances, event) {
  var transferType = event.transferBehavior || event.behavior;
  var amount = roundUpCents_(event.amount || 0);

  if (transferType === Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT) {
    return 0;
  }
  if (transferType === Config.TRANSFER_TYPES.TRANSFER_AMOUNT) {
    return amount > 0 ? amount : 0;
  }
  if (transferType === Config.TRANSFER_TYPES.REPAYMENT_ALL) {
    var targetAll = event.to ? balances[event.to] || 0 : 0;
    return targetAll < 0 ? roundUpCents_(Math.abs(targetAll)) : 0;
  }
  if (transferType === Config.TRANSFER_TYPES.REPAYMENT_AMOUNT) {
    var targetAmount = event.to ? balances[event.to] || 0 : 0;
    if (targetAmount >= 0 || amount <= 0) {
      return 0;
    }
    return roundUpCents_(Math.min(amount, Math.abs(targetAmount)));
  }
  return amount > 0 ? amount : 0;
}

function resolveTransferAmount_(balances, event, amount) {
  var transferType = event.transferBehavior || event.behavior;

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

