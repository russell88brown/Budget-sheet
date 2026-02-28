// Input sheet readers and validation.
const Readers = {
  readAccounts: function () {
    var rows = readSheetRows_(Config.SHEETS.ACCOUNTS);
    return requireTypedReaderResult_(
      mapAccountReaderRowsTyped_(rows),
      'mapAccountReaderRows'
    );
  },

  readPolicies: function () {
    var rows = readSheetRows_(Config.SHEETS.POLICIES);
    return requireTypedReaderResult_(
      mapPolicyReaderRowsTyped_(rows),
      'mapPolicyReaderRows'
    );
  },

  readGoals: function () {
    var rows = readSheetRows_(Config.SHEETS.GOALS);
    return requireTypedReaderResult_(
      mapGoalReaderRowsTyped_(rows),
      'mapGoalReaderRows'
    );
  },

  readIncome: function () {
    var rows = readSheetRows_(Config.SHEETS.INCOME);
    return requireTypedReaderResult_(
      mapIncomeReaderRowsTyped_(rows),
      'mapIncomeReaderRows'
    );
  },

  readExpenses: function () {
    var rows = readSheetRows_(Config.SHEETS.EXPENSE);
    return requireTypedReaderResult_(
      mapExpenseReaderRowsTyped_(rows),
      'mapExpenseReaderRows'
    );
  },

  readTransfers: function () {
    var rows = readSheetRows_(Config.SHEETS.TRANSFERS);
    return requireTypedReaderResult_(
      mapTransferReaderRowsTyped_(rows),
      'mapTransferReaderRows'
    );
  },

  readTags: function () {
    var ss = SpreadsheetApp.getActive();
    var range = ss.getRangeByName(Config.NAMED_RANGES.SCENARIOS);
    if (!range) {
      return [Config.SCENARIOS.DEFAULT];
    }
    var values = range.getValues();
    return requireTypedReaderResult_(
      buildScenarioCatalogTyped_(values),
      'buildScenarioCatalog'
    );
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
  return requireTypedReaderResult_(
    mapSheetRowsTyped_(headers, values),
    'mapSheetRows'
  );
}

function requireTypedReaderResult_(value, functionName) {
  if (value === null || value === undefined) {
    throw new Error('Typed reader runtime is unavailable for ' + functionName + '. Run npm run build:typed.');
  }
  return value;
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

