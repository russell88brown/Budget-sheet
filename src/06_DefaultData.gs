// Loads a reasonable default dataset for first-time setup.
function loadDefaultData() {
  setupStageStructure_();
  setupStageValidationAndSettings_();

  var ss = SpreadsheetApp.getActive();

  var accountsSheet = ss.getSheetByName(Config.SHEETS.ACCOUNTS);
  var policiesSheet = ss.getSheetByName(Config.SHEETS.POLICIES);
  var goalsSheet = ss.getSheetByName(Config.SHEETS.GOALS);
  var riskSheet = ss.getSheetByName(Config.SHEETS.RISK);
  var transfersSheet = ss.getSheetByName(Config.SHEETS.TRANSFERS);
  var incomeSheet = ss.getSheetByName(Config.SHEETS.INCOME);
  var expenseSheet = ss.getSheetByName(Config.SHEETS.EXPENSE);

  if (!accountsSheet || !policiesSheet || !goalsSheet || !riskSheet || !incomeSheet || !expenseSheet || !transfersSheet) {
    var missingMsg = 'Default data not loaded: required sheets missing.';
    return { ok: false, message: missingMsg };
  }

  if (
    !isSheetEmpty_(accountsSheet) ||
    !isSheetEmpty_(policiesSheet) ||
    !isSheetEmpty_(goalsSheet) ||
    !isSheetEmpty_(riskSheet) ||
    !isSheetEmpty_(incomeSheet) ||
    !isSheetEmpty_(expenseSheet) ||
    !isSheetEmpty_(transfersSheet)
  ) {
    var existingMsg = 'Default data not loaded: existing data detected.';
    return { ok: false, message: existingMsg };
  }

  clearInputSheet_(accountsSheet);
  clearInputSheet_(policiesSheet);
  clearInputSheet_(goalsSheet);
  clearInputSheet_(riskSheet);
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
      'Interest Rate (APR %)': 4.25,
      'Interest Fee / Month': 0,
      'Interest Method': Config.INTEREST_METHODS.APR_SIMPLE,
      'Interest Frequency': Config.FREQUENCIES.MONTHLY,
      'Interest Repeat Every': 1,
      'Interest Start Date': startDate,
    },
    {
      'Account Name': 'Everyday',
      Balance: 1500,
      Type: Config.ACCOUNT_TYPES.CASH,
      Include: true,
    },
    {
      'Account Name': 'High Yield',
      Balance: 8000,
      Type: Config.ACCOUNT_TYPES.CASH,
      Include: true,
      'Interest Rate (APR %)': 5.1,
      'Interest Fee / Month': 0,
      'Interest Method': Config.INTEREST_METHODS.APY_COMPOUND,
      'Interest Frequency': Config.FREQUENCIES.MONTHLY,
      'Interest Repeat Every': 1,
      'Interest Start Date': startDate,
    },
    {
      'Account Name': 'Credit Card',
      Balance: -1200,
      Type: Config.ACCOUNT_TYPES.CREDIT,
      Include: true,
      'Interest Rate (APR %)': 21.99,
      'Interest Fee / Month': 10,
      'Interest Method': Config.INTEREST_METHODS.APR_SIMPLE,
      'Interest Frequency': Config.FREQUENCIES.MONTHLY,
      'Interest Repeat Every': 1,
      'Interest Start Date': startDate,
    },
    {
      'Account Name': 'Car Loan',
      Balance: -15000,
      Type: Config.ACCOUNT_TYPES.CREDIT,
      Include: true,
      'Interest Rate (APR %)': 6.9,
      'Interest Fee / Month': 0,
      'Interest Method': Config.INTEREST_METHODS.APR_SIMPLE,
      'Interest Frequency': Config.FREQUENCIES.MONTHLY,
      'Interest Repeat Every': 1,
      'Interest Start Date': startDate,
    },
  ];

  var income = [
    {
      Include: true,
      Type: 'Salary',
      Name: 'Salary',
      Amount: 3500,
      Frequency: Config.FREQUENCIES.DAILY,
      'Repeat Every': 14,
      'Start Date': startDate,
      'To Account': 'Savings',
    },
    {
      Include: true,
      Type: 'Other Income',
      Name: 'Allowance',
      Amount: 500,
      Frequency: Config.FREQUENCIES.MONTHLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'To Account': 'Everyday',
    },
    {
      Include: true,
      Type: 'Other Income',
      Name: 'Tax Refund',
      Amount: 1200,
      Frequency: Config.FREQUENCIES.ONCE,
      'Repeat Every': 1,
      'Start Date': startDate,
      'End Date': startDate,
      'To Account': 'Savings',
      Notes: 'One-off; excluded from monthly average',
    },
  ];

  var goals = [
    {
      Include: true,
      'Goal Name': 'Emergency top-up',
      'Target Amount': 5000,
      'Target Date': new Date(startDate.getFullYear(), startDate.getMonth() + 12, startDate.getDate()),
      Priority: 1,
      'Funding Account': 'Savings',
      'Funding Policy': Config.GOAL_FUNDING_POLICIES.FIXED,
      'Amount Per Month': 200,
      'Percent Of Inflow': '',
      Notes: 'Fixed monthly contribution',
    },
    {
      Include: true,
      'Goal Name': 'Holiday fund',
      'Target Amount': 3000,
      'Target Date': new Date(startDate.getFullYear(), startDate.getMonth() + 9, startDate.getDate()),
      Priority: 2,
      'Funding Account': 'Savings',
      'Funding Policy': Config.GOAL_FUNDING_POLICIES.PERCENT,
      'Amount Per Month': '',
      'Percent Of Inflow': 10,
      Notes: 'Percent-of-inflow example',
    },
    {
      Include: true,
      'Goal Name': 'Car maintenance reserve',
      'Target Amount': 1200,
      'Target Date': new Date(startDate.getFullYear(), startDate.getMonth() + 6, startDate.getDate()),
      Priority: 3,
      'Funding Account': 'Everyday',
      'Funding Policy': Config.GOAL_FUNDING_POLICIES.LEFTOVER,
      'Amount Per Month': '',
      'Percent Of Inflow': '',
      Notes: 'Leftover policy example',
    },
  ];

  var riskRows = [
    {
      Include: true,
      'Scenario Name': 'Base',
      'Emergency Buffer Account': 'Savings',
      'Emergency Buffer Minimum': 1000,
      'Income Shock Percent': 0,
      'Expense Shock Percent': 0,
      Notes: 'Active baseline risk profile',
    },
    {
      Include: false,
      'Scenario Name': 'Stress',
      'Emergency Buffer Account': 'Savings',
      'Emergency Buffer Minimum': 2000,
      'Income Shock Percent': 20,
      'Expense Shock Percent': 15,
      Notes: 'Disabled by default; enable to test stress assumptions',
    },
  ];

  var policies = [
    {
      Include: true,
      'Policy Type': Config.POLICY_TYPES.AUTO_DEFICIT_COVER,
      Name: 'Everyday overdraft protection',
      Priority: 1,
      'Start Date': startDate,
      'Trigger Account': 'Everyday',
      'Funding Account': 'Savings',
      Threshold: 0,
      'Max Per Event': 1500,
      Notes: 'Primary protection source',
    },
    {
      Include: true,
      'Policy Type': Config.POLICY_TYPES.AUTO_DEFICIT_COVER,
      Name: 'Everyday backup from High Yield',
      Priority: 2,
      'Start Date': startDate,
      'Trigger Account': 'Everyday',
      'Funding Account': 'High Yield',
      Threshold: 100,
      'Max Per Event': 500,
      Notes: 'Secondary policy demonstrates priority and cap behavior',
    },
  ];

  var expenses = [
    {
      Include: true,
      Type: '01. Utilities',
      Name: 'Rent',
      Amount: 1800,
      Frequency: Config.FREQUENCIES.MONTHLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'From Account': 'Savings',
    },
    {
      Include: true,
      Type: '01. Utilities',
      Name: 'Electricity',
      Amount: 120,
      Frequency: Config.FREQUENCIES.MONTHLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'From Account': 'Credit Card',
    },
    {
      Include: true,
      Type: '01. Utilities',
      Name: 'Internet',
      Amount: 75,
      Frequency: Config.FREQUENCIES.MONTHLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'From Account': 'Credit Card',
    },
    {
      Include: true,
      Type: '02. Living',
      Name: 'Groceries',
      Amount: 180,
      Frequency: Config.FREQUENCIES.DAILY,
      'Repeat Every': 7,
      'Start Date': startDate,
      'From Account': 'Credit Card',
    },
    {
      Include: true,
      Type: '02. Living',
      Name: 'Fuel',
      Amount: 240,
      Frequency: Config.FREQUENCIES.DAILY,
      'Repeat Every': 14,
      'Start Date': startDate,
      'From Account': 'Everyday',
    },
    {
      Include: true,
      Type: '05. Luxury',
      Name: 'Streaming',
      Amount: 25,
      Frequency: Config.FREQUENCIES.MONTHLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'From Account': 'Credit Card',
    },
    {
      Include: true,
      Type: '04. Car Expense',
      Name: 'Car Registration',
      Amount: 900,
      Frequency: Config.FREQUENCIES.MONTHLY,
      'Repeat Every': 6,
      'Start Date': startDate,
      'From Account': 'Savings',
    },
    {
      Include: true,
      Type: '04. Car Expense',
      Name: 'Car Insurance',
      Amount: 1500,
      Frequency: Config.FREQUENCIES.YEARLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'From Account': 'Savings',
    },
    {
      Include: true,
      Type: '04. Car Expense',
      Name: 'Car Maintenance',
      Amount: 500,
      Frequency: Config.FREQUENCIES.YEARLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'From Account': 'Savings',
    },
    {
      Include: true,
      Type: '05. Luxury',
      Name: 'Holiday',
      Amount: 2000,
      Frequency: Config.FREQUENCIES.YEARLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'From Account': 'Savings',
    },
    {
      Include: true,
      Type: '05. Luxury',
      Name: 'Laptop Upgrade',
      Amount: 1800,
      Frequency: Config.FREQUENCIES.ONCE,
      'Repeat Every': 1,
      'Start Date': startDate,
      'End Date': startDate,
      'From Account': 'Savings',
      Notes: 'One-off; excluded from monthly average',
    },
  ];

  var transfers = [
    {
      Include: true,
      Type: Config.TRANSFER_TYPES.REPAYMENT_ALL,
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
      Type: Config.TRANSFER_TYPES.REPAYMENT_AMOUNT,
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
      Type: Config.TRANSFER_TYPES.TRANSFER_AMOUNT,
      Name: 'Weekly Buffer Transfer',
      Amount: 150,
      Frequency: Config.FREQUENCIES.DAILY,
      'Repeat Every': 7,
      'Start Date': startDate,
      'From Account': 'Everyday',
      'To Account': 'Savings',
    },
    {
      Include: true,
      Type: Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT,
      Name: 'Sweep to High Yield',
      Amount: 2000,
      Frequency: Config.FREQUENCIES.MONTHLY,
      'Repeat Every': 1,
      'Start Date': startDate,
      'From Account': 'Savings',
      'To Account': 'High Yield',
      Notes: 'Keep 2000 in Savings',
    },
  ];

  writeRowsByHeader_(accountsSheet, accounts);
  writeRowsByHeader_(policiesSheet, policies);
  writeRowsByHeader_(goalsSheet, goals);
  writeRowsByHeader_(riskSheet, riskRows);
  writeRowsByHeader_(incomeSheet, income);
  writeRowsByHeader_(expenseSheet, expenses);
  writeRowsByHeader_(transfersSheet, transfers);
  ensureInputSheetFormatting_();

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
