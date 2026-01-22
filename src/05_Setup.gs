// Spreadsheet setup utilities based on schema definitions.
function setupSpreadsheet() {
  var ss = SpreadsheetApp.getActive();

  Schema.inputs.concat(Schema.outputs).forEach(function (spec) {
    ensureSheetWithHeaders_(ss, spec.name, spec.headers);
  });
}

function ensureSheetWithHeaders_(spreadsheet, sheetName, headers) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  if (!hasHeaderRow_(sheet)) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
}

function hasHeaderRow_(sheet) {
  if (sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) {
    return false;
  }
  var lastCol = sheet.getLastColumn();
  var values = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  return values.some(function (value) {
    return value !== '' && value !== null;
  });
}
