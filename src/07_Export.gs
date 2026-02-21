// Export helpers.
function showExportDialog() {
  var template = HtmlService.createTemplateFromFile('ExportDialog');
  template.sheetNames = getExportableSheetNames_();
  template.journalInfo = getJournalExportInfo_();
  template.journalSheetName = Config.SHEETS.JOURNAL;
  var html = template.evaluate().setWidth(360).setHeight(470);
  SpreadsheetApp.getUi().showModalDialog(html, 'Export data');
}

function runExportWithSelection(selectionOrOptions) {
  return buildExportZipPayload_(selectionOrOptions);
}

function getExportableSheetNames_() {
  return [
    Config.SHEETS.ACCOUNTS,
    Config.SHEETS.POLICIES,
    Config.SHEETS.GOALS,
    Config.SHEETS.RISK,
    Config.SHEETS.TRANSFERS,
    Config.SHEETS.INCOME,
    Config.SHEETS.EXPENSE,
    Config.LISTS_SHEET,
    Config.SHEETS.JOURNAL,
  ];
}

function exportAllSheetsToJson(selectedSheetNames) {
  var request = normalizeExportRequest_(selectedSheetNames);
  var ss = SpreadsheetApp.getActive();
  var allowed = getExportableSheetNames_();
  var sheetNames = request.sheetNames.length
    ? request.sheetNames
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
      rows = rows.concat(exportJournalRows_(sheet, request.journal));
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

function buildExportZipPayload_(selectedSheetNames) {
  var files = buildExportJsonFiles_(selectedSheetNames);
  if (!files.length) {
    throw new Error('No exportable data found for the selected sheets.');
  }

  var blobs = files.map(function (file) {
    return Utilities.newBlob(file.content, 'application/json', file.fileName);
  });
  var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  var stamp = Utilities.formatDate(new Date(), tz, 'yyyyMMdd-HHmmss');
  var zipName = 'budget-export-' + stamp + '.zip';
  var zipBlob = Utilities.zip(blobs, zipName);

  return {
    fileName: zipName,
    mimeType: 'application/zip',
    base64: Utilities.base64Encode(zipBlob.getBytes()),
    fileCount: files.length,
  };
}

function buildExportJsonFiles_(selectedSheetNames) {
  var request = normalizeExportRequest_(selectedSheetNames);
  var ss = SpreadsheetApp.getActive();
  var allowed = getExportableSheetNames_();
  var sheetNames = request.sheetNames.length
    ? request.sheetNames
    : allowed.slice();
  sheetNames = sheetNames.filter(function (name) {
    return allowed.indexOf(name) !== -1;
  });

  var files = [];
  var exportedAt = new Date().toISOString();
  sheetNames.forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      return;
    }
    if (name === Config.SHEETS.JOURNAL) {
      files = files.concat(buildJournalJsonFiles_(sheet, exportedAt, request.journal));
      return;
    }

    var exportData = exportSheetRows_(sheet, name);
    var payload = {
      sheet: name,
      exportedAt: exportedAt,
      headers: exportData.headers,
      rows: rowsToObjects_(exportData.headers, exportData.rows),
    };
    files.push({
      fileName: toExportFileName_(name) + '.json',
      content: JSON.stringify(payload, null, 2),
    });
  });

  return files;
}

function buildJournalJsonFiles_(sheet, exportedAt, journalOptions) {
  var files = [];
  var data = sheet.getDataRange().getValues();
  if (!data || data.length === 0) {
    return files;
  }
  var headers = data[0] || [];
  var options = normalizeJournalOptions_(journalOptions);
  var meaningfulRows = data.slice(1).filter(function (row) {
    return isMeaningfulRow_(row, headers, Config.SHEETS.JOURNAL);
  });
  if (!meaningfulRows.length) {
    return files;
  }
  if (options.mode === 'entries') {
    var chunkIndex = 0;
    for (var i = 0; i < meaningfulRows.length; i += options.entriesPerFile) {
      var chunkRows = meaningfulRows.slice(i, i + options.entriesPerFile);
      chunkIndex += 1;
      files.push({
        fileName: toExportFileName_(Config.SHEETS.JOURNAL + '-part-' + chunkIndex) + '.json',
        content: JSON.stringify(
          {
            sheet: Config.SHEETS.JOURNAL,
            exportedAt: exportedAt,
            splitMode: 'entries',
            entriesPerFile: options.entriesPerFile,
            part: chunkIndex,
            headers: headers,
            rows: rowsToObjects_(headers, chunkRows),
          },
          null,
          2
        ),
      });
    }
    return files;
  }
  if (options.mode === 'single') {
    files.push({
      fileName: toExportFileName_(Config.SHEETS.JOURNAL) + '.json',
      content: JSON.stringify(
        {
          sheet: Config.SHEETS.JOURNAL,
          exportedAt: exportedAt,
          headers: headers,
          rows: rowsToObjects_(headers, meaningfulRows),
        },
        null,
        2
      ),
    });
    return files;
  }

  var dateIndex = headers.indexOf('Date');
  var scenarioIndex = headers.indexOf('Scenario');
  if (dateIndex === -1) {
    files.push({
      fileName: toExportFileName_(Config.SHEETS.JOURNAL) + '.json',
      content: JSON.stringify(
        {
          sheet: Config.SHEETS.JOURNAL,
          exportedAt: exportedAt,
          headers: headers,
          rows: rowsToObjects_(headers, meaningfulRows),
        },
        null,
        2
      ),
    });
    return files;
  }

  var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  var groups = {};
  meaningfulRows.forEach(function (row) {
    var date = row[dateIndex];
    var scenarioKey = getJournalScenarioKey_(row, scenarioIndex);
    var key = scenarioKey + '-unknown';
    if (date instanceof Date) {
      key = scenarioKey + '-' + Utilities.formatDate(date, tz, 'yyyy-MM');
    }
    if (!groups[key]) {
      groups[key] = { scenario: scenarioKey, rows: [] };
    }
    groups[key].rows.push(row);
  });

  Object.keys(groups)
    .sort()
    .forEach(function (groupKey) {
      var group = groups[groupKey];
      var monthKey = groupKey.slice(group.scenario.length + 1);
      var payload = {
        sheet: Config.SHEETS.JOURNAL,
        scenario: group.scenario,
        month: monthKey,
        exportedAt: exportedAt,
        headers: headers,
        rows: rowsToObjects_(headers, group.rows),
      };
      files.push({
        fileName: toExportFileName_(Config.SHEETS.JOURNAL + '-' + group.scenario + '-' + monthKey) + '.json',
        content: JSON.stringify(payload, null, 2),
      });
    });

  return files;
}

function normalizeExportRequest_(selectionOrOptions) {
  if (Array.isArray(selectionOrOptions)) {
    return {
      sheetNames: selectionOrOptions,
      journal: normalizeJournalOptions_(null),
    };
  }
  var options = selectionOrOptions && typeof selectionOrOptions === 'object' ? selectionOrOptions : {};
  var sheetNames = Array.isArray(options.sheetNames) ? options.sheetNames : [];
  return {
    sheetNames: sheetNames,
    journal: normalizeJournalOptions_(options.journal),
  };
}

function normalizeJournalOptions_(journalOptions) {
  var defaults = { mode: 'single', entriesPerFile: 1000 };
  if (!journalOptions || typeof journalOptions !== 'object') {
    return defaults;
  }
  var mode = journalOptions.mode === 'entries' ? 'entries' : 'single';
  var parsed = parseInt(journalOptions.entriesPerFile, 10);
  if (!isFinite(parsed) || parsed < 1) {
    parsed = defaults.entriesPerFile;
  }
  return {
    mode: mode,
    entriesPerFile: parsed,
  };
}

function getJournalExportInfo_() {
  var info = {
    rows: 0,
    dateRangeLabel: 'No data',
  };
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(Config.SHEETS.JOURNAL);
  if (!sheet) {
    return info;
  }
  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) {
    return info;
  }
  var headers = data[0] || [];
  var rows = data.slice(1).filter(function (row) {
    return isMeaningfulRow_(row, headers, Config.SHEETS.JOURNAL);
  });
  info.rows = rows.length;
  if (!rows.length) {
    return info;
  }
  var dateIndex = headers.indexOf('Date');
  if (dateIndex === -1) {
    info.dateRangeLabel = 'Date column not found';
    return info;
  }
  var dates = rows
    .map(function (row) {
      return row[dateIndex];
    })
    .filter(function (value) {
      return value instanceof Date;
    });
  if (!dates.length) {
    info.dateRangeLabel = 'No valid dates';
    return info;
  }
  dates.sort(function (a, b) {
    return a.getTime() - b.getTime();
  });
  var tz = ss.getSpreadsheetTimeZone();
  info.dateRangeLabel =
    Utilities.formatDate(dates[0], tz, 'yyyy-MM-dd') + ' to ' + Utilities.formatDate(dates[dates.length - 1], tz, 'yyyy-MM-dd');
  return info;
}

function rowsToObjects_(headers, rows) {
  if (!headers || !headers.length || !rows || !rows.length) {
    return [];
  }
  var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  return rows.map(function (row) {
    var obj = {};
    headers.forEach(function (header, idx) {
      if (!header) {
        return;
      }
      var value = row[idx];
      if (value instanceof Date) {
        obj[header] = Utilities.formatDate(value, tz, 'yyyy-MM-dd');
        return;
      }
      obj[header] = value;
    });
    return obj;
  });
}

function toExportFileName_(name) {
  return String(name || 'sheet')
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'sheet';
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

function exportJournalRows_(sheet, journalOptions) {
  var data = sheet.getDataRange().getValues();
  if (!data || data.length === 0) {
    return [];
  }
  var headers = data[0] || [];
  var options = normalizeJournalOptions_(journalOptions);
  var meaningfulRows = data.slice(1).filter(function (row) {
    return isMeaningfulRow_(row, headers, Config.SHEETS.JOURNAL);
  });
  if (!meaningfulRows.length) {
    return [];
  }
  if (options.mode === 'entries') {
    var rows = [];
    var part = 0;
    for (var i = 0; i < meaningfulRows.length; i += options.entriesPerFile) {
      part += 1;
      var chunk = meaningfulRows.slice(i, i + options.entriesPerFile);
      rows = rows.concat(
        buildExportRows_(
          Config.SHEETS.JOURNAL + ' (part ' + part + ', ' + options.entriesPerFile + ' entries)',
          serializeCompact_(headers, chunk)
        )
      );
    }
    return rows;
  }
  return buildExportRows_(Config.SHEETS.JOURNAL, serializeCompact_(headers, meaningfulRows));
}

function exportJournalByMonth_(sheet) {
  var exportRows = [];
  var data = sheet.getDataRange().getValues();
  if (!data || data.length === 0) {
    return exportRows;
  }
  var headers = data[0] || [];
  var dateIndex = headers.indexOf('Date');
  var scenarioIndex = headers.indexOf('Scenario');
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
      var scenarioKey = getJournalScenarioKey_(row, scenarioIndex);
      var key = scenarioKey + '-Unknown';
      if (date instanceof Date) {
        key = scenarioKey + '-' + Utilities.formatDate(date, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM');
      }
      if (!groups[key]) {
        groups[key] = { scenario: scenarioKey, rows: [] };
      }
      groups[key].rows.push(row);
    });

  Object.keys(groups)
    .sort()
    .forEach(function (groupKey) {
      var group = groups[groupKey];
      var monthKey = groupKey.slice(group.scenario.length + 1);
      var compact = serializeCompact_(headers, group.rows);
      exportRows = exportRows.concat(
        buildExportRows_(Config.SHEETS.JOURNAL + ' ' + group.scenario + ' ' + monthKey, compact)
      );
    });

  return exportRows;
}

function getJournalScenarioKey_(row, scenarioIndex) {
  if (scenarioIndex === -1) {
    return Config.SCENARIOS.DEFAULT;
  }
  return normalizeScenario_(row[scenarioIndex]);
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
