// Entrypoints and menu wiring.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Budget Forecast')
    .addItem('Run forecast', 'runForecast')
    .addItem('Run summary', 'runSummary')
    .addItem('Export', 'showExportDialog')
    .addItem('Setup…', 'showSetupDialog')
    .addToUi();
}

function runForecast() {
  if (Engine && Engine.runForecast) {
    Engine.runForecast();
  } else if (Logger && Logger.warn) {
    Logger.warn('Engine.runForecast is not implemented yet.');
  }
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
    .setWidth(360)
    .setHeight(320);
  SpreadsheetApp.getUi().showModalDialog(html, 'Setup Options');
}

function runSetupActions(actions) {
  if (!actions || !actions.length) {
    return 'No actions selected.';
  }

  var ss = SpreadsheetApp.getActive();
  var messages = [];

  actions.forEach(function (action) {
    switch (action) {
      case 'setup':
        ss.toast('Running setup…', 'Setup');
        setupSpreadsheet();
        messages.push('Setup complete');
        ss.toast('Setup complete', 'Setup');
        break;
      case 'defaults':
        ss.toast('Loading default data…', 'Setup');
        loadDefaultData();
        messages.push('Default data loaded');
        ss.toast('Default data loaded', 'Setup');
        break;
      case 'clearLogs':
        ss.toast('Clearing logs…', 'Setup');
        clearLogs();
        messages.push('Logs cleared');
        ss.toast('Logs cleared', 'Setup');
        break;
      default:
        messages.push('Unknown action: ' + action);
    }
  });

  return messages.join(' • ');
}

