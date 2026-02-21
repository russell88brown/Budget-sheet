// Entrypoints and menu wiring.
function onOpen() {
  var ui = SpreadsheetApp.getUi();

  ui
    .createMenu('Budget Forecast')
    .addItem('Run Main Scenario...', 'showMainScenarioRunDialog')
    .addItem('Run Custom Scenario(s)...', 'showCustomScenarioRunDialog')
    .addSeparator()
    .addItem('Summarise Accounts', 'summariseAccounts')
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

function showMainScenarioRunDialog() {
  showScenarioRunDialog_('main');
}

function showCustomScenarioRunDialog() {
  showScenarioRunDialog_('custom');
}

function showScenarioRunDialog_(mode) {
  var dialogMode = mode === 'custom' ? 'custom' : 'main';
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
  template.mode = dialogMode;
  template.title = dialogMode === 'custom' ? 'Run Custom Scenario(s)' : 'Run Main Scenario';
  var html = template.evaluate().setWidth(420).setHeight(340);
  SpreadsheetApp.getUi().showModalDialog(html, template.title);
}

function runScenarioSelections(mode, actions, scenarioIds) {
  var dialogMode = mode === 'custom' ? 'custom' : 'main';
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
    if (actionType !== 'journal' && actionType !== 'summary') {
      throw new Error('Unknown action type.');
    }
  });

  var selectedScenarios = dialogMode === 'main'
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
    if (selectedActions.indexOf('journal') !== -1) {
      if (Engine && Engine.runJournalForScenario) {
        Engine.runJournalForScenario(scenarioId);
      } else {
        runJournal();
      }
    }
    if (selectedActions.indexOf('summary') !== -1) {
      runSummaryForScenario(scenarioId);
    }
    executed.push(scenarioId);
  });

  var actionLabel = selectedActions
    .map(function (value) { return value === 'summary' ? 'Summaries' : 'Journal'; })
    .join(' + ');
  return actionLabel + ' complete for: ' + executed.join(', ') + '.';
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
