// Entrypoints and menu wiring.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Budget Forecast')
    .addItem('Run forecast', 'runForecast')
    .addItem('Clear logs', 'clearLogs')
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
}
