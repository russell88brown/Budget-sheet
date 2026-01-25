// Loads a reasonable default dataset for first-time setup.
function loadDefaultData() {
  var ss = SpreadsheetApp.getActive();

  var accountsSheet = ss.getSheetByName(Config.SHEETS.ACCOUNTS);
  var incomeSheet = ss.getSheetByName(Config.SHEETS.INCOME);
  var expenseSheet = ss.getSheetByName(Config.SHEETS.EXPENSE);

  if (!accountsSheet || !incomeSheet || !expenseSheet) {
    Logger.warn('Default data not loaded: required sheets missing.');
    return;
  }

  if (!isSheetEmpty_(accountsSheet) || !isSheetEmpty_(incomeSheet) || !isSheetEmpty_(expenseSheet)) {
    Logger.warn('Default data not loaded: existing data detected.');
    return;
  }

  clearInputSheet_(accountsSheet);
  clearInputSheet_(incomeSheet);
  clearInputSheet_(expenseSheet);

  var today = new Date();
  var dateStr = Utilities.formatDate(today, ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd');

  var accounts = [
    ['Savings', 5000, Config.ACCOUNT_TYPES.CASH, true, false],
    ['Everyday', 1500, Config.ACCOUNT_TYPES.CASH, true, false],
    ['Credit Card', -1200, Config.ACCOUNT_TYPES.CREDIT, true, false],
    ['Car Loan', -15000, Config.ACCOUNT_TYPES.CREDIT, true, false],
    ['Sink Fund', 0, Config.ACCOUNT_TYPES.CASH, true, true],
  ];

  var income = [
    [true, 'Salary', 3500, Config.FREQUENCIES.FORTNIGHTLY, dateStr, '', 'Savings', ''],
  ];

  var expenses = [
    [true, 'Expense', '01. Utilities', 'Rent', 1800, Config.FREQUENCIES.MONTHLY, dateStr, '', 'Savings', 'External', '', false, ''],
    [true, 'Expense', '01. Utilities', 'Electricity', 120, Config.FREQUENCIES.MONTHLY, dateStr, '', 'Credit Card', 'External', '', false, ''],
    [true, 'Expense', '01. Utilities', 'Internet', 75, Config.FREQUENCIES.MONTHLY, dateStr, '', 'Credit Card', 'External', '', false, ''],
    [true, 'Expense', '02. Living', 'Groceries', 180, Config.FREQUENCIES.WEEKLY, dateStr, '', 'Credit Card', 'External', '', false, ''],
    [true, 'Expense', '02. Living', 'Fuel', 120, Config.FREQUENCIES.FORTNIGHTLY, dateStr, '', 'Credit Card', 'External', '', false, ''],
    [true, 'Expense', '05. Luxury', 'Streaming', 25, Config.FREQUENCIES.MONTHLY, dateStr, '', 'Credit Card', 'External', '', false, ''],
    [true, 'Repayment', '06. Debt', 'Credit Card Repayment', 0, Config.FREQUENCIES.MONTHLY, dateStr, '', 'Savings', 'Credit Card', '', false, 'Auto-clear'],
    [true, 'Repayment', '06. Debt', 'Car Loan Repayment', 420, Config.FREQUENCIES.MONTHLY, dateStr, '', 'Savings', 'Car Loan', '', false, ''],
    [true, 'Transfer', '07. Investment - Liquid', 'Sink Fund Top-up', 150, Config.FREQUENCIES.FORTNIGHTLY, dateStr, '', 'Savings', 'Sink Fund', '', false, ''],
    [true, 'Expense', '04. Car Expense', 'Car Registration', 900, Config.FREQUENCIES.SEMI_ANNUALLY, dateStr, '', 'Sink Fund', 'External', '', false, ''],
    [true, 'Expense', '04. Car Expense', 'Car Insurance', 1500, Config.FREQUENCIES.ANNUALLY, dateStr, '', 'Sink Fund', 'External', '', false, ''],
    [true, 'Expense', '04. Car Expense', 'Car Maintenance', 500, Config.FREQUENCIES.ANNUALLY, dateStr, '', 'Sink Fund', 'External', '', false, ''],
    [true, 'Expense', '05. Luxury', 'Holiday', 2000, Config.FREQUENCIES.ANNUALLY, dateStr, '', 'Sink Fund', 'External', '', false, ''],
  ];

  accountsSheet.getRange(2, 1, accounts.length, accounts[0].length).setValues(accounts);
  incomeSheet.getRange(2, 1, income.length, income[0].length).setValues(income);
  expenseSheet.getRange(2, 1, expenses.length, expenses[0].length).setValues(expenses);

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
