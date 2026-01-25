// Export helpers.
function showExportDialog() {
  var template = HtmlService.createTemplateFromFile('ExportDialog');
  template.sheetNames = getExportableSheetNames_();
  var html = template.evaluate().setWidth(360).setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(html, 'Export data');
}

function runExportWithSelection(sheetNames) {
  var rows = exportAllSheetsToJson(sheetNames);
  return rows.length;
}

function getExportableSheetNames_() {
  return [
    Config.SHEETS.ACCOUNTS,
    Config.SHEETS.INCOME,
    Config.SHEETS.EXPENSE,
    Config.LISTS_SHEET,
    Config.SHEETS.JOURNAL,
  ];
}

function exportAllSheetsToJson(selectedSheetNames) {
  var ss = SpreadsheetApp.getActive();
  var allowed = getExportableSheetNames_();
  var sheetNames = Array.isArray(selectedSheetNames) && selectedSheetNames.length
    ? selectedSheetNames
    : allowed.slice();
  sheetNames = sheetNames.filter(function (name) {
    return allowed.indexOf(name) !== -1;
  });
  var rows = [];
  sheetNames.forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      return;
    }
    if (name === Config.SHEETS.JOURNAL) {
      rows = rows.concat(exportJournalByMonth_(sheet));
      return;
    }
    var exportData = exportSheetRows_(sheet, name);
    var compact = serializeCompact_(exportData.headers, exportData.rows);
    rows = rows.concat(buildExportRows_(name, compact));
  });

  var exportName = Config.SHEETS.EXPORT;
  var exportSheet = ss.getSheetByName(exportName);
  if (!exportSheet) {
    exportSheet = ss.insertSheet(exportName);
  }
  exportSheet.clear();
  exportSheet.getRange(1, 1, Math.max(rows.length, 1), 2).clearContent();
  exportSheet.getRange(1, 1, 1, 2).setValues([['Sheet', 'Data']]).setFontWeight('bold');
  if (rows.length) {
    exportSheet.getRange(2, 1, rows.length, 2).setValues(rows);
  }

  return rows;
}

function exportSheetRows_(sheet, sheetName) {
  var data = sheet.getDataRange().getValues();
  if (!data || data.length === 0) {
    return { headers: [], rows: [] };
  }
  var headers = data[0] || [];
  var rows = data.slice(1).filter(function (row) {
    return isMeaningfulRow_(row, headers, sheetName);
  });
  return { headers: headers, rows: rows };
}

function exportJournalByMonth_(sheet) {
  var exportRows = [];
  var data = sheet.getDataRange().getValues();
  if (!data || data.length === 0) {
    return exportRows;
  }
  var headers = data[0] || [];
  var dateIndex = headers.indexOf('Date');
  if (dateIndex === -1) {
    var fallback = serializeCompact_(headers, data.slice(1));
    exportRows.push([Config.SHEETS.JOURNAL, fallback]);
    return exportRows;
  }

  var groups = {};
  data
    .slice(1)
    .filter(function (row) {
      return isMeaningfulRow_(row, headers, Config.SHEETS.JOURNAL);
    })
    .forEach(function (row) {
    var date = row[dateIndex];
    var key = 'Unknown';
    if (date instanceof Date) {
      key = Utilities.formatDate(date, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM');
    }
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(row);
  });

  Object.keys(groups)
    .sort()
    .forEach(function (monthKey) {
      var compact = serializeCompact_(headers, groups[monthKey]);
      exportRows = exportRows.concat(buildExportRows_(Config.SHEETS.JOURNAL + ' ' + monthKey, compact));
    });

  return exportRows;
}

function isMeaningfulRow_(row, headers, sheetName) {
  var hasValue = row.some(function (cell) {
    return cell !== '' && cell !== null && cell !== false;
  });
  if (!hasValue) {
    return false;
  }
  var includeIndex = headers.indexOf('Include');
  if (includeIndex !== -1) {
    return row[includeIndex] === true;
  }
  var accountIndex = headers.indexOf('Account Name');
  if (accountIndex !== -1) {
    return row[accountIndex] !== '' && row[accountIndex] !== null;
  }
  var typeIndex = headers.indexOf('Transaction Type');
  if (typeIndex !== -1 && (row[typeIndex] === '' || row[typeIndex] === null)) {
    return false;
  }
  return true;
}

function buildExportRows_(label, json) {
  var maxLen = 45000;
  if (!json || json.length <= maxLen) {
    return [[label, json || '']];
  }
  var parts = [];
  for (var i = 0; i < json.length; i += maxLen) {
    parts.push(json.slice(i, i + maxLen));
  }
  return parts.map(function (part, idx) {
    return [label + ' (part ' + (idx + 1) + '/' + parts.length + ')', part];
  });
}

function serializeCompact_(headers, rows) {
  if (!headers || headers.length === 0) {
    return '';
  }
  var lines = [];
  lines.push(serializeRow_(headers));
  rows.forEach(function (row) {
    lines.push(serializeRow_(row));
  });
  return lines.join('\n');
}

function serializeRow_(row) {
  var values = row.map(function (cell) {
    return formatCell_(cell);
  });
  while (values.length && values[values.length - 1] === '') {
    values.pop();
  }
  return values.join('\t');
}

function formatCell_(value) {
  if (value === null || value === undefined || value === false) {
    return '';
  }
  if (value === true) {
    return '1';
  }
  if (value instanceof Date) {
    return Utilities.formatDate(value, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  }
  if (typeof value === 'number') {
    return Number(value).toString();
  }
  var text = String(value);
  if (text === '') {
    return '';
  }
  return text.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
}
