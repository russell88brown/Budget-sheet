// Entrypoints and menu wiring.
function onOpen() {
  var ui = SpreadsheetApp.getUi();

  ui
    .createMenu('Budget Forecast')
    .addItem('Run Budget...', 'showRunBudgetDialog')
    .addSeparator()
    .addItem('Export', 'showExportDialog')
    .addItem('Setup actions...', 'showSetupDialog')
    .addToUi();
}

function runForecast() {
  if (Engine && Engine.runForecast) {
    Engine.runForecast();
  }
}

function runJournal() {
  if (Engine && Engine.runJournalOnly) {
    Engine.runJournalOnly();
  } else {
    runForecast();
  }
}

function showRunBudgetDialog() {
  var template = HtmlService.createTemplateFromFile('ScenarioRunDialog');
  var available = (Readers && Readers.readScenarios ? Readers.readScenarios() : [Config.SCENARIOS.DEFAULT])
    .map(function (value) {
      return normalizeScenario_(value);
    })
    .filter(function (value, idx, arr) {
      return value && arr.indexOf(value) === idx;
    });
  if (!available.length) {
    available = [Config.SCENARIOS.DEFAULT];
  }
  template.scenarios = available;
  var html = template.evaluate().setWidth(860).setHeight(520);
  SpreadsheetApp.getUi().showModalDialog(html, 'Run Budget');
}

function runBudgetSelections(actions, scenarioMode, scenarioIds) {
  var mode = scenarioMode === 'custom' ? 'custom' : 'base';
  var available = (Readers && Readers.readScenarios ? Readers.readScenarios() : [Config.SCENARIOS.DEFAULT])
    .map(function (value) {
      return normalizeScenario_(value);
    })
    .filter(function (value, idx, arr) {
      return value && arr.indexOf(value) === idx;
    });
  var selectedActions = Array.isArray(actions)
    ? actions.map(function (value) { return String(value || '').toLowerCase(); })
    : [];
  selectedActions = selectedActions.filter(function (value, idx, arr) {
    return value && arr.indexOf(value) === idx;
  });
  if (!selectedActions.length) {
    throw new Error('Select at least one action.');
  }
  selectedActions.forEach(function (actionType) {
    if (
      actionType !== 'summarise_accounts' &&
      actionType !== 'journal' &&
      actionType !== 'daily' &&
      actionType !== 'monthly' &&
      actionType !== 'dashboard'
    ) {
      throw new Error('Unknown action type.');
    }
  });

  var selectedScenarios = mode === 'base'
    ? [Config.SCENARIOS.DEFAULT]
    : Array.isArray(scenarioIds)
      ? scenarioIds.map(function (value) { return normalizeScenario_(value); })
      : [];
  selectedScenarios = selectedScenarios.filter(function (value, idx, arr) {
    return value && arr.indexOf(value) === idx;
  });
  if (!selectedScenarios.length) {
    throw new Error('Select at least one scenario.');
  }
  selectedScenarios.forEach(function (scenarioId) {
    if (available.indexOf(scenarioId) === -1) {
      throw new Error('Unknown scenario "' + scenarioId + '".');
    }
  });

  var actionLabel = selectedActions
    .map(function (value) {
      if (value === 'summarise_accounts') {
        return 'Summarise Accounts';
      }
      if (value === 'journal') {
        return 'Journal';
      }
      if (value === 'daily') {
        return 'Daily';
      }
      if (value === 'monthly') {
        return 'Monthly';
      }
      if (value === 'dashboard') {
        return 'Dashboard';
      }
      return value;
    })
    .join(' + ');
  var scenarioLabel = selectedScenarios.join(', ');

  try {
    if (selectedActions.indexOf('summarise_accounts') !== -1) {
      selectedScenarios.forEach(function (scenarioId) {
        runAccountSummariesOnly_(buildScenarioModel_(scenarioId));
      });
    }

    if (selectedActions.indexOf('journal') !== -1) {
      if (selectedScenarios.length > 1 && typeof runJournalForScenarioIds_ === 'function') {
        runJournalForScenarioIds_(selectedScenarios);
      } else {
        var singleScenarioId = selectedScenarios[0];
        var scenarioModel = buildScenarioModel_(singleScenarioId);
        if (Engine && Engine.runJournalForScenarioModel) {
          Engine.runJournalForScenarioModel(scenarioModel);
        } else if (Engine && Engine.runJournalForScenario) {
          Engine.runJournalForScenario(singleScenarioId);
        } else {
          runJournal();
        }
      }
    }

    var daily = null;
    var monthly = null;
    var summaryScenarioFilter = selectedScenarios.length > 1 ? selectedScenarios : selectedScenarios[0];
    var needsJournalData =
      selectedActions.indexOf('daily') !== -1 ||
      selectedActions.indexOf('monthly') !== -1 ||
      selectedActions.indexOf('dashboard') !== -1;
    if (needsJournalData && typeof assertJournalRowsAvailableForScenarioSet_ === 'function') {
      assertJournalRowsAvailableForScenarioSet_(summaryScenarioFilter);
    }

    if (selectedActions.indexOf('daily') !== -1) {
      daily = buildDailySummary_(summaryScenarioFilter);
      if (typeof assertDailyReconcilesWithJournal_ === 'function') {
        assertDailyReconcilesWithJournal_(daily, summaryScenarioFilter);
      }
      writeDailySummary_(daily);
    }
    if (selectedActions.indexOf('monthly') !== -1) {
      if (!daily) {
        daily = buildDailySummary_(summaryScenarioFilter);
        if (typeof assertDailyReconcilesWithJournal_ === 'function') {
          assertDailyReconcilesWithJournal_(daily, summaryScenarioFilter);
        }
      }
      monthly = buildMonthlySummary_(daily);
      if (typeof assertMonthlyReconcilesWithDaily_ === 'function') {
        assertMonthlyReconcilesWithDaily_(monthly, daily);
      }
      writeMonthlySummary_(monthly);
    }
    if (selectedActions.indexOf('dashboard') !== -1) {
      if (!daily) {
        daily = buildDailySummary_(summaryScenarioFilter);
        if (typeof assertDailyReconcilesWithJournal_ === 'function') {
          assertDailyReconcilesWithJournal_(daily, summaryScenarioFilter);
        }
      }
      if (!monthly) {
        monthly = buildMonthlySummary_(daily);
        if (typeof assertMonthlyReconcilesWithDaily_ === 'function') {
          assertMonthlyReconcilesWithDaily_(monthly, daily);
        }
      }
      writeDashboard_(buildDashboardData_(daily, monthly, summaryScenarioFilter));
    }

    recordLastRunMetadata_('Run Budget: ' + actionLabel, scenarioLabel, 'Success');
    return actionLabel + ' complete for: ' + scenarioLabel + '.';
  } catch (err) {
    recordLastRunMetadata_('Run Budget: ' + actionLabel, scenarioLabel, 'Failed');
    throw err;
  }
}

function runAccountSummariesOnly_(scenarioModel) {
  var activeScenarioId = scenarioModel && scenarioModel.scenarioId
    ? normalizeScenario_(scenarioModel.scenarioId)
    : Config.SCENARIOS.DEFAULT;
  startRunProgress_('Account Summaries (' + activeScenarioId + ')', 3);
  try {
    toastStep_('Refreshing account summary values...');
    refreshAccountSummariesForScenarioModel_(scenarioModel || buildScenarioModel_(activeScenarioId));
    recordLastRunMetadata_('Account Summaries', activeScenarioId, 'Success');
    toastStep_('Account summaries complete.');
  } catch (err) {
    recordLastRunMetadata_('Account Summaries', activeScenarioId, 'Failed');
    throw err;
  } finally {
    endRunProgress_();
  }
}

function summariseAccounts() {
  runAccountSummariesOnly_(buildScenarioModel_(Config.SCENARIOS.DEFAULT));
}

function validateTransfersExpenses() {
  summariseAccounts();
}

function showSetupDialog() {
  var html = HtmlService.createHtmlOutputFromFile('SetupDialog')
    .setWidth(560)
    .setHeight(460);
  SpreadsheetApp.getUi().showModalDialog(html, 'Setup Options');
}

function runSetupAudit() {
  var ss = SpreadsheetApp.getActive();
  var defined = Object.keys(Config.SHEETS).map(function (key) {
    return Config.SHEETS[key];
  }).concat([Config.LISTS_SHEET]);
  var existingNames = ss.getSheets().map(function (sheet) {
    return sheet.getName();
  });
  var existingLookup = {};
  existingNames.forEach(function (name) {
    existingLookup[name] = true;
  });

  var missing = defined.filter(function (name) {
    return !existingLookup[name];
  });

  var requiredRanges = [
    Config.NAMED_RANGES.FORECAST_START,
    Config.NAMED_RANGES.FORECAST_END,
    Config.NAMED_RANGES.ACCOUNT_NAMES,
    Config.NAMED_RANGES.CATEGORIES,
    Config.NAMED_RANGES.INCOME_TYPES,
    Config.NAMED_RANGES.SCENARIOS,
  ];
  var missingRanges = requiredRanges.filter(function (name) {
    return !ss.getRangeByName(name);
  });

  var setupSheets = [
    Config.SHEETS.ACCOUNTS,
    Config.SHEETS.INCOME,
    Config.SHEETS.TRANSFERS,
    Config.SHEETS.GOALS,
    Config.SHEETS.RISK,
    Config.SHEETS.POLICIES,
    Config.SHEETS.EXPENSE,
    Config.SHEETS.JOURNAL,
  ];
  var headerIssues = setupSheets.filter(function (name) {
    var sheet = ss.getSheetByName(name);
    return !sheet || !hasHeaderRow_(sheet);
  });

  var orderIssue = false;
  if (typeof getPreferredSheetOrder_ === 'function') {
    var preferred = getPreferredSheetOrder_();
    var orderIndexes = preferred
      .filter(function (name) { return existingLookup[name]; })
      .map(function (name) { return existingNames.indexOf(name); });
    for (var i = 1; i < orderIndexes.length; i += 1) {
      if (orderIndexes[i] < orderIndexes[i - 1]) {
        orderIssue = true;
        break;
      }
    }
  }

  var items = [
    {
      title: 'Spreadsheets',
      ok: missing.length === 0,
      details: missing.length ? ('bad [' + missing.join(', ') + ']') : 'good [all]',
    },
    {
      title: 'Headers',
      ok: headerIssues.length === 0,
      details: headerIssues.length ? ('bad [' + headerIssues.join(', ') + ']') : 'good [all]',
    },
    {
      title: 'Named Ranges',
      ok: missingRanges.length === 0,
      details: missingRanges.length ? ('bad [' + missingRanges.join(', ') + ']') : 'good [all]',
    },
    {
      title: 'Tab Order',
      ok: !orderIssue,
      details: orderIssue ? 'bad [out of order]' : 'good [all]',
    },
  ];

  return {
    okCount: items.filter(function (item) { return item.ok; }).length,
    total: items.length,
    items: items,
  };
}


function runSetupActions(actions) {
  if (!actions || !actions.length) {
    return 'No actions selected.';
  }

  var ss = SpreadsheetApp.getActive();
  var messages = [];
  var selected = {};
  actions.forEach(function (action) {
    selected[action] = true;
  });

  var orderedActions = ['structure', 'validation', 'theme', 'reorder', 'defaults', 'categories'];
  orderedActions.forEach(function (action) {
    if (!selected[action]) {
      return;
    }
    switch (action) {
      case 'structure':
        setupStageStructure_();
        messages.push('Structure complete');
        break;
      case 'validation':
        setupStageValidationAndSettings_();
        messages.push('Validation + settings complete');
        break;
      case 'theme':
        setupStageTheme_();
        messages.push('Theme complete');
        break;
      case 'reorder':
        if (typeof enforcePreferredSheetOrder_ === 'function') {
          enforcePreferredSheetOrder_(ss);
          messages.push('Tab order enforced');
        } else {
          messages.push('Tab order helper unavailable');
        }
        break;
      case 'defaults':
        var result = loadDefaultData();
        messages.push(result && result.message ? result.message : 'Default data loaded.');
        break;
      case 'categories':
        // Backward compatibility: category stage has moved into validation setup.
        if (!selected.validation) {
          setupStageValidationAndSettings_();
          messages.push('Validation + settings complete');
        }
        break;
      default:
        messages.push('Unknown action: ' + action);
    }
  });
  if (typeof enforcePreferredSheetOrder_ === 'function') {
    enforcePreferredSheetOrder_(ss);
  }

  return messages.join(' | ');
}
