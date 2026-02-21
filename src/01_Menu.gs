// Entrypoints and menu wiring.
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var setupMenu = ui
    .createMenu('Setup')
    .addItem('Setup actions...', 'showSetupDialog');

  ui
    .createMenu('Budget Forecast')
    .addItem('Validate transfers/expenses', 'validateTransfersExpenses')
    .addItem('Run journal', 'runJournal')
    .addItem('Run summaries', 'runSummary')
    .addItem('Export', 'showExportDialog')
    .addSubMenu(setupMenu)
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
  runForecast();
}

function validateTransfersExpenses() {
  toastStep_('Validating transfers and expenses...');
  resetRunState_();
  deactivateExpiredTransfers_();
  normalizeTransferRows_();
  deactivateExpiredExpenses_();
  styleTransferRows_();
  styleExpenseRows_();
  var incomeRules = Readers.readIncome();
  var expenseMonthlyTotals = updateExpenseMonthlyAverages_();
  updateAccountMonthlyFlowAverages_(incomeRules, expenseMonthlyTotals || {});
  toastStep_('Validation complete.');
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

  var orderedActions = ['structure', 'validation', 'categories', 'defaults'];
  orderedActions.forEach(function (action) {
    if (!selected[action]) {
      return;
    }
    switch (action) {
      case 'structure':
        ss.toast('Applying sheet structure...', 'Setup');
        setupStageStructure_();
        messages.push('Structure complete');
        break;
      case 'validation':
        ss.toast('Applying validations + settings...', 'Setup');
        setupStageValidationAndSettings_();
        messages.push('Validation + settings complete');
        break;
      case 'categories':
        ss.toast('Seeding categories if empty...', 'Setup');
        setupStageSeedCategories_();
        messages.push('Categories seeded (if empty)');
        break;
      case 'defaults':
        ss.toast('Loading default data...', 'Setup');
        loadDefaultData();
        messages.push('Default data loaded');
        break;
      default:
        messages.push('Unknown action: ' + action);
    }
  });

  return messages.join(' | ');
}
