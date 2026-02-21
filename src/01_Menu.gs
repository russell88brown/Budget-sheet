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
  showScenarioRunDialog_('journal');
}

function runSummaryForScenarioPrompt() {
  showScenarioRunDialog_('summary');
}

function showScenarioRunDialog_(action) {
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
  template.action = action || 'journal';
  template.title = template.action === 'summary' ? 'Run summaries for scenario' : 'Run journal for scenario';
  var html = template.evaluate().setWidth(360).setHeight(240);
  SpreadsheetApp.getUi().showModalDialog(html, template.title);
}

function runScenarioAction(action, scenarioId) {
  var activeScenario = normalizeScenario_(scenarioId);
  var available = (Readers && Readers.readScenarios ? Readers.readScenarios() : [Config.SCENARIOS.DEFAULT])
    .map(function (value) {
      return normalizeScenario_(value);
    })
    .filter(function (value, idx, arr) {
      return value && arr.indexOf(value) === idx;
    });
  if (available.indexOf(activeScenario) === -1) {
    throw new Error('Unknown scenario "' + activeScenario + '".');
  }

  if (action === 'summary') {
    runSummaryForScenario(activeScenario);
    return 'Summaries complete for ' + activeScenario + '.';
  }
  if (Engine && Engine.runJournalForScenario) {
    Engine.runJournalForScenario(activeScenario);
    return 'Journal complete for ' + activeScenario + '.';
  }
  runJournal();
  return 'Journal complete.';
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
