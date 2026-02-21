// Loads a reasonable default dataset for first-time setup.
function loadDefaultData() {
  var ss = SpreadsheetApp.getActive();

  var accountsSheet = ss.getSheetByName(Config.SHEETS.ACCOUNTS);
  var transfersSheet = ss.getSheetByName(Config.SHEETS.TRANSFERS);
  var incomeSheet = ss.getSheetByName(Config.SHEETS.INCOME);
  var expenseSheet = ss.getSheetByName(Config.SHEETS.EXPENSE);

  if (!accountsSheet || !incomeSheet || !expenseSheet || !transfersSheet) {
    Logger.warn('Default data not loaded: required sheets missing.');
    return;
  }

  if (
    !isSheetEmpty_(accountsSheet) ||
    !isSheetEmpty_(incomeSheet) ||
    !isSheetEmpty_(expenseSheet) ||
    !isSheetEmpty_(transfersSheet)
  ) {
    Logger.warn('Default data not loaded: existing data detected.');
    return;
  }

  clearInputSheet_(accountsSheet);
  clearInputSheet_(transfersSheet);
  clearInputSheet_(incomeSheet);
  clearInputSheet_(expenseSheet);

  var today = new Date();
  var startDate = normalizeDate_(today);

  var accounts = [
    ['Savings', 5000, Config.ACCOUNT_TYPES.CASH, true, '', '', '', '', '', '', '', '', '', ''],
    ['Everyday', 1500, Config.ACCOUNT_TYPES.CASH, true, '', '', '', '', '', '', '', '', '', ''],
    ['Credit Card', -1200, Config.ACCOUNT_TYPES.CREDIT, true, '', '', '', '', '', '', '', '', '', ''],
    ['Car Loan', -15000, Config.ACCOUNT_TYPES.CREDIT, true, '', '', '', '', '', '', '', '', '', ''],
  ];

  var income = [
    [true, 'Salary', 3500, Config.FREQUENCIES.DAILY, 14, startDate, '', 'Savings', ''],
  ];

  var expenses = [
    [true, '01. Utilities', 'Rent', 1800, Config.FREQUENCIES.MONTHLY, 1, startDate, '', 'Savings', '', ''],
    [true, '01. Utilities', 'Electricity', 120, Config.FREQUENCIES.MONTHLY, 1, startDate, '', 'Credit Card', '', ''],
    [true, '01. Utilities', 'Internet', 75, Config.FREQUENCIES.MONTHLY, 1, startDate, '', 'Credit Card', '', ''],
    [true, '02. Living', 'Groceries', 180, Config.FREQUENCIES.DAILY, 7, startDate, '', 'Credit Card', '', ''],
    [true, '02. Living', 'Fuel', 120, Config.FREQUENCIES.DAILY, 14, startDate, '', 'Credit Card', '', ''],
    [true, '05. Luxury', 'Streaming', 25, Config.FREQUENCIES.MONTHLY, 1, startDate, '', 'Credit Card', '', ''],
    [true, '04. Car Expense', 'Car Registration', 900, Config.FREQUENCIES.MONTHLY, 6, startDate, '', 'Savings', '', ''],
    [true, '04. Car Expense', 'Car Insurance', 1500, Config.FREQUENCIES.YEARLY, 1, startDate, '', 'Savings', '', ''],
    [true, '04. Car Expense', 'Car Maintenance', 500, Config.FREQUENCIES.YEARLY, 1, startDate, '', 'Savings', '', ''],
    [true, '05. Luxury', 'Holiday', 2000, Config.FREQUENCIES.YEARLY, 1, startDate, '', 'Savings', '', ''],
  ];

  var transfers = [
    [true, Config.TRANSFER_TYPES.REPAYMENT_ALL, 'Credit Card Repayment', 0, Config.FREQUENCIES.MONTHLY, 1, startDate, '', 'Savings', 'Credit Card', 'Auto-clear'],
    [true, Config.TRANSFER_TYPES.REPAYMENT_AMOUNT, 'Car Loan Repayment', 420, Config.FREQUENCIES.MONTHLY, 1, startDate, '', 'Savings', 'Car Loan', ''],
    [true, Config.TRANSFER_TYPES.TRANSFER_AMOUNT, 'Weekly Buffer Transfer', 150, Config.FREQUENCIES.DAILY, 7, startDate, '', 'Everyday', 'Savings', ''],
  ];

  accountsSheet.getRange(2, 1, accounts.length, accounts[0].length).setValues(accounts);
  incomeSheet.getRange(2, 1, income.length, income[0].length).setValues(income);
  expenseSheet.getRange(2, 1, expenses.length, expenses[0].length).setValues(expenses);
  transfersSheet.getRange(2, 1, transfers.length, transfers[0].length).setValues(transfers);
  ensureInputSheetFormatting_();

  Logger.info('Default data loaded.');
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
