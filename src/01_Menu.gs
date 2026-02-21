// Entrypoints and menu wiring.
function onOpen() {
  var ui = SpreadsheetApp.getUi();

  ui
    .createMenu('Budget Forecast')
    .addItem('Summarise Accounts', 'showSummariseDialog')
    .addItem('Run journal', 'showRunJournalDialog')
    .addItem('Run summaries', 'showRunSummaryDialog')
    .addItem('Export', 'showExportDialog')
    .addItem('Setup actions...', 'showSetupDialog')
    .addToUi();
}

function runForecast() {
  if (Engine && Engine.runForecast) {
    Engine.runForecast();
  } else if (Logger && Logger.warn) {
    Logger.warn('Engine.runForecast is not implemented yet.');
  }
}

function runJournal() {
  if (Engine && Engine.runJournalOnly) {
    Engine.runJournalOnly();
  } else {
    runForecast();
  }
}

function summariseAccounts() {
  resetRunState_();
  preprocessInputSheets_();
  refreshAccountSummaries_();
}

function validateTransfersExpenses() {
  summariseAccounts();
}

function clearLogs() {
  if (Logger && Logger.clear) {
    Logger.clear();
  }
  var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.LOGS);
  if (sheet) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
  }
}

function showSetupDialog() {
  var html = HtmlService.createHtmlOutputFromFile('SetupDialog')
    .setWidth(420)
    .setHeight(340);
  SpreadsheetApp.getUi().showModalDialog(html, 'Setup Options');
}

function showSummariseDialog() {
  showActionDialog_('summarise', 'Summarise Accounts');
}

function showRunJournalDialog() {
  showActionDialog_('journal', 'Run Journal');
}

function showRunSummaryDialog() {
  showActionDialog_('summary', 'Run Summaries');
}

function showActionDialog_(action, title) {
  var template = HtmlService.createTemplateFromFile('ActionDialog');
  template.action = action;
  template.title = title || 'Run Action';
  template.stages = getActionStages_(action);
  var html = template.evaluate().setWidth(420).setHeight(360);
  SpreadsheetApp.getUi().showModalDialog(html, title || 'Run Action');
}

function getActionStages_(action) {
  if (action === 'summarise') {
    return [
      'Reset run state',
      'Normalize input rows',
      'Review and cleanup inputs',
      'Flag inactive income by date',
      'Flag inactive transfers by date',
      'Flag inactive expenses by date',
      'Flag inactive policies by date',
      'Recompute account monthly summaries',
    ];
  }
  if (action === 'journal') {
    return [
      'Read inputs, build events, write journal',
    ];
  }
  if (action === 'summary') {
    return [
      'Build and write Daily / Monthly / Dashboard',
    ];
  }
  return ['Run action'];
}

function runActionStage_(action, stageIndex) {
  if (action === 'summarise') {
    switch (stageIndex) {
      case 0:
        resetRunState_();
        return 'Run state reset.';
      case 1:
        normalizeAccountRows_();
        normalizeTransferRows_();
        normalizeRecurrenceRows_();
        return 'Inputs normalized.';
      case 2:
        reviewAndCleanupInputSheets_();
        return 'Inputs reviewed and cleaned.';
      case 3:
        flagExpiredIncome_();
        return 'Inactive income flagged.';
      case 4:
        flagExpiredTransfers_();
        return 'Inactive transfers flagged.';
      case 5:
        flagExpiredExpenses_();
        return 'Inactive expenses flagged.';
      case 6:
        flagExpiredPolicies_();
        return 'Inactive policies flagged.';
      case 7:
        refreshAccountSummaries_();
        return 'Account summaries updated.';
      default:
        return 'Done.';
    }
  }

  if (action === 'journal') {
    if (stageIndex === 0) {
      runJournal();
      return 'Journal run complete.';
    }
    return 'Done.';
  }

  if (action === 'summary') {
    if (stageIndex === 0) {
      runSummary();
      return 'Summary sheets updated.';
    }
    return 'Done.';
  }

  throw new Error('Unknown action: ' + action);
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
