// Input sheet readers and validation.
const Readers = {
  readAccounts: function () {
    var rows = readSheetRows_(Config.SHEETS.ACCOUNTS);
    return rows
      .filter(function (row) {
        return row['Account Name'];
      })
      .map(function (row) {
        var interestRecurrence = normalizeRecurrence_(
          row['Interest Frequency'],
          row['Interest Repeat Every'],
          row['Interest Start Date'],
          null
        );
        var scenarioId = normalizeScenario_(getTagValue_(row));
        return {
          name: row['Account Name'],
          balance: toNumber_(row['Balance']),
          type: row['Type'],
          forecast: toBoolean_(row['Include']),
          scenarioId: scenarioId,
          interestRate: toNumber_(row['Interest Rate (APR %)']),
          interestMonthlyFee: toNumber_(row['Interest Fee / Month']),
          interestMethod: row['Interest Method'],
          interestPostingFrequency: interestRecurrence.frequency,
          interestPostingRepeatEvery: interestRecurrence.repeatEvery,
          interestPostingStartDate: interestRecurrence.startDate,
        };
      });
  },

  readPolicies: function () {
    var rows = readSheetRows_(Config.SHEETS.POLICIES);
    return rows
      .filter(function (row) {
        return toBoolean_(row['Include']);
      })
      .map(function (row) {
        var scenarioId = normalizeScenario_(getTagValue_(row));
        return {
          ruleId: row['Rule ID'],
          type: normalizePolicyType_(row['Policy Type']),
          name: row['Name'],
          scenarioId: scenarioId,
          priority: toPositiveInt_(row['Priority']) || 100,
          startDate: toDate_(row['Start Date']),
          endDate: toDate_(row['End Date']),
          triggerAccount: row['Trigger Account'],
          fundingAccount: row['Funding Account'],
          threshold: toNumber_(row['Threshold']) || 0,
          maxPerEvent: toNumber_(row['Max Per Event']),
          notes: row['Notes'],
        };
      });
  },

  readGoals: function () {
    var rows = readSheetRows_(Config.SHEETS.GOALS);
    return rows
      .filter(function (row) {
        return toBoolean_(row['Include']);
      })
      .map(function (row) {
        var scenarioId = normalizeScenario_(getTagValue_(row));
        return {
          ruleId: row['Rule ID'],
          name: row['Goal Name'],
          scenarioId: scenarioId,
          targetAmount: toNumber_(row['Target Amount']),
          targetDate: toDate_(row['Target Date']),
          priority: toPositiveInt_(row['Priority']) || 100,
          fundingAccount: row['Funding Account'],
          fundingPolicy: row['Funding Policy'],
          amountPerMonth: toNumber_(row['Amount Per Month']),
          percentOfInflow: toNumber_(row['Percent Of Inflow']),
          notes: row['Notes'],
        };
      });
  },

  readIncome: function () {
    var rows = readSheetRows_(Config.SHEETS.INCOME);
    return rows
      .filter(function (row) {
        return toBoolean_(row['Include']);
      })
      .map(function (row) {
        var recurrence = normalizeRecurrence_(
          row['Frequency'],
          row['Repeat Every'],
          row['Start Date'],
          row['End Date']
        );
        var scenarioId = normalizeScenario_(getTagValue_(row));
        return {
          ruleId: row['Rule ID'],
          scenarioId: scenarioId,
          type: row['Type'],
          name: row['Name'],
          amount: toNumber_(row['Amount']),
          frequency: recurrence.frequency,
          repeatEvery: recurrence.repeatEvery,
          isSingleOccurrence: recurrence.isSingleOccurrence,
          startDate: recurrence.startDate,
          endDate: recurrence.endDate,
          paidTo: row['To Account'],
          notes: row['Notes'],
        };
      });
  },

  readExpenses: function () {
    var rows = readSheetRows_(Config.SHEETS.EXPENSE);
    return rows
      .filter(function (row) {
        return toBoolean_(row['Include']);
      })
      .map(function (row) {
        var recurrence = normalizeRecurrence_(
          row['Frequency'],
          row['Repeat Every'],
          row['Start Date'],
          row['End Date']
        );
        var scenarioId = normalizeScenario_(getTagValue_(row));
        return {
          ruleId: row['Rule ID'],
          scenarioId: scenarioId,
          type: row['Type'],
          name: row['Name'],
          amount: toNumber_(row['Amount']),
          frequency: recurrence.frequency,
          repeatEvery: recurrence.repeatEvery,
          isSingleOccurrence: recurrence.isSingleOccurrence,
          startDate: recurrence.startDate,
          endDate: recurrence.endDate,
          paidFrom: row['From Account'],
          paidTo: 'External',
          behavior: Config.BEHAVIOR_LABELS.Expense,
          notes: row['Notes'],
        };
      });
  },

  readTransfers: function () {
    var rows = readSheetRows_(Config.SHEETS.TRANSFERS);
    return rows
      .filter(function (row) {
        return toBoolean_(row['Include']);
      })
      .map(function (row) {
        var recurrence = normalizeRecurrence_(
          row['Frequency'],
          row['Repeat Every'],
          row['Start Date'],
          row['End Date']
        );
        var scenarioId = normalizeScenario_(getTagValue_(row));
        var amount = toNumber_(row['Amount']);
        var transferType = normalizeTransferType_(row['Type'], amount);
        return {
          ruleId: row['Rule ID'],
          scenarioId: scenarioId,
          type: transferType,
          behavior: transferType,
          name: row['Name'],
          amount: amount,
          frequency: recurrence.frequency,
          repeatEvery: recurrence.repeatEvery,
          isSingleOccurrence: recurrence.isSingleOccurrence,
          startDate: recurrence.startDate,
          endDate: recurrence.endDate,
          paidFrom: row['From Account'],
          paidTo: row['To Account'],
          notes: row['Notes'],
        };
      });
  },

  readTags: function () {
    var ss = SpreadsheetApp.getActive();
    var range = ss.getRangeByName(Config.NAMED_RANGES.SCENARIOS);
    if (!range) {
      return [Config.SCENARIOS.DEFAULT];
    }
    var values = range.getValues();
    var typed = buildScenarioCatalogTyped_(values);
    if (typed) {
      return typed;
    }
    var unique = {};
    values.forEach(function (row) {
      var scenarioId = normalizeScenario_(row[0]);
      if (scenarioId) {
        unique[scenarioId] = true;
      }
    });
    unique[Config.SCENARIOS.DEFAULT] = true;
    return Object.keys(unique);
  },
};

function readSheetRows_(sheetName) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) {
    return [];
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return [];
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var typed = mapSheetRowsTyped_(headers, values);
  if (typed) {
    return typed;
  }

  return values
    .map(function (row) {
      var obj = {};
      headers.forEach(function (header, idx) {
        obj[header] = row[idx];
      });
      return obj;
    })
    .filter(function (row) {
      return Object.keys(row).some(function (key) {
        return row[key] !== '' && row[key] !== null && row[key] !== false;
      });
    });
}

function getTagValue_(row) {
  if (!row) {
    return '';
  }
  return row.Tag;
}

function toBoolean_(value) {
  return toBooleanTyped_(value);
}

function toNumber_(value) {
  return toNumberTyped_(value);
}

function toDate_(value) {
  return toDateTyped_(value);
}

function normalizeRecurrence_(frequencyValue, repeatEveryValue, startDateValue, endDateValue) {
  return normalizeRecurrenceTyped_(frequencyValue, repeatEveryValue, startDateValue, endDateValue);
}

function normalizeFrequency_(value) {
  return normalizeFrequencyTyped_(value);
}

function toPositiveInt_(value) {
  return toPositiveIntTyped_(value);
}

function normalizeTransferType_(value, amountValue) {
  return normalizeTransferTypeTyped_(value, amountValue);
}

function normalizeScenario_(value) {
  return normalizeTagTyped_(value);
}

function normalizePolicyType_(value) {
  return normalizePolicyTypeTyped_(value);
}

