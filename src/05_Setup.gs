// Spreadsheet setup utilities based on schema definitions.
function setupSpreadsheet() {
  setupStageStructure_();
  setupStageValidationAndSettings_();
  setupStageTheme_();
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
  setupStageSeedCategories_();

  Schema.inputs.concat(Schema.outputs).forEach(function (spec) {
    var headers = spec.columns.map(function (column) {
      return column.name;
    });
    var sheet = ensureSheetWithHeaders_(ss, spec.name, headers);
    applyColumnRules_(ss, sheet, spec.columns);
  });

  applyAccountsFormatting_(ss);
  formatReferenceSheet_(ss);
}

function setupStageTheme_() {
  var ss = SpreadsheetApp.getActive();
  applyStandardHeaderTheme_(ss, Schema.inputs.concat(Schema.outputs).map(function (spec) {
    return spec.name;
  }));
  applyReferenceTheme_(ss);
  applyAccountsTheme_(ss);
  applyMonthlyTotalHeaderTheme_(ss);
  applyInputActivityTheme_(ss);
}

function applySchemaFormatsForSheet_(sheetName) {
  var ss = SpreadsheetApp.getActive();
  var spec = Schema.inputs.concat(Schema.outputs).find(function (item) {
    return item.name === sheetName;
  });
  if (!spec) {
    return;
  }
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return;
  }
  spec.columns.forEach(function (column, index) {
    if (!column.format) {
      return;
    }
    var colIndex = index + 1;
    var range = sheet.getRange(2, colIndex, Math.max(1, sheet.getMaxRows() - 1), 1);
    range.setNumberFormat(column.format);
  });
}

function ensureInputSheetFormatting_() {
  var ss = SpreadsheetApp.getActive();
  Schema.inputs.forEach(function (spec) {
    var headers = spec.columns.map(function (column) {
      return column.name;
    });
    var sheet = ensureSheetWithHeaders_(ss, spec.name, headers);
    applyColumnRules_(ss, sheet, spec.columns);
  });
  applyAccountsFormatting_(ss);
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

  var lastRow = sheet.getLastRow();
  var existingLastCol = sheet.getLastColumn();
  var existingHeaders = existingLastCol > 0 ? sheet.getRange(1, 1, 1, existingLastCol).getValues()[0] : [];
  var shouldRemap =
    lastRow > 1 &&
    hasAnyHeaderValue_(existingHeaders) &&
    !headersEquivalent_(existingHeaders, headers);
  var existingRows = [];
  if (shouldRemap) {
    existingRows = sheet.getRange(2, 1, lastRow - 1, existingLastCol).getValues();
  }

  var lastCol = Math.max(existingLastCol, headers.length);
  if (lastCol > 0) {
    sheet.getRange(1, 1, 1, lastCol).clearContent();
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  if (shouldRemap) {
    remapSheetDataByHeaders_(sheet, existingRows, existingHeaders, headers);
  }

  return sheet;
}

function remapSheetDataByHeaders_(sheet, rows, sourceHeaders, targetHeaders) {
  var rowCount = rows ? rows.length : 0;
  var clearColCount = Math.max(sheet.getLastColumn(), sourceHeaders.length, targetHeaders.length);
  if (rowCount > 0 && clearColCount > 0) {
    sheet.getRange(2, 1, rowCount, clearColCount).clearContent();
  }
  if (!rowCount) {
    return;
  }

  var sourceIndex = {};
  sourceHeaders.forEach(function (header, idx) {
    if (header !== '' && header !== null && sourceIndex[header] === undefined) {
      sourceIndex[header] = idx;
    }
  });

  var remapped = rows.map(function (row) {
    return targetHeaders.map(function (header) {
      var idx = sourceIndex[header];
      if (idx === undefined) {
        return '';
      }
      return row[idx];
    });
  });
  sheet.getRange(2, 1, remapped.length, targetHeaders.length).setValues(remapped);
}

function headersEquivalent_(existingHeaders, targetHeaders) {
  var maxLen = Math.max(existingHeaders.length, targetHeaders.length);
  for (var i = 0; i < maxLen; i += 1) {
    var existing = i < existingHeaders.length ? existingHeaders[i] : '';
    var target = i < targetHeaders.length ? targetHeaders[i] : '';
    if (existing !== target) {
      return false;
    }
  }
  return true;
}

function hasAnyHeaderValue_(headers) {
  return (headers || []).some(function (value) {
    return value !== '' && value !== null;
  });
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
      '07. Savings',
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

function applyAccountsFormatting_(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(Config.SHEETS.ACCOUNTS);
  if (!sheet) {
    return;
  }

  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    return;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var netFlowIndex = headers.indexOf('Net Change / Month');
  if (netFlowIndex === -1) {
    return;
  }

  var targetColumn = netFlowIndex + 1;
  var targetRange = sheet.getRange(2, targetColumn, Math.max(1, sheet.getMaxRows() - 1), 1);

  var rules = sheet.getConditionalFormatRules() || [];
  var filtered = rules.filter(function (rule) {
    var ranges = rule.getRanges();
    return !ranges.some(function (range) {
      if (range.getSheet().getName() !== sheet.getName()) {
        return false;
      }
      return range.getColumn() <= targetColumn && range.getLastColumn() >= targetColumn;
    });
  });

  var negativeRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0)
    .setBackground('#f8d7da')
    .setFontColor('#8b0000')
    .setRanges([targetRange])
    .build();

  sheet.setConditionalFormatRules(filtered.concat([negativeRule]));
}

function applyAccountsTheme_(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(Config.SHEETS.ACCOUNTS);
  if (!sheet) {
    return;
  }

  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  if (lastCol < 1) {
    return;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var coreHeaders = ['Account Name', 'Balance', 'Type', 'Include'];
  var summaryHeaders = [
    'Money In / Month',
    'Money Out / Month',
    'Net Interest / Month',
    'Net Change / Month',
  ];
  var interestHeaders = [
    'Interest Rate (APR %)',
    'Interest Fee / Month',
    'Interest Method',
    'Interest Frequency',
    'Interest Repeat Every',
    'Interest Start Date',
  ];

  colorHeaderGroup_(sheet, headers, coreHeaders, '#e8f0fe');
  colorHeaderGroup_(sheet, headers, summaryHeaders, '#e6f4ea');
  colorHeaderGroup_(sheet, headers, interestHeaders, '#fef7e0');

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, lastCol).setFontWeight('bold').setHorizontalAlignment('center');
  sheet.autoResizeColumns(1, lastCol);

  if (lastRow > 2) {
    var includeCol = getHeaderColIndex_(headers, 'Include');
    var typeCol = getHeaderColIndex_(headers, 'Type');
    var nameCol = getHeaderColIndex_(headers, 'Account Name');
    if (includeCol && typeCol && nameCol) {
      var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
      dataRange.sort([
        { column: includeCol, ascending: false },
        { column: typeCol, ascending: true },
        { column: nameCol, ascending: true },
      ]);
    }
  }
}

function colorHeaderGroup_(sheet, headers, headerNames, color) {
  headerNames.forEach(function (name) {
    var idx = headers.indexOf(name);
    if (idx === -1) {
      return;
    }
    sheet.getRange(1, idx + 1).setBackground(color);
  });
}

function getHeaderColIndex_(headers, name) {
  var index = headers.indexOf(name);
  return index === -1 ? null : index + 1;
}

function applyStandardHeaderTheme_(spreadsheet, sheetNames) {
  (sheetNames || []).forEach(function (sheetName) {
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      return;
    }
    var lastCol = sheet.getLastColumn();
    if (lastCol < 1) {
      return;
    }
    var headerRange = sheet.getRange(1, 1, 1, lastCol);
    headerRange
      .setFontWeight('bold')
      .setBackground('#f1f3f4')
      .setWrap(true)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    sheet.setFrozenRows(1);
  });
}

function applyReferenceTheme_(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(Config.LISTS_SHEET);
  if (!sheet) {
    return;
  }
  var lastCol = Math.max(4, sheet.getLastColumn());
  sheet.getRange(1, 1, 1, lastCol).setFontWeight('bold').setBackground('#f1f3f4');
  sheet.setFrozenRows(1);
}

function applyMonthlyTotalHeaderTheme_(spreadsheet) {
  [Config.SHEETS.INCOME, Config.SHEETS.TRANSFERS, Config.SHEETS.EXPENSE].forEach(function (sheetName) {
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      return;
    }
    var lastCol = sheet.getLastColumn();
    if (lastCol < 1) {
      return;
    }
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var idx = headers.indexOf('Monthly Total');
    if (idx === -1) {
      return;
    }
    sheet
      .getRange(1, idx + 1)
      .setBackground('#fff3cd')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
  });
}

function applyInputActivityTheme_(spreadsheet) {
  [Config.SHEETS.INCOME, Config.SHEETS.TRANSFERS, Config.SHEETS.EXPENSE].forEach(function (sheetName) {
    applySheetActivityRules_(spreadsheet, sheetName);
  });
}

function applySheetActivityRules_(spreadsheet, sheetName) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    return;
  }
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    return;
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var includeIdx = headers.indexOf('Include');
  var endDateIdx = headers.indexOf('End Date');
  if (includeIdx === -1) {
    return;
  }

  var rowStart = 2;
  var rowCount = Math.max(1, sheet.getMaxRows() - 1);
  var fullDataRange = sheet.getRange(rowStart, 1, rowCount, lastCol);
  var includeRange = sheet.getRange(rowStart, includeIdx + 1, rowCount, 1);
  var includeCol = columnToLetter_(includeIdx + 1);
  var endCol = endDateIdx === -1 ? null : columnToLetter_(endDateIdx + 1);
  var inactiveFormula = '=NOT($' + includeCol + rowStart + ')';
  var expiredFormula = endCol
    ? '=AND($' + endCol + rowStart + '<>\"\",$' + endCol + rowStart + '<TODAY())'
    : '';

  var rules = sheet.getConditionalFormatRules() || [];
  var filtered = rules.filter(function (rule) {
    return !isActivityThemeRule_(
      rule,
      sheetName,
      rowStart,
      rowCount,
      lastCol,
      includeIdx + 1,
      inactiveFormula,
      expiredFormula
    );
  });

  var newRules = [];
  newRules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(inactiveFormula)
      .setBackground('#f2f2f2')
      .setRanges([fullDataRange])
      .build()
  );

  if (endCol) {
    newRules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(expiredFormula)
        .setBackground('#f8d7da')
        .setFontColor('#8b0000')
        .setRanges([includeRange])
        .build()
    );
  }

  sheet.setConditionalFormatRules(filtered.concat(newRules));
}

function isActivityThemeRule_(
  rule,
  sheetName,
  rowStart,
  rowCount,
  lastCol,
  includeColIndex,
  inactiveFormula,
  expiredFormula
) {
  var ranges = rule.getRanges() || [];
  var sameSheetRanges = ranges.filter(function (range) {
    return range.getSheet().getName() === sheetName;
  });
  if (!sameSheetRanges.length) {
    return false;
  }

  var boolCondition = rule.getBooleanCondition ? rule.getBooleanCondition() : null;
  var formulaText = '';
  if (boolCondition) {
    var values = boolCondition.getCriteriaValues() || [];
    if (values.length && values[0] !== null && values[0] !== undefined) {
      formulaText = String(values[0]);
    }
  }

  var isInactiveRule = formulaText === inactiveFormula && sameSheetRanges.some(function (range) {
    return (
      range.getRow() === rowStart &&
      range.getColumn() === 1 &&
      range.getNumRows() === rowCount &&
      range.getNumColumns() === lastCol
    );
  });

  var isExpiredRule = expiredFormula && formulaText === expiredFormula && sameSheetRanges.some(function (range) {
    return (
      range.getRow() === rowStart &&
      range.getColumn() === includeColIndex &&
      range.getNumRows() === rowCount &&
      range.getNumColumns() === 1
    );
  });

  // Legacy cleanup: remove prior activity-theme rules that may reference old columns.
  var isLegacyInactiveRule = formulaText.indexOf('NOT($') !== -1 && sameSheetRanges.some(function (range) {
    return (
      range.getRow() === rowStart &&
      range.getColumn() === 1 &&
      range.getNumRows() === rowCount &&
      range.getNumColumns() === lastCol
    );
  });
  var isLegacyExpiredRule = formulaText.indexOf('TODAY()') !== -1 && sameSheetRanges.some(function (range) {
    return (
      range.getRow() === rowStart &&
      range.getColumn() === includeColIndex &&
      range.getNumRows() === rowCount &&
      range.getNumColumns() === 1
    );
  });

  return isInactiveRule || isExpiredRule || isLegacyInactiveRule || isLegacyExpiredRule;
}
