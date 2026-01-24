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
      var normalized = normalizeRows_(rows);
      sheet.getRange(2, 1, normalized.length, normalized[0].length).setValues(normalized);
      formatDailySummary_(sheet, normalized.length, forecastAccounts.length);
    }
  },

  writeOverview: function (rows, forecastAccounts) {
    var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.OVERVIEW);
    if (!sheet) {
      return;
    }
    clearSheetFilter_(sheet);
    sheet.clearContents();
    if (rows.length) {
      var normalized = normalizeRows_(rows);
      var range = sheet.getRange(1, 1, normalized.length, normalized[0].length);
      range.setValues(normalized);
      formatOverview_(sheet, normalized.length);
    }
  },

  writeLogs: function (rows) {
    var sheet = SpreadsheetApp.getActive().getSheetByName(Config.SHEETS.LOGS);
    if (!sheet) {
      return;
    }
    if (rows.length) {
      var sorted = rows.slice().sort(function (a, b) {
        return b[0].getTime() - a[0].getTime();
      });
      var startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, sorted.length, sorted[0].length).setValues(sorted);
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

function normalizeRows_(rows) {
  var maxLen = 0;
  rows.forEach(function (row) {
    if (row.length > maxLen) {
      maxLen = row.length;
    }
  });
  return rows.map(function (row) {
    if (row.length === maxLen) {
      return row;
    }
    var padded = row.slice();
    while (padded.length < maxLen) {
      padded.push('');
    }
    return padded;
  });
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

  var baseHeaders = ['Date', 'Total Cash', 'Total Debt', 'Net Position'];
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

function formatDailySummary_(sheet, rowCount, forecastCount) {
  var startRow = 2;
  var lastCol = 4 + forecastCount;
  var endRow = startRow + rowCount - 1;
  if (rowCount <= 0) {
    return;
  }

  var range = sheet.getRange(startRow, 1, rowCount, lastCol);
  range.setFontFamily('Arial').setFontSize(10).setVerticalAlignment('middle');

  var values = sheet.getRange(startRow, 1, rowCount, 2).getDisplayValues();
  var currentMonth = '';
  var startBlock = startRow;

  for (var i = 0; i < values.length; i++) {
    var row = startRow + i;
    var dateText = values[i][0];
    var label = values[i][1];
    var isHeader = dateText && !label;
    var isSummary = label === 'Month Summary';
    var month = isHeader ? dateText : (dateText ? dateText.slice(0, 7) : '');

    if (isHeader) {
      if (currentMonth) {
        sheet
          .getRange(startBlock, 1, row - startBlock, lastCol)
          .setBorder(true, true, true, true, true, true, '#333333', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
      }
      currentMonth = month;
      startBlock = row;
      var headerRange = sheet.getRange(row, 1, 1, lastCol);
      headerRange.mergeAcross();
      headerRange.setHorizontalAlignment('center').setVerticalAlignment('top');
      headerRange.setFontWeight('bold').setBackground('#e9eef7');
      headerRange.setBorder(true, true, true, true, true, true, '#333333', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    }

    if (isSummary) {
      sheet.getRange(row, 1, 1, lastCol).setFontWeight('bold');
      sheet
        .getRange(row, 1, 1, lastCol)
        .setBorder(true, true, true, true, true, true, '#333333', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    }
  }

  if (startBlock <= endRow) {
    sheet
      .getRange(startBlock, 1, endRow - startBlock + 1, lastCol)
      .setBorder(true, true, true, true, true, true, '#333333', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  }
}

// Overview uses a freeform dashboard layout (no fixed headers).

function formatOverview_(sheet, rowCount) {
  var startRow = 1;
  var endRow = startRow + rowCount - 1;
  var lastCol = sheet.getLastColumn();
  var range = sheet.getRange(startRow, 1, rowCount, lastCol);

  range.setFontFamily('Arial');
  range.setFontSize(10);
  range.setVerticalAlignment('middle');
  sheet.setRowHeights(startRow, rowCount, 22);

  sheet.getRange(startRow, 1, rowCount, 1).setFontWeight('bold');
  sheet.getRange(startRow, 2, rowCount, 1).setHorizontalAlignment('right');

  var labels = sheet.getRange(startRow, 1, rowCount, 1).getDisplayValues();
  for (var i = 0; i < labels.length; i++) {
    var label = labels[i][0];
    var row = startRow + i;
    if (label && label.indexOf('## ') === 0) {
      sheet.getRange(row, 1, 1, lastCol).mergeAcross();
      sheet.getRange(row, 1, 1, lastCol).setFontWeight('bold').setFontSize(12);
      sheet.getRange(row, 1, 1, lastCol).setBackground('#e9eef7');
      sheet.setRowHeight(row, 28);
    }
  }

  // Box sections between headers and blank rows
  var inSection = false;
  var sectionStart = startRow;
  for (var r = startRow; r <= endRow; r++) {
    var text = sheet.getRange(r, 1).getDisplayValue();
    if (text && text.indexOf('## ') === 0) {
      if (inSection) {
        sheet.getRange(sectionStart, 1, r - sectionStart, lastCol).setBorder(true, true, true, true, true, true);
      }
      inSection = true;
      sectionStart = r;
      continue;
    }
    if (text === '' && inSection) {
      sheet.getRange(sectionStart, 1, r - sectionStart, lastCol).setBorder(true, true, true, true, true, true);
      inSection = false;
    }
  }
  if (inSection) {
    sheet.getRange(sectionStart, 1, endRow - sectionStart + 1, lastCol).setBorder(true, true, true, true, true, true);
  }

  sheet.autoResizeColumns(1, lastCol);
}
