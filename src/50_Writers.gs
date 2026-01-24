// Output writers for generated sheets.
const Writers = {
  writeJournal: function (rows, forecastAccounts) {
    var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.JOURNAL);
    if (!sheet) {
      return;
    }
    updateJournalHeaders_(sheet, forecastAccounts || []);
    clearData_(sheet);
    if (rows.length) {
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }
  },

  writeDailySummary: function (rows, forecastAccounts) {
    var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.DAILY_SUMMARY);
    if (!sheet) {
      return;
    }
    updateDailySummaryHeaders_(sheet, forecastAccounts || []);
    clearData_(sheet);
    if (rows.length) {
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }
  },

  writeOverview: function (rows, forecastAccounts) {
    var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.OVERVIEW);
    if (!sheet) {
      return;
    }
    updateOverviewHeaders_(sheet, forecastAccounts || []);
    clearData_(sheet);
    if (rows.length) {
      var range = sheet.getRange(2, 1, rows.length, rows[0].length);
      range.setValues(rows);
      formatOverview_(sheet, rows.length);
    }
  },

  writeLogs: function (rows) {
    var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.LOGS);
    if (!sheet) {
      return;
    }
    clearData_(sheet);
    if (rows.length) {
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }
  },
};

function clearData_(sheet) {
  clearSheetFilter_(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}

function clearSheetFilter_(sheet) {
  var filter = sheet.getFilter();
  if (filter) {
    filter.remove();
  }
}

function updateJournalHeaders_(sheet, forecastAccounts) {
  var journalSpec = Schema.outputs.filter(function (spec) {
    return spec.name === Config.SHEETS.JOURNAL;
  })[0];

  if (!journalSpec) {
    return;
  }

  var baseHeaders = journalSpec.columns.map(function (column) {
    return column.name;
  });
  var headers = baseHeaders.concat(forecastAccounts || []);
  if (headers.length) {
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);

    if (baseHeaders.length) {
      sheet.getRange(1, 1, 1, baseHeaders.length).setBackground('#f2f2f2');
    }
    if (forecastAccounts.length) {
      sheet
        .getRange(1, baseHeaders.length + 1, 1, forecastAccounts.length)
        .setBackground('#d9edf7');
      sheet
        .getRange(2, baseHeaders.length + 1, sheet.getMaxRows() - 1, forecastAccounts.length)
        .setNumberFormat('0.00');
      sheet
        .getRange(1, baseHeaders.length, sheet.getMaxRows(), 1)
        .setBorder(null, null, null, true, null, null, '#999999', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    }
  }
}

function updateDailySummaryHeaders_(sheet, forecastAccounts) {
  var summarySpec = Schema.outputs.filter(function (spec) {
    return spec.name === Config.SHEETS.DAILY_SUMMARY;
  })[0];

  if (!summarySpec) {
    return;
  }

  var baseHeaders = summarySpec.columns.map(function (column) {
    return column.name;
  });
  var headers = baseHeaders.concat(forecastAccounts || []);
  if (headers.length) {
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);

    if (baseHeaders.length) {
      sheet.getRange(1, 1, 1, baseHeaders.length).setBackground('#f2f2f2');
    }
    if (forecastAccounts.length) {
      sheet
        .getRange(1, baseHeaders.length + 1, 1, forecastAccounts.length)
        .setBackground('#d9edf7');
      sheet
        .getRange(2, baseHeaders.length + 1, sheet.getMaxRows() - 1, forecastAccounts.length)
        .setNumberFormat('0.00');
      sheet
        .getRange(1, baseHeaders.length, sheet.getMaxRows(), 1)
        .setBorder(null, null, null, true, null, null, '#999999', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    }
  }
}

function updateOverviewHeaders_(sheet, forecastAccounts) {
  var overviewSpec = Schema.outputs.filter(function (spec) {
    return spec.name === Config.SHEETS.OVERVIEW;
  })[0];

  if (!overviewSpec) {
    return;
  }

  var baseHeaders = overviewSpec.columns.map(function (column) {
    return column.name;
  });
  var headers = baseHeaders.concat(forecastAccounts || []);
  if (headers.length) {
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);

    if (baseHeaders.length) {
      sheet.getRange(1, 1, 1, baseHeaders.length).setBackground('#f2f2f2');
    }
    if (forecastAccounts.length) {
      sheet
        .getRange(1, baseHeaders.length + 1, 1, forecastAccounts.length)
        .setBackground('#d9edf7');
      sheet
        .getRange(1, baseHeaders.length, sheet.getMaxRows(), 1)
        .setBorder(null, null, null, true, null, null, '#999999', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    }
  }
}

function formatOverview_(sheet, rowCount) {
  var startRow = 2;
  var endRow = startRow + rowCount - 1;
  var lastCol = sheet.getLastColumn();
  var range = sheet.getRange(startRow, 1, rowCount, lastCol);

  range.setFontFamily('Arial');
  range.setFontSize(10);
  range.setVerticalAlignment('middle');
  sheet.setRowHeights(startRow, rowCount, 22);

  sheet.getRange(startRow, 1, rowCount, 1).setFontWeight('bold');
  sheet.getRange(startRow, 2, rowCount, 1).setHorizontalAlignment('right');

  var labels = sheet.getRange(startRow, 1, rowCount, 1).getValues();
  for (var i = 0; i < labels.length; i++) {
    var label = labels[i][0];
    var row = startRow + i;

    if (label === '') {
      sheet.getRange(row, 1, 1, 2).setBorder(false, false, false, false, false, false);
      sheet.setRowHeight(row, 10);
      continue;
    }

    if (label === 'By Behavior' || label === 'By Category' || label === 'Ending Balances') {
      sheet.getRange(row, 1, 1, 2).setFontWeight('bold').setFontSize(11);
      sheet.getRange(row, 1, 1, 2).setBackground('#f2f2f2');
      sheet.setRowHeight(row, 26);
      continue;
    }
  }

  sheet.getRange(startRow, 1, rowCount, lastCol).setBorder(true, true, true, true, true, true);
  sheet.autoResizeColumns(1, lastCol);
}
