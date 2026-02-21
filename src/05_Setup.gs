// Spreadsheet setup utilities based on schema definitions.
function setupSpreadsheet() {
  setupStageStructure_();
  setupStageValidationAndSettings_();
}

function setupStageStructure_() {
  var ss = SpreadsheetApp.getActive();

  Schema.inputs.concat(Schema.outputs).forEach(function (spec) {
    var headers = spec.columns.map(function (column) {
      return column.name;
    });
    ensureSheetWithHeaders_(ss, spec.name, headers);
  });

  reorderSheets_(ss);
}

function setupStageValidationAndSettings_() {
  var ss = SpreadsheetApp.getActive();

  ensureAccountNameRanges_(ss);
  ensureCategoryRange_(ss);

  Schema.inputs.concat(Schema.outputs).forEach(function (spec) {
    var headers = spec.columns.map(function (column) {
      return column.name;
    });
    var sheet = ensureSheetWithHeaders_(ss, spec.name, headers);
    applyColumnRules_(ss, sheet, spec.columns);
  });

  formatReferenceSheet_(ss);
}

function setupStageSeedCategories_() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(Config.LISTS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(Config.LISTS_SHEET);
  }
  setupReferenceLayout_(ss, sheet);
}

function ensureSheetWithHeaders_(spreadsheet, sheetName, headers) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  var lastCol = Math.max(sheet.getLastColumn(), headers.length);
  if (lastCol > 0) {
    sheet.getRange(1, 1, 1, lastCol).clearContent();
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  return sheet;
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

function applyColumnRules_(spreadsheet, sheet, columns) {
  columns.forEach(function (column, index) {
    var colIndex = index + 1;
    var colLetter = columnToLetter_(colIndex);
    var range = sheet.getRange(colLetter + '2:' + colLetter);

    if (column.type === 'enum' && column.enumValues && column.enumValues.length) {
      var builder = SpreadsheetApp.newDataValidation().requireValueInList(column.enumValues, true);
      builder.setAllowInvalid(!column.required);
      range.setDataValidation(builder.build());
    } else if (column.type === 'boolean') {
      var booleanBuilder = SpreadsheetApp.newDataValidation().requireCheckbox();
      booleanBuilder.setAllowInvalid(!column.required);
      range.setDataValidation(booleanBuilder.build());
    } else if (column.type === 'positive_int') {
      var intBuilder = SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(1);
      intBuilder.setAllowInvalid(!column.required);
      range.setDataValidation(intBuilder.build());
    } else if (column.type === 'ref') {
      var accountRange = spreadsheet.getRangeByName(Config.NAMED_RANGES.ACCOUNT_NAMES);
      if (accountRange) {
        var refBuilder = SpreadsheetApp.newDataValidation().requireValueInRange(accountRange, true);
        refBuilder.setAllowInvalid(!column.required);
        range.setDataValidation(refBuilder.build());
      } else {
        var accounts = getAccountNames_(spreadsheet);
        if (accounts.length) {
          var refBuilder = SpreadsheetApp.newDataValidation().requireValueInList(accounts, true);
          refBuilder.setAllowInvalid(!column.required);
          range.setDataValidation(refBuilder.build());
        }
      }
    } else if (column.type === 'category') {
      var categoriesRange = spreadsheet.getRangeByName(Config.NAMED_RANGES.CATEGORIES);
      if (categoriesRange) {
        var categoriesBuilder = SpreadsheetApp.newDataValidation().requireValueInRange(
          categoriesRange,
          true
        );
        categoriesBuilder.setAllowInvalid(!column.required);
        range.setDataValidation(categoriesBuilder.build());
      }
    }

    if (column.format) {
      range.setNumberFormat(column.format);
    }
  });

  applyHeaderFormatting_(sheet, columns.length);
}

function ensureAccountNameRanges_(spreadsheet) {
  var accountsSheet = spreadsheet.getSheetByName(Config.SHEETS.ACCOUNTS);
  if (!accountsSheet) {
    return;
  }

  var listsSheet = spreadsheet.getSheetByName(Config.LISTS_SHEET);
  if (!listsSheet) {
    listsSheet = spreadsheet.insertSheet(Config.LISTS_SHEET);
  }

  setupReferenceLayout_(spreadsheet, listsSheet);
  bindNamedRange_(spreadsheet, Config.NAMED_RANGES.ACCOUNT_NAMES, accountsSheet.getRange('A2:A'));
}

function ensureCategoryRange_(spreadsheet) {
  var listsSheet = spreadsheet.getSheetByName(Config.LISTS_SHEET);
  if (!listsSheet) {
    listsSheet = spreadsheet.insertSheet(Config.LISTS_SHEET);
  }

  setupReferenceLayout_(spreadsheet, listsSheet);
}

function formatReferenceSheet_(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(Config.LISTS_SHEET);
  if (!sheet) {
    return;
  }

  setupReferenceLayout_(spreadsheet, sheet);

  var lastCol = Math.max(4, sheet.getLastColumn());
  sheet.getRange('A1:B1').setFontWeight('bold').setBackground('#e9eef7');
  sheet.getRange('D1').setFontWeight('bold').setBackground('#e9eef7');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, lastCol);

  sheet.getRange('B2:B3').setNumberFormat('yyyy-mm-dd');
  sheet.getRange('A2:A3').setFontWeight('bold');
  sheet.getRange('A2:B3').setBorder(true, true, true, true, true, true, '#dddddd', SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange('D1:D').setHorizontalAlignment('left');
  // Input boxes for expected user-edited values.
  sheet.getRange('B2:B3').setBorder(true, true, true, true, false, false, '#1a73e8', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sheet.getRange('B2:B3').setBackground('#eef5ff');
  var categoryBoxRows = Math.max(12, sheet.getLastRow());
  sheet.getRange(2, 4, categoryBoxRows - 1, 1).setBorder(
    true,
    true,
    true,
    true,
    false,
    false,
    '#1a73e8',
    SpreadsheetApp.BorderStyle.SOLID_MEDIUM
  );
  sheet.getRange(2, 4, categoryBoxRows - 1, 1).setBackground('#eef5ff');
}

function setupReferenceLayout_(spreadsheet, sheet) {
  sheet.getRange('A1').setValue('Setting');
  sheet.getRange('B1').setValue('Value');
  sheet.getRange('A2').setValue('Forecast Start');
  sheet.getRange('A3').setValue('Forecast End');
  sheet.getRange('D1').setValue('Expense Category');

  bindNamedRange_(spreadsheet, Config.NAMED_RANGES.FORECAST_START, sheet.getRange('B2'));
  bindNamedRange_(spreadsheet, Config.NAMED_RANGES.FORECAST_END, sheet.getRange('B3'));
  seedReferenceDefaults_(spreadsheet, sheet);
}

function bindNamedRange_(spreadsheet, name, range) {
  try {
    spreadsheet.setNamedRange(name, range);
  } catch (_err) {
    spreadsheet.removeNamedRange(name);
    spreadsheet.setNamedRange(name, range);
  }
}

function seedReferenceDefaults_(spreadsheet, sheet) {
  var startCell = sheet.getRange('B2');
  var endCell = sheet.getRange('B3');
  if (!startCell.getValue()) {
    startCell.setValue(new Date());
  }
  if (!endCell.getValue()) {
    var endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 24);
    endCell.setValue(endDate);
  }

  var lastRow = Math.max(sheet.getLastRow(), 2);
  var existingCategories = sheet.getRange(2, 4, lastRow - 1, 1).getValues();
  var hasAnyCategory = existingCategories.some(function (row) {
    return row[0] !== '' && row[0] !== null;
  });
  if (!hasAnyCategory) {
    var categories = [
      '01. Utilities',
      '02. Living',
      '03. Health',
      '04. Car Expense',
      '05. Luxury',
      '06. Debt',
      '07. Investment - Liquid',
      '08. Investment - Locked',
    ];
    sheet.getRange(2, 4, categories.length, 1).setValues(
      categories.map(function (value) {
        return [value];
      })
    );
  }
  bindNamedRange_(spreadsheet, Config.NAMED_RANGES.CATEGORIES, sheet.getRange('D2:D'));
}

function getAccountNames_(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(Config.SHEETS.ACCOUNTS);
  if (!sheet) {
    return [];
  }
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }
  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  return values
    .map(function (row) {
      return row[0];
    })
    .filter(function (value) {
      return value !== '' && value !== null;
    });
}

function reorderSheets_(spreadsheet) {
  var order = [
    Config.SHEETS.ACCOUNTS,
    Config.SHEETS.INCOME,
    Config.SHEETS.TRANSFERS,
    Config.SHEETS.EXPENSE,
    Config.SHEETS.JOURNAL,
    Config.SHEETS.DAILY,
    Config.SHEETS.MONTHLY,
    Config.SHEETS.DASHBOARD,
    Config.SHEETS.EXPORT,
    Config.LISTS_SHEET,
    Config.SHEETS.LOGS,
  ];

  var targetPosition = 1;
  order.forEach(function (name) {
    var sheet = spreadsheet.getSheetByName(name);
    if (sheet) {
      spreadsheet.setActiveSheet(sheet);
      spreadsheet.moveActiveSheet(targetPosition);
      targetPosition += 1;
    }
  });
}

function columnToLetter_(column) {
  var temp = '';
  var letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

function applyHeaderFormatting_(sheet, headerCount) {
  if (!headerCount) {
    return;
  }
  var range = sheet.getRange(1, 1, 1, headerCount);
  range.setWrap(true);
  range.setHorizontalAlignment('center');
  range.setVerticalAlignment('middle');
}
