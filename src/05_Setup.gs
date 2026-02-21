// Spreadsheet setup utilities based on schema definitions.
function setupSpreadsheet() {
  var ss = SpreadsheetApp.getActive();

  ensureAccountNameRanges_(ss);
  ensureCategoryRange_(ss);
  ensureSinkFundRange_(ss);
  removeExpenseColumns_(ss, ['Monthly Spend', 'Archive']);
  migrateLegacyTransfersFromExpense_(ss);

  Schema.inputs.concat(Schema.outputs).forEach(function (spec) {
    var headers = spec.columns.map(function (column) {
      return column.name;
    });
    var sheet = ensureSheetWithHeaders_(ss, spec.name, headers);
    applyColumnRules_(ss, sheet, spec.columns);
  });

  reorderSheets_(ss);
  formatReferenceSheet_(ss);
}

function removeExpenseColumns_(spreadsheet, columnNames) {
  var sheet = spreadsheet.getSheetByName(Config.SHEETS.EXPENSE);
  if (!sheet || !columnNames || !columnNames.length) {
    return;
  }
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    return;
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var indices = [];
  columnNames.forEach(function (name) {
    var idx = headers.indexOf(name);
    if (idx !== -1) {
      indices.push(idx + 1);
    }
  });
  indices
    .sort(function (a, b) {
      return b - a;
    })
    .forEach(function (colIndex) {
      sheet.deleteColumn(colIndex);
    });
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
    } else if (column.type === 'ref') {
      var accounts = getAccountNames_(spreadsheet);
      if (accounts.length) {
        var refBuilder = SpreadsheetApp.newDataValidation().requireValueInList(accounts, true);
        refBuilder.setAllowInvalid(!column.required);
        range.setDataValidation(refBuilder.build());
      }
    } else if (column.type === 'ref_or_external_conditional' && sheet.getName() === Config.SHEETS.EXPENSE) {
      // Legacy type retained for compatibility with older schemas.
      var paidToCol = columnToLetter_(colIndex);
      var accounts = getAccountNames_(spreadsheet);
      var accountsWithExternal = ['External'].concat(accounts);
      var listBuilder = SpreadsheetApp.newDataValidation().requireValueInList(accountsWithExternal, true);
      listBuilder.setAllowInvalid(!column.required);
      range.setDataValidation(listBuilder.build());
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

function formatReferenceSheet_(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(Config.LISTS_SHEET);
  if (!sheet) {
    return;
  }

  var lastCol = Math.max(5, sheet.getLastColumn());
  sheet.getRange(1, 1, 1, lastCol).setFontWeight('bold').setBackground('#e9eef7');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, lastCol);

  sheet.getRange('A2:B').setNumberFormat('yyyy-mm-dd');
  sheet.getRange('E2:E').setNumberFormat('0.00');
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

function reorderSheets_(spreadsheet) {
  var order = [
    Config.SHEETS.DASHBOARD,
    Config.SHEETS.ACCOUNTS,
    Config.SHEETS.TRANSFERS,
    Config.SHEETS.INCOME,
    Config.SHEETS.EXPENSE,
    Config.SHEETS.JOURNAL,
    Config.SHEETS.DAILY,
    Config.SHEETS.MONTHLY,
    Config.SHEETS.EXPORT,
    Config.LISTS_SHEET,
    Config.SHEETS.LOGS,
  ];

  order.forEach(function (name, index) {
    var sheet = spreadsheet.getSheetByName(name);
    if (sheet) {
      spreadsheet.setActiveSheet(sheet);
      spreadsheet.moveActiveSheet(index + 1);
    }
  });
}

function migrateLegacyTransfersFromExpense_(spreadsheet) {
  var expenseSheet = spreadsheet.getSheetByName(Config.SHEETS.EXPENSE);
  if (!expenseSheet) {
    return;
  }

  var lastRow = expenseSheet.getLastRow();
  var lastCol = expenseSheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return;
  }

  var headers = expenseSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var typeIdx = headers.indexOf('Transaction Type');
  if (typeIdx === -1) {
    return;
  }

  var includeIdx = headers.indexOf('Include');
  var categoryIdx = headers.indexOf('Category');
  var nameIdx = headers.indexOf('Name');
  var amountIdx = headers.indexOf('Amount');
  var frequencyIdx = headers.indexOf('Frequency');
  var startIdx = headers.indexOf('Start Date');
  var endIdx = headers.indexOf('End Date');
  var fromIdx = headers.indexOf('From Account');
  var toIdx = headers.indexOf('To Account');
  var notesIdx = headers.indexOf('Notes');
  if (includeIdx === -1 || nameIdx === -1) {
    return;
  }

  var transferSheet = spreadsheet.getSheetByName(Config.SHEETS.TRANSFERS);
  if (!transferSheet) {
    transferSheet = spreadsheet.insertSheet(Config.SHEETS.TRANSFERS);
  }
  if (transferSheet.getLastRow() > 1) {
    return;
  }

  var values = expenseSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var expenseRows = [];
  var transferRows = [];

  values.forEach(function (row) {
    var type = normalizeBehavior_(row[typeIdx]);
    if (type === Config.BEHAVIOR_LABELS.Transfer || type === Config.BEHAVIOR_LABELS.Repayment) {
      transferRows.push([
        row[includeIdx],
        type,
        nameIdx === -1 ? '' : row[nameIdx],
        amountIdx === -1 ? '' : row[amountIdx],
        frequencyIdx === -1 ? '' : row[frequencyIdx],
        startIdx === -1 ? '' : row[startIdx],
        endIdx === -1 ? '' : row[endIdx],
        fromIdx === -1 ? '' : row[fromIdx],
        toIdx === -1 ? '' : row[toIdx],
        notesIdx === -1 ? '' : row[notesIdx],
      ]);
      return;
    }

    expenseRows.push([
      row[includeIdx],
      categoryIdx === -1 ? '' : row[categoryIdx],
      nameIdx === -1 ? '' : row[nameIdx],
      amountIdx === -1 ? '' : row[amountIdx],
      frequencyIdx === -1 ? '' : row[frequencyIdx],
      startIdx === -1 ? '' : row[startIdx],
      endIdx === -1 ? '' : row[endIdx],
      fromIdx === -1 ? '' : row[fromIdx],
      notesIdx === -1 ? '' : row[notesIdx],
    ]);
  });

  if (!expenseRows.length && !transferRows.length) {
    return;
  }

  expenseSheet.getRange(2, 1, Math.max(lastRow - 1, 1), lastCol).clearContent();
  if (expenseRows.length) {
    expenseSheet.getRange(2, 1, expenseRows.length, expenseRows[0].length).setValues(expenseRows);
  }
  if (transferRows.length) {
    transferSheet.getRange(2, 1, transferRows.length, transferRows[0].length).setValues(transferRows);
  }
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
