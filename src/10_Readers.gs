// Input sheet readers and validation.
const Readers = {
  readAccounts: function () {
    var rows = readSheetRows_(Config.SHEETS.ACCOUNTS);
    return rows
      .filter(function (row) {
        return row['Account Name'];
      })
      .map(function (row) {
        return {
          name: row['Account Name'],
          balance: toNumber_(row['Balance']),
          type: row['Type'],
          forecast: toBoolean_(row['Include']),
          sinkFund: toBoolean_(row['Sink Fund']),
          interestRate: toNumber_(row['Interest Rate (APR %)']),
          interestMethod: row['Interest Method'],
          interestFrequency: normalizeFrequency_(row['Interest Frequency']),
          interestStartDate: toDate_(row['Interest Start Date']),
          interestEndDate: toDate_(row['Interest End Date']),
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
        return {
          name: row['Name'],
          amount: toNumber_(row['Amount']),
          frequency: normalizeFrequency_(row['Frequency']),
          startDate: toDate_(row['Start Date']),
          endDate: toDate_(row['End Date']),
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
        return {
          category: row['Category'],
          name: row['Name'],
          amount: toNumber_(row['Amount']),
          frequency: normalizeFrequency_(row['Frequency']),
          startDate: toDate_(row['Start Date']),
          endDate: toDate_(row['End Date']),
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
        return {
          behavior: normalizeBehavior_(row['Transfer Type']),
          name: row['Name'],
          amount: toNumber_(row['Amount']),
          frequency: normalizeFrequency_(row['Frequency']),
          startDate: toDate_(row['Start Date']),
          endDate: toDate_(row['End Date']),
          paidFrom: row['From Account'],
          paidTo: row['To Account'],
          notes: row['Notes'],
        };
      });
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

function toBoolean_(value) {
  return value === true || value === 'TRUE' || value === 'true' || value === 1;
}

function toNumber_(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  var num = Number(value);
  return isNaN(num) ? null : num;
}

function toDate_(value) {
  if (!value) {
    return null;
  }
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return value;
  }
  var parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeFrequency_(value) {
  if (!value) {
    return value;
  }
  if (value === 'Once' || value === 'One-off') {
    return Config.FREQUENCIES.ONCE;
  }
  return value;
}

function normalizeBehavior_(value) {
  if (value === null || value === undefined) {
    return value;
  }
  var cleaned = String(value).trim();
  if (!cleaned) {
    return cleaned;
  }
  var lower = cleaned.toLowerCase();
  if (lower === 'repayment') {
    return 'Repayment';
  }
  if (lower === 'transfer') {
    return 'Transfer';
  }
  if (lower === 'expense') {
    return 'Expense';
  }
  return cleaned;
}
