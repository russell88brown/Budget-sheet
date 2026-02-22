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
  template.defaultScenario = Config.SCENARIOS.DEFAULT;
  template.title = 'Run Budget';
  var html = template.evaluate().setWidth(480).setHeight(560);
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
      actionType !== 'validate_accounts' &&
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

  var executed = [];
  selectedScenarios.forEach(function (scenarioId) {
    var daily = null;
    var monthly = null;

    if (selectedActions.indexOf('validate_accounts') !== -1) {
      runValidationAndAccountSummaries_(scenarioId);
    }
    if (selectedActions.indexOf('journal') !== -1) {
      if (Engine && Engine.runJournalForScenario) {
        Engine.runJournalForScenario(scenarioId);
      } else {
        runJournal();
      }
    }
    if (selectedActions.indexOf('daily') !== -1) {
      daily = buildDailySummary_(scenarioId);
      writeDailySummary_(daily);
    }
    if (selectedActions.indexOf('monthly') !== -1) {
      if (!daily) {
        daily = buildDailySummary_(scenarioId);
      }
      monthly = buildMonthlySummary_(daily);
      writeMonthlySummary_(monthly);
    }
    if (selectedActions.indexOf('dashboard') !== -1) {
      if (!daily) {
        daily = buildDailySummary_(scenarioId);
      }
      if (!monthly) {
        monthly = buildMonthlySummary_(daily);
      }
      writeDashboard_(buildDashboardData_(daily, monthly, scenarioId));
    }
    executed.push(scenarioId);
  });

  var actionLabel = selectedActions
    .map(function (value) {
      if (value === 'validate_accounts') {
        return 'Validate + Account Summaries';
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
  return actionLabel + ' complete for: ' + executed.join(', ') + '.';
}

function runScenarioSelections(mode, actions, scenarioIds) {
  return runBudgetSelections(actions, mode === 'custom' ? 'custom' : 'base', scenarioIds);
}

function runValidationAndAccountSummaries_(scenarioId) {
  startRunProgress_('Validate + Accounts (' + normalizeScenario_(scenarioId) + ')', 6);
  try {
    toastStep_('Normalizing and validating input rows...');
    resetRunState_();
    preprocessInputSheets_();
    toastStep_('Refreshing account summary values...');
    refreshAccountSummaries_();
    recordLastRunMetadata_('Validate + Account Summaries', scenarioId, 'Success');
  } catch (err) {
    recordLastRunMetadata_('Validate + Account Summaries', scenarioId, 'Failed');
    throw err;
  } finally {
    endRunProgress_();
  }
}

function summariseAccounts() {
  startRunProgress_('Account Summaries', 6);
  try {
    toastStep_('Starting account summaries...');
    resetRunState_();
    preprocessInputSheets_();
    toastStep_('Refreshing account summary values...');
    refreshAccountSummaries_();
    recordLastRunMetadata_('Account Summaries', Config.SCENARIOS.DEFAULT, 'Success');
    toastStep_('Account summaries complete.');
  } catch (err) {
    recordLastRunMetadata_('Account Summaries', Config.SCENARIOS.DEFAULT, 'Failed');
    throw err;
  } finally {
    endRunProgress_();
  }
}

function validateTransfersExpenses() {
  summariseAccounts();
}

function showSetupDialog() {
  var html = HtmlService.createHtmlOutputFromFile('SetupDialog')
    .setWidth(420)
    .setHeight(340);
  SpreadsheetApp.getUi().showModalDialog(html, 'Setup Options');
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

  var orderedActions = ['structure', 'validation', 'theme', 'defaults', 'categories'];
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

  return messages.join(' | ');
}
