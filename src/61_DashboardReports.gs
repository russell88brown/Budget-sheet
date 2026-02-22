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
      id: 'trendCharts',
      title: 'Trend Charts',
      dashboardIndex: 10,
      anchorRow: 3,
      anchorCol: 1,
      build: {
        sourceSheet: Config.SHEETS.DAILY,
        reportType: 'chart-group',
        chartTitles: ['Cash vs Net Position', 'Total Debt'],
      },
    },
    {
      id: 'financialHealthcheck',
      title: 'Financial Healthcheck',
      dashboardIndex: 20,
      anchorRow: 3,
      anchorCol: 8,
      build: {
        sourceData: 'dashboard.metrics',
        reportType: '2-column table',
      },
    },
    {
      id: 'scenarioDelta',
      title: 'Scenario Delta',
      dashboardIndex: 30,
      anchorRow: 3,
      anchorCol: 11,
      build: {
        sourceData: 'dashboard.comparison',
        reportType: '2-column table',
      },
    },
    {
      id: 'negativeCashSources',
      title: 'Negative Cash Top Sources',
      dashboardIndex: 40,
      anchorRow: 3,
      anchorCol: 14,
      build: {
        sourceData: 'dashboard.explainability',
        reportType: '3-column table',
        columns: ['Source Rule ID', 'Abs Amount', 'Events'],
      },
    },
    {
      id: 'accountPositions',
      title: 'Account Positions',
      dashboardIndex: 50,
      anchorRow: 35,
      anchorCol: 1,
      build: {
        sourceData: 'dashboard.accountStats',
        reportType: 'account stat blocks',
      },
    },
  ];
}

function getDashboardIndexLayout_() {
  return {
    startRow: 1,
    startCol: 20,
    headers: ['Index', 'Report', 'Anchor', 'Status'],
  };
}

function buildDashboardReports_(spreadsheet, dashboard) {
  var definitions = getDashboardReportDefinitions_();
  validateDashboardReportDefinitions_(definitions);

  var dailySheet = spreadsheet.getSheetByName(Config.SHEETS.DAILY);
  var dailyContext = buildDashboardTrendChartData_(dailySheet, dashboard);
  var reports = buildDashboardReportsFromDefinitions_(definitions, dashboard, dailyContext);

  validateDashboardReportLayout_(reports);
  return reports;
}

function buildDashboardReportsFromDefinitions_(definitions, dashboard, dailyContext) {
  return (definitions || [])
    .slice()
    .sort(function (left, right) {
      return left.dashboardIndex - right.dashboardIndex;
    })
    .map(function (definition) {
      var payload = buildDashboardReportPayload_(definition, dashboard, dailyContext);
      return {
        id: definition.id,
        title: definition.title,
        dashboardIndex: definition.dashboardIndex,
        anchorRow: definition.anchorRow,
        anchorCol: definition.anchorCol,
        build: definition.build,
        enabled: payload.enabled,
        data: payload.data,
      };
    });
}

function validateDashboardReportDefinitions_(definitions) {
  var seen = {};
  (definitions || []).forEach(function (definition) {
    var index = definition.dashboardIndex;
    if (seen[index]) {
      throw new Error(
        'Dashboard report definitions are invalid: duplicate dashboardIndex ' +
          index +
          ' (' +
          seen[index] +
          ', ' +
          definition.id +
          ').'
      );
    }
    seen[index] = definition.id;
  });
}

function validateDashboardReportLayout_(reports) {
  var enabledReports = (reports || []).filter(function (report) {
    return report.enabled;
  });
  for (var i = 0; i < enabledReports.length; i += 1) {
    var left = enabledReports[i];
    var leftBounds = getDashboardReportBounds_(left);
    for (var j = i + 1; j < enabledReports.length; j += 1) {
      var right = enabledReports[j];
      var rightBounds = getDashboardReportBounds_(right);
      if (doDashboardBoundsOverlap_(leftBounds, rightBounds)) {
        throw new Error(
          'Dashboard report layout overlap detected between "' +
            left.id +
            '" and "' +
            right.id +
            '".'
        );
      }
    }
  }

  var indexBounds = getDashboardReportIndexBounds_(reports);
  enabledReports.forEach(function (report) {
    var reportBounds = getDashboardReportBounds_(report);
    if (doDashboardBoundsOverlap_(indexBounds, reportBounds)) {
      throw new Error(
        'Dashboard report index overlaps report "' +
          report.id +
          '". Move the index or report anchors.'
      );
    }
  });
}

function getDashboardReportBounds_(report) {
  if (report.id === 'trendCharts') {
    // Two charts are anchored at row N and N+17 with fixed pixel heights.
    // Keep a conservative but realistic row span to avoid false overlap errors.
    return {
      top: report.anchorRow,
      left: report.anchorCol,
      bottom: report.anchorRow + 30,
      right: report.anchorCol + 6,
    };
  }
  if (report.id === 'financialHealthcheck' || report.id === 'scenarioDelta') {
    var tableRows = (report.data || []).length;
    return {
      top: report.anchorRow - 1,
      left: report.anchorCol,
      bottom: report.anchorRow + tableRows - 1,
      right: report.anchorCol + 1,
    };
  }
  if (report.id === 'negativeCashSources') {
    var explainRows = (report.data || []).length;
    return {
      top: report.anchorRow - 1,
      left: report.anchorCol,
      bottom: report.anchorRow + explainRows,
      right: report.anchorCol + 2,
    };
  }
  if (report.id === 'accountPositions') {
    var accountCount = (report.data || []).length;
    var totalWidth = accountCount * 2 + Math.max(0, accountCount - 1);
    return {
      top: report.anchorRow - 1,
      left: report.anchorCol,
      bottom: report.anchorRow + 4,
      right: report.anchorCol + Math.max(1, totalWidth) - 1,
    };
  }
  return {
    top: report.anchorRow,
    left: report.anchorCol,
    bottom: report.anchorRow,
    right: report.anchorCol,
  };
}

function getDashboardReportIndexBounds_(reports) {
  var layout = getDashboardIndexLayout_();
  var rowCount = (reports || []).length + 1;
  var colCount = layout.headers.length;
  return {
    top: layout.startRow,
    left: layout.startCol,
    bottom: layout.startRow + rowCount - 1,
    right: layout.startCol + colCount - 1,
  };
}

function doDashboardBoundsOverlap_(left, right) {
  return !(
    left.right < right.left ||
    right.right < left.left ||
    left.bottom < right.top ||
    right.bottom < left.top
  );
}

function buildDashboardReportPayload_(definition, dashboard, dailyContext) {
  if (definition.id === 'trendCharts') {
    return {
      enabled: dailyContext !== null,
      data: dailyContext,
    };
  }
  if (definition.id === 'financialHealthcheck') {
    return {
      enabled: !!(dashboard.metrics && dashboard.metrics.length),
      data: dashboard.metrics || [],
    };
  }
  if (definition.id === 'scenarioDelta') {
    return {
      enabled: !!(dashboard.comparison && dashboard.comparison.length),
      data: dashboard.comparison || [],
    };
  }
  if (definition.id === 'negativeCashSources') {
    return {
      enabled: !!(dashboard.explainability && dashboard.explainability.length),
      data: dashboard.explainability || [],
    };
  }
  if (definition.id === 'accountPositions') {
    return {
      enabled: !!(dashboard.accountStats && dashboard.accountStats.length),
      data: dashboard.accountStats || [],
    };
  }
  return { enabled: false, data: null };
}

function buildDashboardTrendChartData_(dailySheet, dashboard) {
  if (!dailySheet || !dashboard.accountNames || !dashboard.accountNames.length) {
    return null;
  }
  var lastRow = dailySheet.getLastRow();
  if (lastRow <= 1) {
    return null;
  }
  return {
    dateRange: dailySheet.getRange(1, 1, lastRow, 1),
    cashRange: dailySheet.getRange(1, 2, lastRow, 1),
    debtRange: dailySheet.getRange(1, 3, lastRow, 1),
    netRange: dailySheet.getRange(1, 4, lastRow, 1),
  };
}

function renderDashboardReportIndex_(sheet, reports) {
  var layout = getDashboardIndexLayout_();
  var headers = layout.headers;
  var rows = reports.map(function (report) {
    return [
      report.dashboardIndex,
      report.title,
      dashboardColumnToA1Letter_(report.anchorCol) + report.anchorRow,
      report.enabled ? 'Built' : 'Skipped',
    ];
  });
  var values = [headers].concat(rows);
  var range = sheet.getRange(layout.startRow, layout.startCol, values.length, headers.length);
  range.setValues(values);
  range.setBorder(true, true, true, true, true, true, '#cccccc', SpreadsheetApp.BorderStyle.SOLID);
  sheet
    .getRange(layout.startRow, layout.startCol, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#f2f2f2');
  sheet.getRange(layout.startRow, layout.startCol + 1, values.length, 1).setWrap(true);
}

function renderDashboardReport_(sheet, report) {
  if (report.id === 'trendCharts') {
    renderDashboardTrendCharts_(sheet, report);
    return;
  }
  if (report.id === 'financialHealthcheck' || report.id === 'scenarioDelta') {
    renderDashboardTwoColumnTable_(sheet, report, report.title);
    return;
  }
  if (report.id === 'negativeCashSources') {
    renderDashboardExplainabilityTable_(sheet, report);
    return;
  }
  if (report.id === 'accountPositions') {
    renderDashboardAccountPositions_(sheet, report);
  }
}

function renderDashboardTrendCharts_(sheet, report) {
  var chartData = report.data;
  if (!chartData) {
    return;
  }
  var cashChart = sheet
    .newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(chartData.dateRange)
    .addRange(chartData.cashRange)
    .addRange(chartData.netRange)
    .setOption('title', 'Cash vs Net Position')
    .setOption('legend', { position: 'bottom' })
    .setOption('width', 520)
    .setOption('height', 260)
    .setPosition(report.anchorRow, report.anchorCol, 0, 0)
    .build();
  sheet.insertChart(cashChart);

  var debtChart = sheet
    .newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(chartData.dateRange)
    .addRange(chartData.debtRange)
    .setOption('title', 'Total Debt')
    .setOption('legend', { position: 'bottom' })
    .setOption('width', 520)
    .setOption('height', 220)
    .setPosition(report.anchorRow + 17, report.anchorCol, 0, 0)
    .build();
  sheet.insertChart(debtChart);
}

function renderDashboardTwoColumnTable_(sheet, report, title) {
  var rows = report.data || [];
  if (!rows.length) {
    return;
  }
  var startRow = report.anchorRow;
  var startCol = report.anchorCol;
  sheet
    .getRange(startRow - 1, startCol, 1, 2)
    .setValues([[title, '']])
    .setFontWeight('bold');
  sheet.getRange(startRow, startCol, rows.length, 2).setValues(rows);
  var blockRange = sheet.getRange(startRow - 1, startCol, rows.length + 1, 2);
  blockRange.setBorder(true, true, true, true, true, true, '#999999', SpreadsheetApp.BorderStyle.SOLID);
  blockRange.getCell(1, 1).setBackground('#f2f2f2');
}

function renderDashboardExplainabilityTable_(sheet, report) {
  var rows = report.data || [];
  if (!rows.length) {
    return;
  }
  var startRow = report.anchorRow;
  var startCol = report.anchorCol;
  sheet
    .getRange(startRow - 1, startCol, 1, 3)
    .setValues([[report.title, '', '']])
    .setFontWeight('bold');
  sheet
    .getRange(startRow, startCol, 1, 3)
    .setValues([['Source Rule ID', 'Abs Amount', 'Events']])
    .setFontWeight('bold');
  sheet.getRange(startRow + 1, startCol, rows.length, 3).setValues(rows);
  var blockRange = sheet.getRange(startRow - 1, startCol, rows.length + 2, 3);
  blockRange.setBorder(true, true, true, true, true, true, '#999999', SpreadsheetApp.BorderStyle.SOLID);
  blockRange.getCell(1, 1).setBackground('#f2f2f2');
}

function renderDashboardAccountPositions_(sheet, report) {
  var accounts = report.data || [];
  if (!accounts.length) {
    return;
  }
  var accountStartRow = report.anchorRow;
  var startCol = report.anchorCol;
  var blockWidth = 2;
  var gap = 1;

  sheet.getRange(accountStartRow - 1, startCol).setValue(report.title).setFontWeight('bold');
  accounts.forEach(function (account) {
    var headerRange = sheet.getRange(accountStartRow, startCol, 1, blockWidth);
    headerRange.merge().setValue(account.name).setFontWeight('bold').setHorizontalAlignment('center');
    var rows = [
      ['Ending', account.end],
      ['Min', account.min],
      ['Max', account.max],
      ['Net Change', account.netChange],
    ];
    sheet.getRange(accountStartRow + 1, startCol, rows.length, blockWidth).setValues(rows);
    var blockRange = sheet.getRange(accountStartRow, startCol, rows.length + 1, blockWidth);
    blockRange.setBorder(true, true, true, true, true, true, '#cccccc', SpreadsheetApp.BorderStyle.SOLID);
    startCol += blockWidth + gap;
  });
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

  var reports = buildDashboardReportsFromDefinitions_(definitions, dashboard, { mock: true });
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
  if (enabledById.trendCharts !== true) {
    throw new Error('Dashboard harness failed: trendCharts should be enabled.');
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
  if (enabledById.accountPositions !== true) {
    throw new Error('Dashboard harness failed: accountPositions should be enabled.');
  }

  return 'Dashboard report harness passed';
}
