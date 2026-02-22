// Summary builders for Daily, Monthly, and Dashboard sheets.
function runSummary() {
  runSummaryForScenario(Config.SCENARIOS.DEFAULT);
}

var SUMMARY_RECON_TOLERANCE_ = 0.01;

function runSummaryForScenario(scenarioId) {
  var activeScenarioId = normalizeScenario_(scenarioId);
  startRunProgress_('Summaries (' + activeScenarioId + ')', 7);
  try {
    assertJournalRowsAvailableForScenarioSet_(activeScenarioId);
    toastStep_('Building daily summary...');
    var daily = buildDailySummary_(activeScenarioId);
    assertDailyReconcilesWithJournal_(daily, activeScenarioId);
    toastStep_('Writing daily summary...');
    writeDailySummary_(daily);

    toastStep_('Building monthly summary...');
    var monthly = buildMonthlySummary_(daily);
    assertMonthlyReconcilesWithDaily_(monthly, daily);
    toastStep_('Writing monthly summary...');
    writeMonthlySummary_(monthly);

    toastStep_('Building dashboard...');
    var dashboard = buildDashboardData_(daily, monthly, activeScenarioId);
    toastStep_('Writing dashboard...');
    writeDashboard_(dashboard);

    recordLastRunMetadata_('Summaries', activeScenarioId, 'Success');
    toastStep_('Summary complete.');
  } catch (err) {
    recordLastRunMetadata_('Summaries', activeScenarioId, 'Failed');
    throw err;
  } finally {
    endRunProgress_();
  }
}

function buildDailySummary_(scenarioId) {
  var scenarioIds = Array.isArray(scenarioId) ? scenarioId : [scenarioId];
  var scenarioLookup = {};
  scenarioIds.forEach(function (value) {
    scenarioLookup[normalizeScenario_(value)] = true;
  });
  var ss = SpreadsheetApp.getActive();
  var journal = ss.getSheetByName(Config.SHEETS.JOURNAL);
  if (!journal) {
    return { headers: [], rows: [], accountNames: [], accountTypes: {} };
  }

  var lastRow = journal.getLastRow();
  var lastCol = journal.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return { headers: [], rows: [], accountNames: [], accountTypes: {} };
  }

  var headerRow = journal.getRange(1, 1, 1, lastCol).getValues()[0];
  var scenarioIndex = headerRow.indexOf('Scenario');
  var alertsIndex = headerRow.indexOf('Alerts');
  if (alertsIndex === -1) {
    return { headers: [], rows: [], accountNames: [], accountTypes: {} };
  }

  var accountNames = headerRow.slice(alertsIndex + 1).filter(function (name) {
    return name !== '' && name !== null;
  });

  var values = journal.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var tz = ss.getSpreadsheetTimeZone();
  var dayMap = {};

  values.forEach(function (row) {
    if (scenarioIndex !== -1) {
      var rowScenarioId = normalizeScenario_(row[scenarioIndex]);
      if (!scenarioLookup[rowScenarioId]) {
        return;
      }
    }
    var date = row[0];
    if (!date) {
      return;
    }
    var day = normalizeDate_(date);
    var key = Utilities.formatDate(day, tz, 'yyyy-MM-dd');
    var balances = row.slice(alertsIndex + 1, alertsIndex + 1 + accountNames.length);
    dayMap[key] = { date: day, balances: balances };
  });

  var keys = Object.keys(dayMap).sort();
  if (!keys.length) {
    return { headers: [], rows: [], accountNames: accountNames, accountTypes: {} };
  }

  var accountRows = typeof filterByScenarioSet_ === 'function'
    ? filterByScenarioSet_(Readers.readAccounts(), scenarioIds)
    : filterByScenario_(Readers.readAccounts(), scenarioIds[0]);
  var accountTypes = buildAccountTypeMap_(accountRows);
  var rows = keys.map(function (key) {
    var entry = dayMap[key];
    var cash = 0;
    var debt = 0;
    entry.balances.forEach(function (value, idx) {
      var name = accountNames[idx];
      var amount = typeof value === 'number' ? value : 0;
      if (accountTypes[name] === Config.ACCOUNT_TYPES.CREDIT) {
        debt += amount;
      } else {
        cash += amount;
      }
    });
    cash = roundUpCents_(cash);
    debt = roundUpCents_(debt);
    var net = roundUpCents_(cash + debt);
    return [entry.date, cash, debt, net].concat(entry.balances);
  });

  var headers = ['Date', 'Total Cash', 'Total Debt', 'Net Position'].concat(accountNames);
  return { headers: headers, rows: rows, accountNames: accountNames, accountTypes: accountTypes };
}

function normalizeScenarioSet_(scenarioId) {
  var values = Array.isArray(scenarioId) ? scenarioId : [scenarioId];
  var normalized = values
    .map(function (value) { return normalizeScenario_(value); })
    .filter(function (value, idx, arr) { return value && arr.indexOf(value) === idx; });
  return normalized.length ? normalized : [Config.SCENARIOS.DEFAULT];
}

function buildJournalContextForScenarioSet_(scenarioId) {
  var scenarioSet = normalizeScenarioSet_(scenarioId);
  var lookup = {};
  scenarioSet.forEach(function (value) {
    lookup[value] = true;
  });

  var ss = SpreadsheetApp.getActive();
  var journal = ss.getSheetByName(Config.SHEETS.JOURNAL);
  if (!journal) {
    return { scenarioSet: scenarioSet, accountNames: [], rows: [] };
  }
  var lastRow = journal.getLastRow();
  var lastCol = journal.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return { scenarioSet: scenarioSet, accountNames: [], rows: [] };
  }

  var headerRow = journal.getRange(1, 1, 1, lastCol).getValues()[0];
  var scenarioIndex = headerRow.indexOf('Scenario');
  var alertsIndex = headerRow.indexOf('Alerts');
  if (alertsIndex === -1) {
    return { scenarioSet: scenarioSet, accountNames: [], rows: [] };
  }
  var accountNames = headerRow.slice(alertsIndex + 1).filter(function (name) {
    return name !== '' && name !== null;
  });

  var rows = journal.getRange(2, 1, lastRow - 1, lastCol).getValues().filter(function (row) {
    if (scenarioIndex === -1) {
      return lookup[Config.SCENARIOS.DEFAULT] === true;
    }
    return !!lookup[normalizeScenario_(row[scenarioIndex])];
  });
  return { scenarioSet: scenarioSet, accountNames: accountNames, rows: rows };
}

function assertJournalRowsAvailableForScenarioSet_(scenarioId) {
  var context = buildJournalContextForScenarioSet_(scenarioId);
  if (context.rows.length) {
    return context;
  }
  throw new Error(
    'No Journal rows found for scenario selection [' +
      context.scenarioSet.join(', ') +
      ']. Run Generate journal first.'
  );
}

function valuesWithinTolerance_(left, right, tolerance) {
  var lhs = typeof left === 'number' ? left : 0;
  var rhs = typeof right === 'number' ? right : 0;
  var limit = tolerance === undefined ? SUMMARY_RECON_TOLERANCE_ : tolerance;
  return Math.abs(lhs - rhs) <= limit;
}

function assertDailyReconcilesWithJournal_(daily, scenarioId) {
  var context = assertJournalRowsAvailableForScenarioSet_(scenarioId);
  if (!daily || !daily.rows || !daily.rows.length) {
    throw new Error('Daily summary has no rows for selected scenario set.');
  }
  if ((daily.accountNames || []).join('|') !== (context.accountNames || []).join('|')) {
    throw new Error('Daily reconciliation failed: account columns do not match Journal headers.');
  }

  var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  var dayClosings = {};
  context.rows.forEach(function (row) {
    var date = row[0];
    if (!date) {
      return;
    }
    var key = Utilities.formatDate(normalizeDate_(date), tz, 'yyyy-MM-dd');
    dayClosings[key] = row.slice(7, 7 + context.accountNames.length);
  });

  daily.rows.forEach(function (row) {
    var key = Utilities.formatDate(normalizeDate_(row[0]), tz, 'yyyy-MM-dd');
    var expected = dayClosings[key];
    if (!expected) {
      throw new Error('Daily reconciliation failed: missing Journal closing for ' + key + '.');
    }
    for (var i = 0; i < context.accountNames.length; i += 1) {
      var expectedValue = typeof expected[i] === 'number' ? expected[i] : 0;
      var actualValue = typeof row[4 + i] === 'number' ? row[4 + i] : 0;
      if (!valuesWithinTolerance_(expectedValue, actualValue)) {
        throw new Error(
          'Daily reconciliation failed at ' +
            key +
            ' for account "' +
            context.accountNames[i] +
            '".'
        );
      }
    }
  });
}

function assertMonthlyReconcilesWithDaily_(monthly, daily) {
  if (!monthly || !monthly.rows || !monthly.rows.length) {
    throw new Error('Monthly summary has no rows for selected scenario set.');
  }
  if (!daily || !daily.rows || !daily.rows.length) {
    throw new Error('Monthly reconciliation failed: Daily summary has no rows.');
  }

  var dailyByMonth = {};
  daily.rows.forEach(function (row) {
    var date = normalizeDate_(row[0]);
    var key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
    if (!dailyByMonth[key]) {
      dailyByMonth[key] = [];
    }
    dailyByMonth[key].push(row);
  });

  var monthlyByMonth = {};
  monthly.rows.forEach(function (row) {
    var monthDate = normalizeDate_(row[0]);
    var key = monthDate.getFullYear() + '-' + String(monthDate.getMonth() + 1).padStart(2, '0');
    monthlyByMonth[key] = row;
  });

  var monthKeys = Object.keys(dailyByMonth).sort();
  if (monthKeys.length !== Object.keys(monthlyByMonth).length) {
    throw new Error('Monthly reconciliation failed: month row count does not match Daily.');
  }

  monthKeys.forEach(function (key) {
    var monthRows = dailyByMonth[key];
    var monthRow = monthlyByMonth[key];
    if (!monthRow) {
      throw new Error('Monthly reconciliation failed: missing month row for ' + key + '.');
    }
    var first = monthRows[0];
    var last = monthRows[monthRows.length - 1];

    if (!valuesWithinTolerance_(monthRow[1], last[1])) {
      throw new Error('Monthly reconciliation failed: Total Cash mismatch for ' + key + '.');
    }
    if (!valuesWithinTolerance_(monthRow[2], last[2])) {
      throw new Error('Monthly reconciliation failed: Total Debt mismatch for ' + key + '.');
    }
    if (!valuesWithinTolerance_(monthRow[3], last[3])) {
      throw new Error('Monthly reconciliation failed: Net Position mismatch for ' + key + '.');
    }

    var accountCount = (daily.accountNames || []).length;
    for (var i = 0; i < accountCount; i += 1) {
      var dailyIndex = 4 + i;
      var monthlyIndex = 4 + i * 4;
      var startValue = typeof first[dailyIndex] === 'number' ? first[dailyIndex] : 0;
      var endValue = typeof last[dailyIndex] === 'number' ? last[dailyIndex] : 0;
      var minValue = startValue;
      var maxValue = startValue;

      monthRows.forEach(function (dayRow) {
        var value = typeof dayRow[dailyIndex] === 'number' ? dayRow[dailyIndex] : 0;
        if (value < minValue) {
          minValue = value;
        }
        if (value > maxValue) {
          maxValue = value;
        }
      });

      if (!valuesWithinTolerance_(monthRow[monthlyIndex], minValue)) {
        throw new Error('Monthly reconciliation failed: Min mismatch for ' + key + '.');
      }
      if (!valuesWithinTolerance_(monthRow[monthlyIndex + 1], maxValue)) {
        throw new Error('Monthly reconciliation failed: Max mismatch for ' + key + '.');
      }
      if (!valuesWithinTolerance_(monthRow[monthlyIndex + 2], endValue - startValue)) {
        throw new Error('Monthly reconciliation failed: Net Change mismatch for ' + key + '.');
      }
      if (!valuesWithinTolerance_(monthRow[monthlyIndex + 3], endValue)) {
        throw new Error('Monthly reconciliation failed: Ending mismatch for ' + key + '.');
      }
    }
  });
}

function writeDailySummary_(daily) {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(Config.SHEETS.DAILY);
  if (!sheet) {
    sheet = ss.insertSheet(Config.SHEETS.DAILY);
    if (typeof enforcePreferredSheetOrder_ === 'function') {
      enforcePreferredSheetOrder_(ss);
    }
  }
  sheet.clear();

  if (!daily.headers.length) {
    return;
  }

  sheet.getRange(1, 1, 1, daily.headers.length).setValues([daily.headers]);
  sheet.getRange(1, 1, 1, daily.headers.length).setFontWeight('bold');

  if (daily.rows.length) {
    sheet.getRange(2, 1, daily.rows.length, daily.headers.length).setValues(daily.rows);
  }

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, daily.headers.length);

  sheet.getRange(2, 1, sheet.getMaxRows() - 1, 1).setNumberFormat('yyyy-mm-dd');
  if (daily.headers.length > 1) {
    sheet
      .getRange(2, 2, sheet.getMaxRows() - 1, daily.headers.length - 1)
      .setNumberFormat('0.00');
  }

  applyDailyConditionalFormatting_(sheet, daily.accountNames, daily.accountTypes, daily.rows.length);
}

function applyDailyConditionalFormatting_(sheet, accountNames, accountTypes, rowCount) {
  if (!accountNames.length || rowCount <= 0) {
    return;
  }

  var rules = sheet.getConditionalFormatRules() || [];
  var filtered = rules.filter(function (rule) {
    return !rule.getRanges().some(function (range) {
      return range.getSheet().getName() === sheet.getName();
    });
  });

  var newRules = [];
  var startRow = 2;
  var endRow = startRow + rowCount - 1;
  var startCol = 5;

  accountNames.forEach(function (name, idx) {
    var col = startCol + idx;
    var range = sheet.getRange(startRow, col, endRow - startRow + 1, 1);
    if (accountTypes[name] === Config.ACCOUNT_TYPES.CREDIT) {
      newRules.push(
        SpreadsheetApp.newConditionalFormatRule()
          .whenNumberGreaterThanOrEqualTo(0)
          .setBackground('#d4edda')
          .setRanges([range])
          .build()
      );
    } else {
      newRules.push(
        SpreadsheetApp.newConditionalFormatRule()
          .whenNumberLessThan(0)
          .setBackground('#f8d7da')
          .setRanges([range])
          .build()
      );
    }
  });

  sheet.setConditionalFormatRules(filtered.concat(newRules));
}

function buildMonthlySummary_(daily) {
  if (!daily.rows.length) {
    return { headers: [], rows: [], accountNames: daily.accountNames || [] };
  }

  var groups = {};
  daily.rows.forEach(function (row) {
    var date = row[0];
    if (!date) {
      return;
    }
    var day = normalizeDate_(date);
    var key = day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0');
    if (!groups[key]) {
      groups[key] = { date: new Date(day.getFullYear(), day.getMonth(), 1), rows: [] };
    }
    groups[key].rows.push(row);
  });

  var keys = Object.keys(groups).sort();
  var rows = keys.map(function (key) {
    var month = groups[key];
    var monthRows = month.rows;
    var first = monthRows[0];
    var last = monthRows[monthRows.length - 1];

    var row = [
      month.date,
      roundUpCents_(last[1] || 0),
      roundUpCents_(last[2] || 0),
      roundUpCents_(last[3] || 0),
    ];

    var startIndex = 4;
    var accountCount = daily.accountNames.length;
    for (var i = 0; i < accountCount; i++) {
      var startValue = first[startIndex + i] || 0;
      var endValue = last[startIndex + i] || 0;
      var minValue = startValue;
      var maxValue = startValue;

      monthRows.forEach(function (dayRow) {
        var value = dayRow[startIndex + i] || 0;
        if (value < minValue) {
          minValue = value;
        }
        if (value > maxValue) {
          maxValue = value;
        }
      });

      row.push(roundUpCents_(minValue));
      row.push(roundUpCents_(maxValue));
      row.push(roundUpCents_(endValue - startValue));
      row.push(roundUpCents_(endValue));
    }

    return row;
  });

  var headers = ['Month', 'Total Cash', 'Total Debt', 'Net Position'];
  daily.accountNames.forEach(function () {
    headers.push('Min');
    headers.push('Max');
    headers.push('Net Change');
    headers.push('Ending');
  });

  return { headers: headers, rows: rows, accountNames: daily.accountNames };
}

function writeMonthlySummary_(monthly) {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(Config.SHEETS.MONTHLY);
  if (!sheet) {
    sheet = ss.insertSheet(Config.SHEETS.MONTHLY);
    if (typeof enforcePreferredSheetOrder_ === 'function') {
      enforcePreferredSheetOrder_(ss);
    }
  }
  sheet.clear();

  if (!monthly.headers.length) {
    return;
  }

  var colCount = monthly.headers.length;
  var headerRow1 = new Array(colCount).fill('');
  var accountStart = 5;
  monthly.accountNames.forEach(function (name, idx) {
    var startCol = accountStart + idx * 4;
    headerRow1[startCol - 1] = name;
  });

  sheet.getRange(1, 1, 1, colCount).setValues([headerRow1]);
  sheet.getRange(2, 1, 1, colCount).setValues([monthly.headers]);
  sheet.getRange(1, 1, 2, colCount).setFontWeight('bold');

  monthly.accountNames.forEach(function (_name, idx) {
    var startCol = accountStart + idx * 4;
    sheet.getRange(1, startCol, 1, 4).merge().setHorizontalAlignment('center');
  });

  if (monthly.rows.length) {
    sheet.getRange(3, 1, monthly.rows.length, colCount).setValues(monthly.rows);
  }

  sheet.setFrozenRows(2);
  sheet.autoResizeColumns(1, colCount);

  sheet.getRange(3, 1, sheet.getMaxRows() - 2, 1).setNumberFormat('mmm yyyy');
  if (colCount > 1) {
    sheet
      .getRange(3, 2, sheet.getMaxRows() - 2, colCount - 1)
      .setNumberFormat('0.00');
  }
}

function buildDashboardData_(daily, monthly, scenarioId) {
  if (!daily.rows.length) {
    return { metrics: [], accountStats: [], accountNames: daily.accountNames || [] };
  }

  var rows = daily.rows;
  var startDate = rows[0][0];
  var endDate = rows[rows.length - 1][0];

  var cashStats = computeSeriesStats_(rows, 1);
  var debtStats = computeSeriesStats_(rows, 2);
  var netStats = computeSeriesStats_(rows, 3);

  var scenarioLabel = Array.isArray(scenarioId)
    ? scenarioId.map(function (value) { return normalizeScenario_(value); }).join(', ')
    : normalizeScenario_(scenarioId);

  var metrics = [
    ['Scenario', scenarioLabel],
    ['Forecast Start', startDate],
    ['Forecast End', endDate],
    ['Ending Cash', cashStats.end],
    ['Ending Debt', debtStats.end],
    ['Ending Net Position', netStats.end],
    ['Cash Min', formatValueWithDate_(cashStats.min, cashStats.minDate)],
    ['Cash Max', formatValueWithDate_(cashStats.max, cashStats.maxDate)],
    ['Net Min', formatValueWithDate_(netStats.min, netStats.minDate)],
    ['Net Max', formatValueWithDate_(netStats.max, netStats.maxDate)],
    ['Days Cash < 0', countDaysBelow_(rows, 1, 0)],
    ['Days Net < 0', countDaysBelow_(rows, 3, 0)],
    ['Net Change', netStats.netChange],
  ];

  var accountStats = daily.accountNames.map(function (name, idx) {
    var seriesIndex = 4 + idx;
    var stats = computeSeriesStats_(rows, seriesIndex);
    return {
      name: name,
      min: stats.min,
      max: stats.max,
      end: stats.end,
      netChange: stats.netChange,
    };
  });

  return {
    metrics: metrics,
    accountStats: accountStats,
    accountNames: daily.accountNames,
  };
}

function computeSeriesStats_(rows, index) {
  var minValue = rows[0][index] || 0;
  var maxValue = rows[0][index] || 0;
  var minDate = rows[0][0];
  var maxDate = rows[0][0];
  var startValue = rows[0][index] || 0;
  var endValue = rows[rows.length - 1][index] || 0;

  rows.forEach(function (row) {
    var value = row[index] || 0;
    if (value < minValue) {
      minValue = value;
      minDate = row[0];
    }
    if (value > maxValue) {
      maxValue = value;
      maxDate = row[0];
    }
  });

  return {
    min: roundUpCents_(minValue),
    max: roundUpCents_(maxValue),
    minDate: minDate,
    maxDate: maxDate,
    start: roundUpCents_(startValue),
    end: roundUpCents_(endValue),
    netChange: roundUpCents_(endValue - startValue),
  };
}

function countDaysBelow_(rows, index, threshold) {
  return rows.reduce(function (count, row) {
    return count + ((row[index] || 0) < threshold ? 1 : 0);
  }, 0);
}

function writeDashboard_(dashboard) {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(Config.SHEETS.DASHBOARD);
  if (!sheet) {
    sheet = ss.insertSheet(Config.SHEETS.DASHBOARD);
    if (typeof enforcePreferredSheetOrder_ === 'function') {
      enforcePreferredSheetOrder_(ss);
    }
  }

  sheet.clear();
  sheet.getCharts().forEach(function (chart) {
    sheet.removeChart(chart);
  });

  sheet.getRange(1, 1).setValue('Dashboard').setFontWeight('bold').setFontSize(14);

  var dailySheet = ss.getSheetByName(Config.SHEETS.DAILY);
  if (dailySheet && dashboard.accountNames.length) {
    var lastRow = dailySheet.getLastRow();
    if (lastRow > 1) {
      var dateRange = dailySheet.getRange(1, 1, lastRow, 1);
      var cashRange = dailySheet.getRange(1, 2, lastRow, 1);
      var debtRange = dailySheet.getRange(1, 3, lastRow, 1);
      var netRange = dailySheet.getRange(1, 4, lastRow, 1);

      var cashChart = sheet
        .newChart()
        .setChartType(Charts.ChartType.LINE)
        .addRange(dateRange)
        .addRange(cashRange)
        .addRange(netRange)
        .setOption('title', 'Cash vs Net Position')
        .setOption('legend', { position: 'bottom' })
        .setOption('width', 520)
        .setOption('height', 260)
        .setPosition(3, 1, 0, 0)
        .build();
      sheet.insertChart(cashChart);

      var debtChart = sheet
        .newChart()
        .setChartType(Charts.ChartType.LINE)
        .addRange(dateRange)
        .addRange(debtRange)
        .setOption('title', 'Total Debt')
        .setOption('legend', { position: 'bottom' })
        .setOption('width', 520)
        .setOption('height', 220)
        .setPosition(20, 1, 0, 0)
        .build();
      sheet.insertChart(debtChart);
    }
  }

  var metricStartRow = 3;
  var metricStartCol = 8;
  sheet
    .getRange(metricStartRow - 1, metricStartCol, 1, 2)
    .setValues([['Financial Healthcheck', '']])
    .setFontWeight('bold');

  if (dashboard.metrics.length) {
    sheet
      .getRange(metricStartRow, metricStartCol, dashboard.metrics.length, 2)
      .setValues(dashboard.metrics);
    var metricRange = sheet.getRange(
      metricStartRow - 1,
      metricStartCol,
      dashboard.metrics.length + 1,
      2
    );
    metricRange.setBorder(true, true, true, true, true, true, '#999999', SpreadsheetApp.BorderStyle.SOLID);
    metricRange.getCell(1, 1).setBackground('#f2f2f2');
  }

  var accountStartRow = 35;
  if (dashboard.accountStats.length) {
    sheet
      .getRange(accountStartRow - 1, 1)
      .setValue('Account Positions')
      .setFontWeight('bold');

    var startCol = 1;
    var blockWidth = 2;
    var gap = 1;
    dashboard.accountStats.forEach(function (account) {
      var headerRange = sheet.getRange(accountStartRow, startCol, 1, blockWidth);
      headerRange.merge().setValue(account.name).setFontWeight('bold').setHorizontalAlignment('center');

      var rows = [
        ['Ending', account.end],
        ['Min', account.min],
        ['Max', account.max],
        ['Net Change', account.netChange],
      ];

      sheet
        .getRange(accountStartRow + 1, startCol, rows.length, blockWidth)
        .setValues(rows);

      var blockRange = sheet.getRange(accountStartRow, startCol, rows.length + 1, blockWidth);
      blockRange.setBorder(true, true, true, true, true, true, '#cccccc', SpreadsheetApp.BorderStyle.SOLID);

      startCol += blockWidth + gap;
    });
  }

  sheet.autoResizeColumns(1, Math.max(10, sheet.getLastColumn()));
}

function formatValueWithDate_(value, date) {
  if (!date) {
    return value;
  }
  var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  var dateText = Utilities.formatDate(normalizeDate_(date), tz, 'yyyy-MM-dd');
  return value + ' (' + dateText + ')';
}
