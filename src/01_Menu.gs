// Entrypoints and menu wiring.
function onOpen() {
  var ui = SpreadsheetApp.getUi();

  ui
    .createMenu('Budget Forecast')
    .addItem('Summarise Accounts', 'summariseAccounts')
    .addItem('Run journal (Base)', 'runJournal')
    .addItem('Run journal for scenario...', 'runJournalForScenarioPrompt')
    .addItem('Run summaries (Base)', 'runSummary')
    .addItem('Run summaries for scenario...', 'runSummaryForScenarioPrompt')
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

function runJournalForScenarioPrompt() {
  var scenarioId = promptScenarioId_('Run journal for scenario');
  if (!scenarioId) {
    return;
  }
  if (Engine && Engine.runJournalForScenario) {
    Engine.runJournalForScenario(scenarioId);
    return;
  }
  runJournal();
}

function runSummaryForScenarioPrompt() {
  var scenarioId = promptScenarioId_('Run summaries for scenario');
  if (!scenarioId) {
    return;
  }
  runSummaryForScenario(scenarioId);
}

function promptScenarioId_(title) {
  var ui = SpreadsheetApp.getUi();
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

  var response = ui.prompt(
    title || 'Scenario',
    'Enter scenario id.\nAvailable: ' + available.join(', '),
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) {
    return null;
  }
  var scenarioId = normalizeScenario_(response.getResponseText());
  if (available.indexOf(scenarioId) === -1) {
    ui.alert('Unknown scenario "' + scenarioId + '". Available: ' + available.join(', '));
    return null;
  }
  return scenarioId;
}

function summariseAccounts() {
  startRunProgress_('Account Summaries', 6);
  try {
    toastStep_('Starting account summaries...');
    resetRunState_();
    preprocessInputSheets_();
    toastStep_('Refreshing account summary values...');
    refreshAccountSummaries_();
    toastStep_('Account summaries complete.');
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
