// Dashboard report registry, validation, and rendering.
function clearDashboardSheet_(sheet) {
  sheet.clear();
  sheet.getCharts().forEach(function (chart) {
    sheet.removeChart(chart);
  });
}

function getDashboardReportDefinitions_() {
  return [
    {
      id: 'trendPivot',
      title: 'Trend Pivot (Monthly Averages)',
      dashboardIndex: 10,
      size: { rows: 14, cols: 4 },
      build: {
        sourceSheet: Config.SHEETS.DAILY,
        reportType: 'pivot-table',
      },
    },
    {
      id: 'financialHealthcheck',
      title: 'Financial Healthcheck',
      dashboardIndex: 20,
      size: { rows: 16, cols: 2 },
      build: {
        sourceData: 'dashboard.metrics',
        reportType: 'pivot-table',
      },
    },
    {
      id: 'scenarioDelta',
      title: 'Scenario Delta',
      dashboardIndex: 30,
      size: { rows: 8, cols: 2 },
      build: {
        sourceData: 'dashboard.comparison',
        reportType: 'pivot-table',
      },
    },
    {
      id: 'negativeCashSources',
      title: 'Negative Cash Top Sources',
      dashboardIndex: 40,
      size: { rows: 8, cols: 3 },
      build: {
        sourceData: 'dashboard.explainability',
        reportType: 'pivot-table',
      },
    },
    {
      id: 'accountPositionsPivot',
      title: 'Account Positions Pivot',
      dashboardIndex: 50,
      size: { rows: 14, cols: 5 },
      build: {
        sourceData: 'dashboard.accountStats',
        reportType: 'pivot-table',
      },
    },
  ];
}

function getDashboardIndexLayout_() {
  return {
    startRow: 1,
    startCol: 1,
    headers: ['Index', 'Report', 'Size', 'Anchor', 'Status'],
  };
}

function getDashboardContentLayout_() {
  return {
    startRow: 5,
    startCol: 1,
    gapRows: 4,
  };
}

function buildDashboardReports_(spreadsheet, dashboard) {
  var definitions = getDashboardReportDefinitions_();
  validateDashboardReportDefinitions_(definitions);

  var dailySheet = spreadsheet.getSheetByName(Config.SHEETS.DAILY);
  var dailyPivot = buildDashboardTrendPivotData_(dailySheet, dashboard);
  var reports = buildDashboardReportsFromDefinitions_(definitions, dashboard, dailyPivot);

  assignDashboardReportAnchors_(reports);
  attachDashboardPivotSourceRanges_(spreadsheet, reports);
  validateDashboardReportLayout_(reports);
  return reports;
}

function buildDashboardReportsFromDefinitions_(definitions, dashboard, dailyPivot) {
  return (definitions || [])
    .slice()
    .sort(function (left, right) {
      return left.dashboardIndex - right.dashboardIndex;
    })
    .map(function (definition) {
      var payload = buildDashboardReportPayload_(definition, dashboard, dailyPivot);
      return {
        id: definition.id,
        title: definition.title,
        dashboardIndex: definition.dashboardIndex,
        size: definition.size,
        build: definition.build,
        enabled: payload.enabled,
        data: payload.data,
        pivotSpec: payload.pivotSpec,
      };
    });
}

function validateDashboardReportDefinitions_(definitions) {
  var seenIndexes = {};
  (definitions || []).forEach(function (definition) {
    var index = definition.dashboardIndex;
    if (seenIndexes[index]) {
      throw new Error(
        'Dashboard report definitions are invalid: duplicate dashboardIndex ' +
          index +
          ' (' +
          seenIndexes[index] +
          ', ' +
          definition.id +
          ').'
      );
    }
    seenIndexes[index] = definition.id;
    var size = definition.size || {};
    if (!(size.rows > 0) || !(size.cols > 0)) {
      throw new Error(
        'Dashboard report definitions are invalid: report "' +
          definition.id +
          '" requires positive size.rows and size.cols.'
      );
    }
  });
}

function assignDashboardReportAnchors_(reports) {
  var layout = getDashboardContentLayout_();
  var nextRow = layout.startRow;
  (reports || []).forEach(function (report) {
    report.anchorRow = nextRow;
    report.anchorCol = layout.startCol;
    nextRow += report.size.rows + layout.gapRows;
  });
}

function validateDashboardReportLayout_(reports) {
  var bounds = (reports || []).map(function (report) {
    return {
      id: report.id,
      top: report.anchorRow,
      left: report.anchorCol,
      bottom: report.anchorRow + report.size.rows - 1,
      right: report.anchorCol + report.size.cols - 1,
    };
  });

  for (var i = 0; i < bounds.length; i += 1) {
    for (var j = i + 1; j < bounds.length; j += 1) {
      if (doDashboardBoundsOverlap_(bounds[i], bounds[j])) {
        throw new Error(
          'Dashboard report layout overlap detected between "' +
            bounds[i].id +
            '" and "' +
            bounds[j].id +
            '".'
        );
      }
    }
  }
}

function doDashboardBoundsOverlap_(left, right) {
  return !(
    left.right < right.left ||
    right.right < left.left ||
    left.bottom < right.top ||
    right.bottom < left.top
  );
}

function buildDashboardReportPayload_(definition, dashboard, dailyPivot) {
  if (definition.id === 'trendPivot') {
    var trendData = dailyPivot || { headers: [], rows: [] };
    return {
      enabled: !!(trendData && trendData.rows.length),
      data: trendData,
      pivotSpec: buildDashboardPivotSpec_(definition.id, trendData.headers.length),
    };
  }
  if (definition.id === 'financialHealthcheck') {
    var metricsData = {
      headers: ['Metric', 'Value'],
      rows: dashboard.metrics || [],
    };
    return {
      enabled: !!(dashboard.metrics && dashboard.metrics.length),
      data: metricsData,
      pivotSpec: buildDashboardPivotSpec_(definition.id, metricsData.headers.length),
    };
  }
  if (definition.id === 'scenarioDelta') {
    var comparisonData = {
      headers: ['Metric', 'Value'],
      rows: dashboard.comparison || [],
    };
    return {
      enabled: !!(dashboard.comparison && dashboard.comparison.length),
      data: comparisonData,
      pivotSpec: buildDashboardPivotSpec_(definition.id, comparisonData.headers.length),
    };
  }
  if (definition.id === 'negativeCashSources') {
    var explainData = {
      headers: ['Source Rule ID', 'Abs Amount', 'Events'],
      rows: dashboard.explainability || [],
    };
    return {
      enabled: !!(dashboard.explainability && dashboard.explainability.length),
      data: explainData,
      pivotSpec: buildDashboardPivotSpec_(definition.id, explainData.headers.length),
    };
  }
  if (definition.id === 'accountPositionsPivot') {
    var accountRows = (dashboard.accountStats || []).map(function (account) {
      return [account.name, account.end, account.min, account.max, account.netChange];
    });
    var accountData = {
      headers: ['Account', 'Ending', 'Min', 'Max', 'Net Change'],
      rows: accountRows,
    };
    return {
      enabled: !!accountRows.length,
      data: accountData,
      pivotSpec: buildDashboardPivotSpec_(definition.id, accountData.headers.length),
    };
  }
  return {
    enabled: false,
    data: { headers: [], rows: [] },
    pivotSpec: { rowGroups: [1], values: [{ col: 1, summarize: SpreadsheetApp.PivotTableSummarizeFunction.COUNTA }] },
  };
}

function buildDashboardTrendPivotData_(dailySheet, dashboard) {
  if (!dailySheet || !dashboard.accountNames || !dashboard.accountNames.length) {
    return { headers: [], rows: [] };
  }
  var lastRow = dailySheet.getLastRow();
  if (lastRow <= 1) {
    return { headers: [], rows: [] };
  }

  var values = dailySheet.getRange(2, 1, lastRow - 1, 4).getValues();
  var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  var buckets = {};
  values.forEach(function (row) {
    var date = row[0];
    if (!date) {
      return;
    }
    var monthKey = Utilities.formatDate(normalizeDate_(date), tz, 'yyyy-MM');
    if (!buckets[monthKey]) {
      buckets[monthKey] = { cash: 0, debt: 0, net: 0, count: 0 };
    }
    buckets[monthKey].cash += toNumberOrZero_(row[1]);
    buckets[monthKey].debt += toNumberOrZero_(row[2]);
    buckets[monthKey].net += toNumberOrZero_(row[3]);
    buckets[monthKey].count += 1;
  });

  var rows = Object.keys(buckets)
    .sort()
    .map(function (monthKey) {
      var bucket = buckets[monthKey];
      return [
        monthKey,
        roundUpCents_(bucket.cash / bucket.count),
        roundUpCents_(bucket.debt / bucket.count),
        roundUpCents_(bucket.net / bucket.count),
      ];
    });

  return {
    headers: ['Month', 'Avg Cash', 'Avg Debt', 'Avg Net'],
    rows: rows,
  };
}

function renderDashboardReportIndex_(sheet, reports) {
  var layout = getDashboardIndexLayout_();
  var values = [layout.headers].concat(
    (reports || []).map(function (report) {
      return [
        report.dashboardIndex,
        report.title,
        report.size.rows + 'x' + report.size.cols,
        dashboardColumnToA1Letter_(report.anchorCol) + report.anchorRow,
        report.enabled ? 'Built' : 'Skipped',
      ];
    })
  );
  var range = sheet.getRange(layout.startRow, layout.startCol, values.length, layout.headers.length);
  range.setValues(values);
  range.setBorder(true, true, true, true, true, true, '#cccccc', SpreadsheetApp.BorderStyle.SOLID);
  sheet
    .getRange(layout.startRow, layout.startCol, 1, layout.headers.length)
    .setFontWeight('bold')
    .setBackground('#f2f2f2');
}

function renderDashboardReport_(sheet, report) {
  renderDashboardPivotTableBlock_(sheet, report);
}

function renderDashboardPivotTableBlock_(sheet, report) {
  var bounds = sheet.getRange(report.anchorRow, report.anchorCol, report.size.rows, report.size.cols);
  bounds.clearContent();
  bounds.setBorder(true, true, true, true, true, true, '#999999', SpreadsheetApp.BorderStyle.SOLID);

  sheet
    .getRange(report.anchorRow, report.anchorCol, 1, report.size.cols)
    .merge()
    .setValue(report.title)
    .setFontWeight('bold')
    .setBackground('#f2f2f2')
    .setHorizontalAlignment('left');

  if (!report.enabled) {
    sheet.getRange(report.anchorRow + 1, report.anchorCol).setValue('No data for this report.');
    return;
  }
  if (!report.pivotSourceRange) {
    sheet.getRange(report.anchorRow + 1, report.anchorCol).setValue('No pivot source range.');
    return;
  }
  var pivot = sheet
    .getRange(report.anchorRow + 1, report.anchorCol)
    .createPivotTable(report.pivotSourceRange);
  applyDashboardPivotSpec_(pivot, report.pivotSpec);
}

function dashboardColumnToA1Letter_(column) {
  var temp = '';
  var letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

function toNumberOrZero_(value) {
  var num = Number(value);
  return isNaN(num) ? 0 : num;
}

function buildDashboardPivotSpec_(reportId, colCount) {
  if (reportId === 'financialHealthcheck' || reportId === 'scenarioDelta') {
    return {
      rowGroups: [1, 2],
      values: [{ col: 1, summarize: SpreadsheetApp.PivotTableSummarizeFunction.COUNTA }],
    };
  }
  if (reportId === 'negativeCashSources') {
    return {
      rowGroups: [1],
      values: [
        { col: Math.min(2, colCount), summarize: SpreadsheetApp.PivotTableSummarizeFunction.SUM },
        { col: Math.min(3, colCount), summarize: SpreadsheetApp.PivotTableSummarizeFunction.SUM },
      ],
    };
  }
  if (reportId === 'trendPivot' || reportId === 'accountPositionsPivot') {
    var values = [];
    for (var c = 2; c <= colCount; c += 1) {
      values.push({ col: c, summarize: SpreadsheetApp.PivotTableSummarizeFunction.SUM });
    }
    return {
      rowGroups: [1],
      values: values.length ? values : [{ col: 1, summarize: SpreadsheetApp.PivotTableSummarizeFunction.COUNTA }],
    };
  }
  return {
    rowGroups: [1],
    values: [{ col: 1, summarize: SpreadsheetApp.PivotTableSummarizeFunction.COUNTA }],
  };
}

function attachDashboardPivotSourceRanges_(spreadsheet, reports) {
  var dataSheet = getOrCreateDashboardPivotDataSheet_(spreadsheet);
  dataSheet.clearContents();
  var nextRow = 1;
  (reports || []).forEach(function (report) {
    if (!report.enabled) {
      report.pivotSourceRange = null;
      return;
    }
    var prepared = buildDashboardPivotSourceValues_(report);
    if (!prepared.values.length) {
      report.pivotSourceRange = null;
      report.enabled = false;
      return;
    }
    var rowCount = prepared.values.length;
    var colCount = prepared.values[0].length;
    dataSheet.getRange(nextRow, 1, rowCount, colCount).setValues(prepared.values);
    report.pivotSourceRange = dataSheet.getRange(nextRow, 1, rowCount, colCount);
    nextRow += rowCount + 1;
  });
  dataSheet.hideSheet();
}

function buildDashboardPivotSourceValues_(report) {
  var width = report.size.cols;
  var headers = fitDashboardRowWidth_((report.data && report.data.headers) || [], width);
  var dataRows = ((report.data && report.data.rows) || [])
    // Pivot output can include extra rows (header/total); keep a safety buffer.
    .slice(0, Math.max(1, report.size.rows - 4))
    .map(function (row) {
      return fitDashboardRowWidth_(row, width);
    });
  var values = [headers].concat(dataRows);
  return {
    values: values,
  };
}

function fitDashboardRowWidth_(row, width) {
  var source = Array.isArray(row) ? row.slice(0, width) : [row];
  while (source.length < width) {
    source.push('');
  }
  return source;
}

function applyDashboardPivotSpec_(pivotTable, pivotSpec) {
  (pivotSpec.rowGroups || []).forEach(function (column) {
    pivotTable.addRowGroup(column);
  });
  (pivotSpec.values || []).forEach(function (valueSpec) {
    pivotTable.addPivotValue(valueSpec.col, valueSpec.summarize);
  });
}

function getOrCreateDashboardPivotDataSheet_(spreadsheet) {
  var name = '_DashboardPivotData';
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }
  return sheet;
}

function runDashboardReportHarness_() {
  var definitions = getDashboardReportDefinitions_();
  validateDashboardReportDefinitions_(definitions);

  var dashboard = {
    metrics: [['Scenario', 'Base']],
    comparison: [],
    explainability: [['EXP:RENT', 120, 2]],
    accountStats: [{ name: 'Checking', end: 100, min: 10, max: 150, netChange: 20 }],
    accountNames: ['Checking'],
  };

  var mockDailyPivot = {
    headers: ['Month', 'Avg Cash', 'Avg Debt', 'Avg Net'],
    rows: [['2026-02', 100, -50, 50]],
  };

  var reports = buildDashboardReportsFromDefinitions_(definitions, dashboard, mockDailyPivot);
  assignDashboardReportAnchors_(reports);
  validateDashboardReportLayout_(reports);

  var ordered = reports.map(function (report) {
    return report.dashboardIndex;
  });
  var isAscending = ordered.every(function (value, idx) {
    return idx === 0 || ordered[idx - 1] <= value;
  });
  if (!isAscending) {
    throw new Error('Dashboard harness failed: report ordering is not ascending by dashboardIndex.');
  }

  var enabledById = {};
  reports.forEach(function (report) {
    enabledById[report.id] = report.enabled;
  });
  if (enabledById.trendPivot !== true) {
    throw new Error('Dashboard harness failed: trendPivot should be enabled.');
  }
  if (enabledById.financialHealthcheck !== true) {
    throw new Error('Dashboard harness failed: financialHealthcheck should be enabled.');
  }
  if (enabledById.scenarioDelta !== false) {
    throw new Error('Dashboard harness failed: scenarioDelta should be skipped for empty comparison.');
  }
  if (enabledById.negativeCashSources !== true) {
    throw new Error('Dashboard harness failed: negativeCashSources should be enabled.');
  }
  if (enabledById.accountPositionsPivot !== true) {
    throw new Error('Dashboard harness failed: accountPositionsPivot should be enabled.');
  }

  return 'Dashboard report harness passed';
}
