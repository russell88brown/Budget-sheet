// Spreadsheet setup utilities based on schema definitions.
function setupSpreadsheet() {
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

  reorderSheets_(ss);
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
    } else if (column.type === 'ref') {
      var namedRange = spreadsheet.getRangeByName(Config.NAMED_RANGES.ACCOUNT_NAMES);
      if (namedRange) {
        var refBuilder = SpreadsheetApp.newDataValidation().requireValueInRange(namedRange, true);
        refBuilder.setAllowInvalid(!column.required);
        range.setDataValidation(refBuilder.build());
      }
    } else if (column.type === 'ref_or_external') {
      var namedRangeWithExternal = spreadsheet.getRangeByName(
        Config.NAMED_RANGES.ACCOUNT_NAMES_WITH_EXTERNAL
      );
      if (namedRangeWithExternal) {
        var refExternalBuilder = SpreadsheetApp.newDataValidation().requireValueInRange(
          namedRangeWithExternal,
          true
        );
        refExternalBuilder.setAllowInvalid(!column.required);
        range.setDataValidation(refExternalBuilder.build());
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

  listsSheet.getRange('A1').setValue('External');
  listsSheet.getRange('A2').setFormula(
    '=FILTER(' + Config.SHEETS.ACCOUNTS + '!A2:A, ' + Config.SHEETS.ACCOUNTS + '!A2:A<>"")'
  );

  spreadsheet.setNamedRange(
    Config.NAMED_RANGES.ACCOUNT_NAMES,
    accountsSheet.getRange('A2:A')
  );
  spreadsheet.setNamedRange(
    Config.NAMED_RANGES.ACCOUNT_NAMES_WITH_EXTERNAL,
    listsSheet.getRange('A1:A')
  );
}

function ensureCategoryRange_(spreadsheet) {
  var listsSheet = spreadsheet.getSheetByName(Config.LISTS_SHEET);
  if (!listsSheet) {
    listsSheet = spreadsheet.insertSheet(Config.LISTS_SHEET);
  }

  listsSheet.getRange('A1').setValue('Expense Category');
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

  listsSheet.getRange(2, 1, categories.length, 1).setValues(
    categories.map(function (value) {
      return [value];
    })
  );

  spreadsheet.setNamedRange(Config.NAMED_RANGES.CATEGORIES, listsSheet.getRange('A1:A'));
}

function reorderSheets_(spreadsheet) {
  var order = [
    Config.SHEETS.ACCOUNTS,
    Config.SHEETS.INCOME,
    Config.SHEETS.EXPENSE,
    Config.SHEETS.JOURNAL,
    Config.SHEETS.DAILY_SUMMARY,
    Config.SHEETS.OVERVIEW,
    Config.SHEETS.LOGS,
    Config.LISTS_SHEET,
  ];

  order.forEach(function (name, index) {
    var sheet = spreadsheet.getSheetByName(name);
    if (sheet) {
      spreadsheet.setActiveSheet(sheet);
      spreadsheet.moveActiveSheet(index + 1);
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
