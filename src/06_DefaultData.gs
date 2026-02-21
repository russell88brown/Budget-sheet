// Loads a reasonable default dataset for first-time setup.
function loadDefaultData() {
  setupStageStructure_();
  setupStageValidationAndSettings_();

  var ss = SpreadsheetApp.getActive();

  var accountsSheet = ss.getSheetByName(Config.SHEETS.ACCOUNTS);
  var transfersSheet = ss.getSheetByName(Config.SHEETS.TRANSFERS);
  var incomeSheet = ss.getSheetByName(Config.SHEETS.INCOME);
  var expenseSheet = ss.getSheetByName(Config.SHEETS.EXPENSE);

  if (!accountsSheet || !incomeSheet || !expenseSheet || !transfersSheet) {
    var missingMsg = 'Default data not loaded: required sheets missing.';
    Logger.warn(missingMsg);
    return { ok: false, message: missingMsg };
  }

  if (
    !isSheetEmpty_(accountsSheet) ||
    !isSheetEmpty_(incomeSheet) ||
    !isSheetEmpty_(expenseSheet) ||
    !isSheetEmpty_(transfersSheet)
  ) {
    var existingMsg = 'Default data not loaded: existing data detected.';
    Logger.warn(existingMsg);
    return { ok: false, message: existingMsg };
  }

  clearInputSheet_(accountsSheet);
  clearInputSheet_(transfersSheet);
  clearInputSheet_(incomeSheet);
  clearInputSheet_(expenseSheet);

  var today = new Date();
  var startDate = normalizeDate_(today);

  var accounts = [
    {
      'Account Name': 'Savings',
      Balance: 5000,
      Type: Config.ACCOUNT_TYPES.CASH,
      Include: true,
    },
    {
      'Account Name': 'Everyday',
      Balance: 1500,
      Type: Config.ACCOUNT_TYPES.CASH,
      Include: true,
    },
    {
      'Account Name': 'Credit Card',
      Balance: -1200,
      Type: Config.ACCOUNT_TYPES.CREDIT,
      Include: true,
    },
    {
      'Account Name': 'Car Loan',
      Balance: -15000,
      Type: Config.ACCOUNT_TYPES.CREDIT,
      Include: true,
    },
  ];

  var income = [
    {
      Include: true,
      Name: 'Salary',
      Amount: 3500,
      Frequency: Config.FREQUENCIES.DAILY,
      'Repeat Every': 14,
      'Start Date': startDate,
      'To Account': 'Savings',
    },
  ];

  var expenses = [
    {
      Include: true,
      Category: '01. Utilities',
      Name: 'Rent',
      Amount: 1800,
      Frequency: Config.FREQUENCIES.MONTHLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'From Account': 'Savings',
    },
    {
      Include: true,
      Category: '01. Utilities',
      Name: 'Electricity',
      Amount: 120,
      Frequency: Config.FREQUENCIES.MONTHLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'From Account': 'Credit Card',
    },
    {
      Include: true,
      Category: '01. Utilities',
      Name: 'Internet',
      Amount: 75,
      Frequency: Config.FREQUENCIES.MONTHLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'From Account': 'Credit Card',
    },
    {
      Include: true,
      Category: '02. Living',
      Name: 'Groceries',
      Amount: 180,
      Frequency: Config.FREQUENCIES.DAILY,
      'Repeat Every': 7,
      'Start Date': startDate,
      'From Account': 'Credit Card',
    },
    {
      Include: true,
      Category: '02. Living',
      Name: 'Fuel',
      Amount: 120,
      Frequency: Config.FREQUENCIES.DAILY,
      'Repeat Every': 14,
      'Start Date': startDate,
      'From Account': 'Credit Card',
    },
    {
      Include: true,
      Category: '05. Luxury',
      Name: 'Streaming',
      Amount: 25,
      Frequency: Config.FREQUENCIES.MONTHLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'From Account': 'Credit Card',
    },
    {
      Include: true,
      Category: '04. Car Expense',
      Name: 'Car Registration',
      Amount: 900,
      Frequency: Config.FREQUENCIES.MONTHLY,
      'Repeat Every': 6,
      'Start Date': startDate,
      'From Account': 'Savings',
    },
    {
      Include: true,
      Category: '04. Car Expense',
      Name: 'Car Insurance',
      Amount: 1500,
      Frequency: Config.FREQUENCIES.YEARLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'From Account': 'Savings',
    },
    {
      Include: true,
      Category: '04. Car Expense',
      Name: 'Car Maintenance',
      Amount: 500,
      Frequency: Config.FREQUENCIES.YEARLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'From Account': 'Savings',
    },
    {
      Include: true,
      Category: '05. Luxury',
      Name: 'Holiday',
      Amount: 2000,
      Frequency: Config.FREQUENCIES.YEARLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'From Account': 'Savings',
    },
  ];

  var transfers = [
    {
      Include: true,
      'Transfer Type': Config.TRANSFER_TYPES.REPAYMENT_ALL,
      Name: 'Credit Card Repayment',
      Amount: 0,
      Frequency: Config.FREQUENCIES.MONTHLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'From Account': 'Savings',
      'To Account': 'Credit Card',
      Notes: 'Auto-clear',
    },
    {
      Include: true,
      'Transfer Type': Config.TRANSFER_TYPES.REPAYMENT_AMOUNT,
      Name: 'Car Loan Repayment',
      Amount: 420,
      Frequency: Config.FREQUENCIES.MONTHLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'From Account': 'Savings',
      'To Account': 'Car Loan',
    },
    {
      Include: true,
      'Transfer Type': Config.TRANSFER_TYPES.TRANSFER_AMOUNT,
      Name: 'Weekly Buffer Transfer',
      Amount: 150,
      Frequency: Config.FREQUENCIES.DAILY,
      'Repeat Every': 7,
      'Start Date': startDate,
      'From Account': 'Everyday',
      'To Account': 'Savings',
    },
  ];

  writeRowsByHeader_(accountsSheet, accounts);
  writeRowsByHeader_(incomeSheet, income);
  writeRowsByHeader_(expenseSheet, expenses);
  writeRowsByHeader_(transfersSheet, transfers);
  ensureInputSheetFormatting_();

  Logger.info('Default data loaded.');
  return { ok: true, message: 'Default data loaded.' };
}

function writeRowsByHeader_(sheet, records) {
  if (!sheet || !records || !records.length) {
    return;
  }
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    return;
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var rows = records.map(function (record) {
    return headers.map(function (header) {
      if (record[header] === undefined || record[header] === null) {
        return '';
      }
      return record[header];
    });
  });
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function clearInputSheet_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}

function isSheetEmpty_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return true;
  }
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return !values.some(function (row) {
    return row.some(function (cell) {
      return !isEmptyCell_(cell);
    });
  });
}

function isEmptyCell_(cell) {
  if (cell === '' || cell === null || cell === false) {
    return true;
  }
  if (cell instanceof Date) {
    return false;
  }
  if (typeof cell === 'number') {
    return false;
  }
  if (typeof cell === 'boolean') {
    return cell === false;
  }
  return String(cell).trim() === '';
}
