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
        return {
          name: row['Account Name'],
          balance: toNumber_(row['Balance']),
          type: row['Type'],
          forecast: toBoolean_(row['Include']),
          interestRate: toNumber_(row['Interest Rate (APR %)']),
          interestMonthlyFee: toNumber_(row['Interest Fee / Month']),
          interestMethod: row['Interest Method'],
          interestPostingFrequency: interestRecurrence.frequency,
          interestPostingRepeatEvery: interestRecurrence.repeatEvery,
          interestPostingStartDate: interestRecurrence.startDate,
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
        return {
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
        return {
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
        var amount = toNumber_(row['Amount']);
        var transferType = normalizeTransferType_(row['Type'], amount);
        return {
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

function normalizeRecurrence_(frequencyValue, repeatEveryValue, startDateValue, endDateValue) {
  var startDate = toDate_(startDateValue);
  var endDate = toDate_(endDateValue);
  var normalized = normalizeFrequency_(frequencyValue);
  var repeatEvery = normalized.repeatEvery || toPositiveInt_(repeatEveryValue) || 1;

  if (normalized.isSingleOccurrence && startDate && !endDate) {
    endDate = startDate;
  }

  return {
    frequency: normalized.frequency,
    repeatEvery: repeatEvery,
    isSingleOccurrence: normalized.isSingleOccurrence,
    startDate: startDate,
    endDate: endDate,
  };
}

function normalizeFrequency_(value) {
  if (!value) {
    return { frequency: value, repeatEvery: null, isSingleOccurrence: false };
  }

  var cleaned = String(value).trim();
  var lower = cleaned.toLowerCase();

  if (lower === 'daily') {
    return { frequency: Config.FREQUENCIES.DAILY, repeatEvery: null, isSingleOccurrence: false };
  }
  if (lower === 'once' || lower === 'one-off' || lower === 'one off') {
    return { frequency: Config.FREQUENCIES.ONCE, repeatEvery: 1, isSingleOccurrence: true };
  }
  if (lower === 'weekly') {
    return { frequency: Config.FREQUENCIES.WEEKLY, repeatEvery: null, isSingleOccurrence: false };
  }
  if (lower === 'monthly') {
    return { frequency: Config.FREQUENCIES.MONTHLY, repeatEvery: null, isSingleOccurrence: false };
  }
  if (lower === 'yearly' || lower === 'annually') {
    return { frequency: Config.FREQUENCIES.YEARLY, repeatEvery: lower === 'annually' ? 1 : null, isSingleOccurrence: false };
  }
  return { frequency: cleaned, repeatEvery: null, isSingleOccurrence: false };
}

function toPositiveInt_(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  var num = Number(value);
  if (!isFinite(num)) {
    return null;
  }
  if (num < 1) {
    return null;
  }
  return Math.floor(num);
}

function normalizeTransferType_(value, amountValue) {
  if (value === null || value === undefined) {
    return value;
  }
  var cleaned = String(value).trim();
  if (!cleaned) {
    return cleaned;
  }
  var lower = cleaned.toLowerCase();
  if (lower === String(Config.TRANSFER_TYPES.REPAYMENT_AMOUNT).toLowerCase()) {
    return Config.TRANSFER_TYPES.REPAYMENT_AMOUNT;
  }
  if (lower === String(Config.TRANSFER_TYPES.REPAYMENT_ALL).toLowerCase()) {
    return Config.TRANSFER_TYPES.REPAYMENT_ALL;
  }
  if (lower === String(Config.TRANSFER_TYPES.TRANSFER_AMOUNT).toLowerCase()) {
    return Config.TRANSFER_TYPES.TRANSFER_AMOUNT;
  }
  if (lower === String(Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT).toLowerCase()) {
    return Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT;
  }

  // Backward compatibility for legacy values.
  if (lower === 'repayment') {
    var amount = toNumber_(amountValue);
    if (amount === 0) {
      return Config.TRANSFER_TYPES.REPAYMENT_ALL;
    }
    return Config.TRANSFER_TYPES.REPAYMENT_AMOUNT;
  }
  if (lower === 'transfer') {
    return Config.TRANSFER_TYPES.TRANSFER_AMOUNT;
  }

  return cleaned;
}
