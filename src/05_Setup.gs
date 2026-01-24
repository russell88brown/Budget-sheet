// Spreadsheet setup utilities based on schema definitions.
function setupSpreadsheet() {
  var ss = SpreadsheetApp.getActive();

  ensureAccountNameRanges_(ss);
  ensureCategoryRange_(ss);
  ensureSinkFundRange_(ss);

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
      var accounts = getAccountNames_(spreadsheet);
      if (accounts.length) {
        var refBuilder = SpreadsheetApp.newDataValidation().requireValueInList(accounts, true);
        refBuilder.setAllowInvalid(!column.required);
        range.setDataValidation(refBuilder.build());
      }
    } else if (column.type === 'ref_or_external_conditional' && sheet.getName() === Config.SHEETS.EXPENSE) {
      var paidToCol = columnToLetter_(colIndex);
      var typeCol = columnToLetter_(findColumnIndex_(sheet, 'Transaction Type') || 2);
      var accounts = getAccountNames_(spreadsheet);
      var accountsWithExternal = ['External'].concat(accounts);
      var listBuilder = SpreadsheetApp.newDataValidation().requireValueInList(accountsWithExternal, true);
      listBuilder.setAllowInvalid(!column.required);
      range.setDataValidation(listBuilder.build());

      applyPaidToConditionalRule_(sheet, typeCol, paidToCol);
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

  listsSheet.getRange('A1').setValue('Forecast Start');
  listsSheet.getRange('B1').setValue('Forecast End');
  listsSheet.getRange('D1').setValue('Sink Fund Account');
  listsSheet.getRange('E1').setValue('Sink Fund Amount Per Week');
  var startCell = listsSheet.getRange('A2');
  var endCell = listsSheet.getRange('B2');
  if (!startCell.getValue()) {
    startCell.setValue(new Date());
  }
  if (!endCell.getValue()) {
    var endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 24);
    endCell.setValue(endDate);
  }

}

function ensureCategoryRange_(spreadsheet) {
  var listsSheet = spreadsheet.getSheetByName(Config.LISTS_SHEET);
  if (!listsSheet) {
    listsSheet = spreadsheet.insertSheet(Config.LISTS_SHEET);
  }

  listsSheet.getRange('C1').setValue('Expense Category');
  var existing = listsSheet.getRange('C2').getValue();
  if (existing) {
    return;
  }
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

  listsSheet.getRange(2, 3, categories.length, 1).setValues(
    categories.map(function (value) {
      return [value];
    })
  );

  spreadsheet.setNamedRange(Config.NAMED_RANGES.CATEGORIES, listsSheet.getRange('C2:C'));
}

function ensureSinkFundRange_(spreadsheet) {
  var accountsSheet = spreadsheet.getSheetByName(Config.SHEETS.ACCOUNTS);
  if (!accountsSheet) {
    return;
  }

  var lastRow = accountsSheet.getLastRow();
  if (lastRow < 2) {
    return;
  }

  var range = accountsSheet.getRange('A2:A');
  spreadsheet.setNamedRange(Config.NAMED_RANGES.SINK_FUNDS, range);
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

function findColumnIndex_(sheet, headerName) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    return null;
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (headers[i] === headerName) {
      return i + 1;
    }
  }
  return null;
}

function applyPaidToConditionalRule_(sheet, typeCol, paidToCol) {
  var formula = '=AND($' + typeCol + '2<>\"Expense\",$' + paidToCol + '2=\"External\")';
  var rules = sheet.getConditionalFormatRules();
  var targetRange = sheet.getRange(paidToCol + '2:' + paidToCol);

  var existing = rules.filter(function (rule) {
    var ruleFormula = rule.getBooleanCondition() ? rule.getBooleanCondition().getCriteriaValues()[0] : '';
    return ruleFormula === formula;
  });

  if (existing.length === 0) {
    var rule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(formula)
      .setBackground('#f8d7da')
      .setRanges([targetRange])
      .build();
    rules.push(rule);
    sheet.setConditionalFormatRules(rules);
  }
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
