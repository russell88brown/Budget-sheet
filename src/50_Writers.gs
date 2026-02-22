// Output writers for generated sheets.
const Writers = {
  writeJournal: function (rows, forecastAccounts, accountTypes) {
    var ss = SpreadsheetApp.getActive();
    var sheet = getOrMigrateJournalSheet_(ss);
    if (!sheet) {
      return;
    }
    clearData_(sheet);
    updateJournalHeaders_(sheet, forecastAccounts || []);
    if (rows.length) {
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }
    applyJournalSort_(sheet);
    applyJournalConditionalFormatting_(sheet, forecastAccounts || [], accountTypes || {}, rows.length);
  },
};

function getOrMigrateJournalSheet_(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(Config.SHEETS.JOURNAL);
  if (sheet) {
    return sheet;
  }
  var legacy = spreadsheet.getSheetByName('Forecast Journal');
  if (legacy) {
    legacy.setName(Config.SHEETS.JOURNAL);
    if (typeof enforcePreferredSheetOrder_ === 'function') {
      enforcePreferredSheetOrder_(spreadsheet);
    }
    return legacy;
  }
  sheet = spreadsheet.insertSheet(Config.SHEETS.JOURNAL);
  if (typeof enforcePreferredSheetOrder_ === 'function') {
    enforcePreferredSheetOrder_(spreadsheet);
  }
  return sheet;
}

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
    sheet.getRange(1, 1, 1, sheet.getMaxColumns()).clearContent();
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    ensureJournalFilter_(sheet, headers.length);

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

function ensureJournalFilter_(sheet, lastCol) {
  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, 1, lastCol).createFilter();
  }
}

function applyJournalSort_(sheet) {
  var filter = sheet.getFilter();
  if (!filter) {
    return;
  }
  filter.sort(1, true);
}

function applyJournalConditionalFormatting_(sheet, forecastAccounts, accountTypes, rowCount) {
  if (!forecastAccounts.length || rowCount <= 0) {
    return;
  }
  var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var headerIndex = {};
  headerRow.forEach(function (label, idx) {
    if (label) {
      headerIndex[label] = idx + 1;
    }
  });

  var rules = sheet.getConditionalFormatRules() || [];
  var filtered = rules.filter(function (rule) {
    var ranges = rule.getRanges();
    return !ranges.some(function (range) {
      return range.getSheet().getName() === sheet.getName();
    });
  });

  var startRow = 2;
  var accountStartCol = headerIndex[forecastAccounts[0]];
  var accountCol = headerIndex.Account;
  if (!accountStartCol) {
    return;
  }
  if (!accountCol) {
    return;
  }
  var accountColLetter = columnToA1Letter_(accountCol);
  var newRules = [];
  for (var i = 0; i < forecastAccounts.length; i += 1) {
    var col = accountStartCol + i;
    var colLetter = columnToA1Letter_(col);
    var columnRange = sheet.getRange(startRow, col, rowCount, 1);

    newRules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(
          '=AND($' +
            accountColLetter +
            startRow +
            '=' +
            colLetter +
            '$1,OR(ROW()=' +
            startRow +
            ',NOT(AND(ISNUMBER(' +
            colLetter +
            startRow +
            '),ISNUMBER(' +
            colLetter +
            (startRow - 1) +
            '),OR(AND(' +
            colLetter +
            startRow +
            '<0,' +
            colLetter +
            (startRow - 1) +
            '>=0),AND(' +
            colLetter +
            startRow +
            '>=0,' +
            colLetter +
            (startRow - 1) +
            '<0))))))'
        )
        .setFontColor('#0b57d0')
        .setRanges([columnRange])
        .build()
    );
    newRules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(
          '=AND(ISNUMBER(' +
            colLetter +
            startRow +
            '),ISNUMBER(' +
            colLetter +
            (startRow - 1) +
            '),' +
            colLetter +
            startRow +
            '>=0,' +
            colLetter +
            (startRow - 1) +
            '<0)'
        )
        .setBackground('#d4edda')
        .setFontColor('#0f5132')
        .setRanges([columnRange])
        .build()
    );
    newRules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(
          '=AND(ISNUMBER(' +
            colLetter +
            startRow +
            '),ISNUMBER(' +
            colLetter +
            (startRow - 1) +
            '),' +
            colLetter +
            startRow +
            '<0,' +
            colLetter +
            (startRow - 1) +
            '>0)'
        )
        .setBackground('#f8d7da')
        .setFontColor('#8b0000')
        .setRanges([columnRange])
        .build()
    );
  }

  sheet.setConditionalFormatRules(filtered.concat(newRules));
}

function columnToA1Letter_(column) {
  var temp = '';
  var letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}
