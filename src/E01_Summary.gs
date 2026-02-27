// Summary builders for Daily, Monthly, and Dashboard sheets.
function runSummary() {
  runSummaryForTag(Config.SCENARIOS.DEFAULT);
}

var SUMMARY_RECON_TOLERANCE_ = 0.01;

function runSummaryForTag(tagId) {
  var activeScenarioId = normalizeScenario_(tagId);
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
    var dashboard = buildDashboardData_(daily, activeScenarioId);
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

function buildDailySummary_(tagId) {
  var scenarioIds = Array.isArray(tagId) ? tagId : [tagId];
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
  var scenarioIndex = getTagColumnIndex_(headerRow);
  var alertsIndex = headerRow.indexOf('Alerts');
  if (alertsIndex === -1) {
    return { headers: [], rows: [], accountNames: [], accountTypes: {} };
  }

  var accountNames = headerRow.slice(alertsIndex + 1).filter(function (name) {
    return name !== '' && name !== null;
  });

  var values = journal.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var tz = ss.getSpreadsheetTimeZone();
  var includeScenarioColumn = scenarioIndex !== -1 && scenarioIds.length > 1;
  var dayMap = {};

  values.forEach(function (row) {
    var rowScenarioId = Config.SCENARIOS.DEFAULT;
    if (scenarioIndex !== -1) {
      rowScenarioId = normalizeScenario_(row[scenarioIndex]);
      if (!scenarioLookup[rowScenarioId]) {
        return;
      }
    }
    var date = row[0];
    if (!date) {
      return;
    }
    var day = normalizeDate_(date);
    var dayKey = Utilities.formatDate(day, tz, 'yyyy-MM-dd');
    var key = includeScenarioColumn ? rowScenarioId + '|' + dayKey : dayKey;
    var balances = row.slice(alertsIndex + 1, alertsIndex + 1 + accountNames.length);
    dayMap[key] = { date: day, scenarioId: rowScenarioId, balances: balances };
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
    if (includeScenarioColumn) {
      return [entry.date, entry.scenarioId, cash, debt, net].concat(entry.balances);
    }
    return [entry.date, cash, debt, net].concat(entry.balances);
  });

  var headers = includeScenarioColumn
    ? ['Date', 'Tag', 'Total Cash', 'Total Debt', 'Net Position'].concat(accountNames)
    : ['Date', 'Total Cash', 'Total Debt', 'Net Position'].concat(accountNames);
  return {
    headers: headers,
    rows: rows,
    accountNames: accountNames,
    accountTypes: accountTypes,
    includeScenarioColumn: includeScenarioColumn,
  };
}

function normalizeScenarioSet_(scenarioId) {
  var values = Array.isArray(tagId) ? tagId : [tagId];
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
    return { scenarioSet: scenarioSet, accountNames: [], rows: [], alertsIndex: -1 };
  }
  var lastRow = journal.getLastRow();
  var lastCol = journal.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return { scenarioSet: scenarioSet, accountNames: [], rows: [], alertsIndex: -1 };
  }

  var headerRow = journal.getRange(1, 1, 1, lastCol).getValues()[0];
  var scenarioIndex = getTagColumnIndex_(headerRow);
  var alertsIndex = headerRow.indexOf('Alerts');
  var amountIndex = headerRow.indexOf('Amount');
  var sourceRuleIdIndex = headerRow.indexOf('Source Rule ID');
  if (alertsIndex === -1) {
    return {
      scenarioSet: scenarioSet,
      accountNames: [],
      rows: [],
      alertsIndex: -1,
      amountIndex: amountIndex,
      sourceRuleIdIndex: sourceRuleIdIndex,
    };
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
  return {
    scenarioSet: scenarioSet,
    accountNames: accountNames,
    rows: rows,
    alertsIndex: alertsIndex,
    amountIndex: amountIndex,
    sourceRuleIdIndex: sourceRuleIdIndex,
  };
}

function assertJournalRowsAvailableForScenarioSet_(scenarioId) {
  var context = buildJournalContextForScenarioSet_(scenarioId);
  if (context.rows.length) {
    return context;
  }
  throw new Error(
    'No Journal rows found for tag selection [' +
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
    throw new Error('Daily summary has no rows for selected tag set.');
  }
  if ((daily.accountNames || []).join('|') !== (context.accountNames || []).join('|')) {
    throw new Error('Daily reconciliation failed: account columns do not match Journal headers.');
  }

  var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  var includeScenarioColumn = daily && daily.includeScenarioColumn === true;
  var dayClosings = {};
  context.rows.forEach(function (row) {
    var date = row[0];
    if (!date) {
      return;
    }
    var dayKey = Utilities.formatDate(normalizeDate_(date), tz, 'yyyy-MM-dd');
    var scenarioPart = includeScenarioColumn
      ? normalizeScenario_(row[1])
      : '';
    var key = includeScenarioColumn ? scenarioPart + '|' + dayKey : dayKey;
    var snapshotStart = context.alertsIndex + 1;
    dayClosings[key] = row.slice(snapshotStart, snapshotStart + context.accountNames.length);
  });

  daily.rows.forEach(function (row) {
    var rowDayKey = Utilities.formatDate(normalizeDate_(row[0]), tz, 'yyyy-MM-dd');
    var rowScenario = includeScenarioColumn ? normalizeScenario_(row[1]) : '';
    var key = includeScenarioColumn ? rowScenario + '|' + rowDayKey : rowDayKey;
    var expected = dayClosings[key];
    if (!expected) {
      throw new Error('Daily reconciliation failed: missing Journal closing for ' + key + '.');
    }
    var snapshotOffset = includeScenarioColumn ? 5 : 4;
    for (var i = 0; i < context.accountNames.length; i += 1) {
      var expectedValue = typeof expected[i] === 'number' ? expected[i] : 0;
      var actualValue = typeof row[snapshotOffset + i] === 'number' ? row[snapshotOffset + i] : 0;
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
    throw new Error('Monthly summary has no rows for selected tag set.');
  }
  if (!daily || !daily.rows || !daily.rows.length) {
    throw new Error('Monthly reconciliation failed: Daily summary has no rows.');
  }

  var includeScenarioColumn = daily && daily.includeScenarioColumn === true;
  var dailyScenarioIndex = includeScenarioColumn ? 1 : -1;
  var dailyCashIndex = includeScenarioColumn ? 2 : 1;
  var dailyDebtIndex = includeScenarioColumn ? 3 : 2;
  var dailyNetIndex = includeScenarioColumn ? 4 : 3;
  var dailyAccountStart = includeScenarioColumn ? 5 : 4;
  var monthlyScenarioIndex = monthly && monthly.includeScenarioColumn === true ? 1 : -1;
  var monthlyCashIndex = monthlyScenarioIndex !== -1 ? 2 : 1;
  var monthlyDebtIndex = monthlyScenarioIndex !== -1 ? 3 : 2;
  var monthlyNetIndex = monthlyScenarioIndex !== -1 ? 4 : 3;
  var monthlyAccountStart = monthlyScenarioIndex !== -1 ? 5 : 4;

  var dailyByMonth = {};
  daily.rows.forEach(function (row) {
    var date = normalizeDate_(row[0]);
    var monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
    var scenarioPart = dailyScenarioIndex === -1 ? '' : normalizeScenario_(row[dailyScenarioIndex]);
    var key = dailyScenarioIndex === -1 ? monthKey : scenarioPart + '|' + monthKey;
    if (!dailyByMonth[key]) {
      dailyByMonth[key] = [];
    }
    dailyByMonth[key].push(row);
  });

  var monthlyByMonth = {};
  monthly.rows.forEach(function (row) {
    var monthDate = normalizeDate_(row[0]);
    var monthKey = monthDate.getFullYear() + '-' + String(monthDate.getMonth() + 1).padStart(2, '0');
    var scenarioPart = monthlyScenarioIndex === -1 ? '' : normalizeScenario_(row[monthlyScenarioIndex]);
    var key = monthlyScenarioIndex === -1 ? monthKey : scenarioPart + '|' + monthKey;
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

    if (!valuesWithinTolerance_(monthRow[monthlyCashIndex], last[dailyCashIndex])) {
      throw new Error('Monthly reconciliation failed: Total Cash mismatch for ' + key + '.');
    }
    if (!valuesWithinTolerance_(monthRow[monthlyDebtIndex], last[dailyDebtIndex])) {
      throw new Error('Monthly reconciliation failed: Total Debt mismatch for ' + key + '.');
    }
    if (!valuesWithinTolerance_(monthRow[monthlyNetIndex], last[dailyNetIndex])) {
      throw new Error('Monthly reconciliation failed: Net Position mismatch for ' + key + '.');
    }

    var accountCount = (daily.accountNames || []).length;
    for (var i = 0; i < accountCount; i += 1) {
      var dailyIndex = dailyAccountStart + i;
      var monthlyIndex = monthlyAccountStart + i * 4;
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
  var numberStartCol = daily.includeScenarioColumn ? 3 : 2;
  if (daily.headers.length >= numberStartCol) {
    sheet
      .getRange(2, numberStartCol, sheet.getMaxRows() - 1, daily.headers.length - numberStartCol + 1)
      .setNumberFormat('0.00');
  }

  var accountStartCol = daily.includeScenarioColumn ? 6 : 5;
  applyDailyConditionalFormatting_(sheet, daily.accountNames, daily.accountTypes, daily.rows.length, accountStartCol);
}

function applyDailyConditionalFormatting_(sheet, accountNames, accountTypes, rowCount, accountStartCol) {
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
  var startCol = accountStartCol || 5;

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
    return {
      headers: [],
      rows: [],
      accountNames: daily.accountNames || [],
      includeScenarioColumn: daily && daily.includeScenarioColumn === true,
    };
  }

  var includeScenarioColumn = daily && daily.includeScenarioColumn === true;
  var dailyScenarioIndex = includeScenarioColumn ? 1 : -1;
  var dailyCashIndex = includeScenarioColumn ? 2 : 1;
  var dailyDebtIndex = includeScenarioColumn ? 3 : 2;
  var dailyNetIndex = includeScenarioColumn ? 4 : 3;
  var dailyAccountStart = includeScenarioColumn ? 5 : 4;

  var groups = {};
  daily.rows.forEach(function (row) {
    var date = row[0];
    if (!date) {
      return;
    }
    var day = normalizeDate_(date);
    var monthKey = day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0');
    var scenarioPart = dailyScenarioIndex === -1 ? '' : normalizeScenario_(row[dailyScenarioIndex]);
    var key = dailyScenarioIndex === -1 ? monthKey : scenarioPart + '|' + monthKey;
    if (!groups[key]) {
      groups[key] = {
        date: new Date(day.getFullYear(), day.getMonth(), 1),
        scenarioId: scenarioPart,
        rows: [],
      };
    }
    groups[key].rows.push(row);
  });

  var keys = Object.keys(groups).sort();
  var rows = keys.map(function (key) {
    var month = groups[key];
    var monthRows = month.rows;
    var first = monthRows[0];
    var last = monthRows[monthRows.length - 1];

    var row = includeScenarioColumn
      ? [
          month.date,
          month.scenarioId,
          roundUpCents_(last[dailyCashIndex] || 0),
          roundUpCents_(last[dailyDebtIndex] || 0),
          roundUpCents_(last[dailyNetIndex] || 0),
        ]
      : [
          month.date,
          roundUpCents_(last[dailyCashIndex] || 0),
          roundUpCents_(last[dailyDebtIndex] || 0),
          roundUpCents_(last[dailyNetIndex] || 0),
        ];

    var accountCount = daily.accountNames.length;
    for (var i = 0; i < accountCount; i++) {
      var startValue = first[dailyAccountStart + i] || 0;
      var endValue = last[dailyAccountStart + i] || 0;
      var minValue = startValue;
      var maxValue = startValue;

      monthRows.forEach(function (dayRow) {
        var value = dayRow[dailyAccountStart + i] || 0;
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

  var headers = includeScenarioColumn
    ? ['Month', 'Tag', 'Total Cash', 'Total Debt', 'Net Position']
    : ['Month', 'Total Cash', 'Total Debt', 'Net Position'];
  daily.accountNames.forEach(function () {
    headers.push('Min');
    headers.push('Max');
    headers.push('Net Change');
    headers.push('Ending');
  });

  return {
    headers: headers,
    rows: rows,
    accountNames: daily.accountNames,
    includeScenarioColumn: includeScenarioColumn,
  };
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
  var accountStart = monthly.includeScenarioColumn ? 6 : 5;
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
  var numberStartCol = monthly.includeScenarioColumn ? 3 : 2;
  if (colCount >= numberStartCol) {
    sheet
      .getRange(3, numberStartCol, sheet.getMaxRows() - 2, colCount - numberStartCol + 1)
      .setNumberFormat('0.00');
  }
}

function buildDashboardData_(daily, scenarioId) {
  if (!daily.rows.length) {
    return {
      metrics: [],
      comparison: [],
      explainability: [],
      accountStats: [],
      accountNames: daily.accountNames || [],
    };
  }

  var rows = daily.rows;
  var includeScenarioColumn = daily && daily.includeScenarioColumn === true;
  var cashIndex = includeScenarioColumn ? 2 : 1;
  var debtIndex = includeScenarioColumn ? 3 : 2;
  var netIndex = includeScenarioColumn ? 4 : 3;
  var accountStartIndex = includeScenarioColumn ? 5 : 4;
  var startDate = rows[0][0];
  var endDate = rows[rows.length - 1][0];

  var cashStats = computeSeriesStats_(rows, cashIndex);
  var debtStats = computeSeriesStats_(rows, debtIndex);
  var netStats = computeSeriesStats_(rows, netIndex);

  var scenarioLabel = Array.isArray(scenarioId)
    ? scenarioId.map(function (value) { return normalizeScenario_(value); }).join(', ')
    : normalizeScenario_(scenarioId);

  var metrics = [
    ['Tag', scenarioLabel],
    ['Forecast Start', startDate],
    ['Forecast End', endDate],
    ['Ending Cash', cashStats.end],
    ['Ending Debt', debtStats.end],
    ['Ending Net Position', netStats.end],
    ['Cash Min', formatValueWithDate_(cashStats.min, cashStats.minDate)],
    ['Cash Max', formatValueWithDate_(cashStats.max, cashStats.maxDate)],
    ['Net Min', formatValueWithDate_(netStats.min, netStats.minDate)],
    ['Net Max', formatValueWithDate_(netStats.max, netStats.maxDate)],
    ['Days Cash < 0', countDaysBelow_(rows, cashIndex, 0)],
    ['Days Net < 0', countDaysBelow_(rows, netIndex, 0)],
    ['Net Change', netStats.netChange],
  ];

  var accountStats = daily.accountNames.map(function (name, idx) {
    var seriesIndex = accountStartIndex + idx;
    var stats = computeSeriesStats_(rows, seriesIndex);
    return {
      name: name,
      min: stats.min,
      max: stats.max,
      end: stats.end,
      netChange: stats.netChange,
    };
  });

  var comparison = buildScenarioComparisonData_(scenarioId, daily, {
    cashStats: cashStats,
    netStats: netStats,
    daysCashNegative: countDaysBelow_(rows, cashIndex, 0),
    daysNetNegative: countDaysBelow_(rows, netIndex, 0),
  });
  var explainability = buildNegativeCashTopSources_(scenarioId);

  return {
    metrics: metrics,
    comparison: comparison,
    explainability: explainability,
    accountStats: accountStats,
    accountNames: daily.accountNames,
  };
}

function buildNegativeCashTopSources_(scenarioId) {
  var context = buildJournalContextForScenarioSet_(scenarioId);
  if (!context || !context.rows || !context.rows.length) {
    return [];
  }
  if (context.alertsIndex === -1 || context.amountIndex === -1 || context.sourceRuleIdIndex === -1) {
    return [];
  }
  return summarizeNegativeCashTopSourcesFromRows_(
    context.rows,
    context.alertsIndex,
    context.amountIndex,
    context.sourceRuleIdIndex
  );
}

function summarizeNegativeCashTopSourcesFromRows_(rows, alertsIndex, amountIndex, sourceRuleIdIndex) {
  var totals = {};
  (rows || []).forEach(function (row) {
    var alerts = String(row[alertsIndex] || '');
    if (alerts.indexOf('NEGATIVE_CASH') === -1) {
      return;
    }
    var rawAmount = toNumber_(row[amountIndex]);
    if (rawAmount === null || rawAmount >= 0) {
      return;
    }
    var key = String(row[sourceRuleIdIndex] || '').trim() || '(Unattributed)';
    var amount = Math.abs(rawAmount);
    if (!totals[key]) {
      totals[key] = { total: 0, events: 0 };
    }
    totals[key].total = roundUpCents_(totals[key].total + amount);
    totals[key].events += 1;
  });

  var keys = Object.keys(totals).sort(function (left, right) {
    var diff = totals[right].total - totals[left].total;
    if (diff !== 0) {
      return diff;
    }
    return left < right ? -1 : left > right ? 1 : 0;
  });

  return keys.slice(0, 5).map(function (key) {
    return [key, totals[key].total, totals[key].events];
  });
}

function buildScenarioComparisonData_(scenarioId, daily, current) {
  if (Array.isArray(scenarioId)) {
    return [];
  }
  var activeScenario = normalizeScenario_(scenarioId);
  if (activeScenario === Config.SCENARIOS.DEFAULT) {
    return [];
  }

  var baseDaily = buildDailySummary_(Config.SCENARIOS.DEFAULT);
  if (!baseDaily || !baseDaily.rows || !baseDaily.rows.length) {
    return [];
  }

  var baseRows = baseDaily.rows;
  var baseCashStats = computeSeriesStats_(baseRows, 1);
  var baseNetStats = computeSeriesStats_(baseRows, 3);
  var baseDaysCashNegative = countDaysBelow_(baseRows, 1, 0);
  var baseDaysNetNegative = countDaysBelow_(baseRows, 3, 0);

  return [
    ['Compared To', Config.SCENARIOS.DEFAULT],
    ['Ending Net Delta', roundUpCents_(current.netStats.end - baseNetStats.end)],
    ['Cash Min Delta', roundUpCents_(current.cashStats.min - baseCashStats.min)],
    ['Days Cash < 0 Delta', current.daysCashNegative - baseDaysCashNegative],
    ['Days Net < 0 Delta', current.daysNetNegative - baseDaysNetNegative],
  ];
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

  clearDashboardSheet_(sheet);
  sheet.getRange(1, 1).setValue('Dashboard').setFontWeight('bold').setFontSize(14);

  var reports = buildDashboardReports_(ss, dashboard);
  renderDashboardReportIndex_(sheet, reports);
  reports.forEach(function (report) {
    if (!report.enabled) {
      return;
    }
    renderDashboardReport_(sheet, report);
  });
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


