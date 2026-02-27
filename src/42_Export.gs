// Export helpers.
function showExportDialog() {
  var template = createTemplateFromFileCompat_('31_ExportDialog');
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
    Config.SHEETS.TRANSFERS,
    Config.SHEETS.INCOME,
    Config.SHEETS.EXPENSE,
    Config.SHEETS.DAILY,
    Config.SHEETS.MONTHLY,
    Config.SHEETS.DASHBOARD,
    Config.LISTS_SHEET,
    Config.SHEETS.JOURNAL,
  ];
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
  meaningfulRows = filterJournalRowsByOptions_(meaningfulRows, headers, options);
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
          dateRange: options.mode === 'dateRange' ? { startDate: options.startDate, endDate: options.endDate } : null,
          headers: headers,
          rows: rowsToObjects_(headers, meaningfulRows),
        },
        null,
        2
      ),
    });
    return files;
  }
  files.push({
    fileName: toExportFileName_(Config.SHEETS.JOURNAL + '-' + options.startDate + '-to-' + options.endDate) + '.json',
    content: JSON.stringify(
      {
        sheet: Config.SHEETS.JOURNAL,
        exportedAt: exportedAt,
        dateRange: { startDate: options.startDate, endDate: options.endDate },
        headers: headers,
        rows: rowsToObjects_(headers, meaningfulRows),
      },
      null,
      2
    ),
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
  var defaults = { mode: 'single', entriesPerFile: 1000, startDate: '', endDate: '' };
  if (!journalOptions || typeof journalOptions !== 'object') {
    return defaults;
  }
  var mode = 'single';
  if (journalOptions.mode === 'entries') {
    mode = 'entries';
  } else if (journalOptions.mode === 'dateRange') {
    mode = 'dateRange';
  }
  var parsed = parseInt(journalOptions.entriesPerFile, 10);
  if (!isFinite(parsed) || parsed < 1) {
    parsed = defaults.entriesPerFile;
  }
  var startDate = String(journalOptions.startDate || '').trim();
  var endDate = String(journalOptions.endDate || '').trim();
  if (mode === 'dateRange') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      throw new Error('For Journal date range export, both start and end dates are required (YYYY-MM-DD).');
    }
    if (startDate > endDate) {
      throw new Error('Journal date range start date must be on or before end date.');
    }
  }
  return {
    mode: mode,
    entriesPerFile: parsed,
    startDate: startDate,
    endDate: endDate,
  };
}

function getJournalExportInfo_() {
  var info = {
    rows: 0,
    dateRangeLabel: 'No data',
    minDate: '',
    maxDate: '',
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
  info.minDate = Utilities.formatDate(dates[0], tz, 'yyyy-MM-dd');
  info.maxDate = Utilities.formatDate(dates[dates.length - 1], tz, 'yyyy-MM-dd');
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

function filterJournalRowsByOptions_(rows, headers, options) {
  if (options.mode !== 'dateRange') {
    return rows;
  }
  var dateIndex = headers.indexOf('Date');
  if (dateIndex === -1) {
    throw new Error('Journal date range export requires a Date column.');
  }
  var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  var start = Utilities.parseDate(options.startDate, tz, 'yyyy-MM-dd').getTime();
  var end = Utilities.parseDate(options.endDate, tz, 'yyyy-MM-dd').getTime();
  return rows.filter(function (row) {
    var value = row[dateIndex];
    if (!(value instanceof Date)) {
      return false;
    }
    var time = value.getTime();
    return time >= start && time <= end;
  });
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
