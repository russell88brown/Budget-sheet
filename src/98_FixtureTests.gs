// Deterministic fixture tests for the domain-core compile/apply flow.
function runDeterministicFixtureTestsPhase2_All() {
  var results = [];
  results.push(runDeterministicFixtureTestsPhase2_FixtureA());
  results.push(runDeterministicFixtureTestsPhase2_FixtureB());
  results.push(runDeterministicFixtureTestsPhase2_FixtureC());
  results.push(runDeterministicFixtureTestsPhase2_FixtureD());
  results.push(runDeterministicFixtureTestsPhase2_FixtureE());
  return results;
}

function runDeterministicFixtureTestsPhase2_FixtureA() {
  resetFixtureRunState_();
  var anchor = fixtureAnchorDate_();
  var model = {
    scenarioId: Config.SCENARIOS.DEFAULT,
    accounts: [
      { name: 'Operating', balance: 1000, type: Config.ACCOUNT_TYPES.CASH, forecast: true },
      { name: 'Card', balance: -500, type: Config.ACCOUNT_TYPES.CREDIT, forecast: true },
    ],
    incomeRules: [
      {
        scenarioId: Config.SCENARIOS.DEFAULT,
        type: 'Salary',
        name: 'Paycheck',
        amount: 1200,
        frequency: Config.FREQUENCIES.ONCE,
        repeatEvery: 1,
        startDate: anchor,
        endDate: anchor,
        paidTo: 'Operating',
      },
    ],
    expenseRules: [
      {
        scenarioId: Config.SCENARIOS.DEFAULT,
        type: 'Fixed',
        name: 'Rent',
        amount: 700,
        frequency: Config.FREQUENCIES.ONCE,
        repeatEvery: 1,
        startDate: anchor,
        endDate: anchor,
        paidFrom: 'Operating',
      },
    ],
    transferRules: [
      {
        scenarioId: Config.SCENARIOS.DEFAULT,
        type: Config.TRANSFER_TYPES.TRANSFER_AMOUNT,
        behavior: Config.TRANSFER_TYPES.TRANSFER_AMOUNT,
        name: 'Card Payment',
        amount: 200,
        frequency: Config.FREQUENCIES.ONCE,
        repeatEvery: 1,
        startDate: anchor,
        endDate: anchor,
        paidFrom: 'Operating',
        paidTo: 'Card',
      },
    ],
    policies: [],
    riskSettings: [],
  };

  var events = CoreCompileRules.buildSortedEventsForScenarioModel(model);
  assertFixtureEqual_('Fixture A event count', 3, events.length);
  var journal = CoreApplyEvents.buildJournalRows({
    accounts: model.accounts,
    events: events,
    policies: model.policies,
    riskSettings: model.riskSettings,
    scenarioId: model.scenarioId,
  });
  assertFixtureEqual_('Fixture A row count', 6, journal.rows.length);
  assertFixtureBalances_(journal, { Operating: 1300, Card: -300 });
  return 'Fixture A passed';
}

function runDeterministicFixtureTestsPhase2_FixtureB() {
  resetFixtureRunState_();
  var anchor = fixtureAnchorDate_();
  var nextDay = addDays_(anchor, 1);
  var model = {
    scenarioId: Config.SCENARIOS.DEFAULT,
    accounts: [{ name: 'Wallet', balance: 0, type: Config.ACCOUNT_TYPES.CASH, forecast: true }],
    incomeRules: [
      {
        scenarioId: Config.SCENARIOS.DEFAULT,
        type: 'Bonus',
        name: 'Bonus',
        amount: 10,
        frequency: Config.FREQUENCIES.ONCE,
        repeatEvery: 1,
        startDate: nextDay,
        endDate: nextDay,
        paidTo: 'Wallet',
      },
      {
        scenarioId: Config.SCENARIOS.DEFAULT,
        type: 'Gift',
        name: 'Gift',
        amount: 5,
        frequency: Config.FREQUENCIES.ONCE,
        repeatEvery: 1,
        startDate: anchor,
        endDate: anchor,
        paidTo: 'Wallet',
      },
    ],
    expenseRules: [],
    transferRules: [],
    policies: [],
    riskSettings: [],
  };
  var events = CoreCompileRules.buildSortedEventsForScenarioModel(model);
  assertFixtureEqual_('Fixture B event count', 2, events.length);
  assertFixtureEqual_('Fixture B first event name', 'Gift', events[0].name);
  assertFixtureEqual_('Fixture B second event name', 'Bonus', events[1].name);
  return 'Fixture B passed';
}

function runDeterministicFixtureTestsPhase2_FixtureC() {
  resetFixtureRunState_();
  var anchor = fixtureAnchorDate_();
  var accounts = [
    { name: 'Checking', balance: 1000, type: Config.ACCOUNT_TYPES.CASH, forecast: true },
    { name: 'Vault', balance: 0, type: Config.ACCOUNT_TYPES.CASH, forecast: true },
  ];
  var events = [
    {
      date: anchor,
      kind: 'Transfer',
      behavior: Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT,
      transferBehavior: Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT,
      name: 'Sweep',
      from: 'Checking',
      to: 'Vault',
      amount: 200,
    },
  ];
  var journal = CoreApplyEvents.buildJournalRows({
    accounts: accounts,
    events: events,
    policies: [],
    riskSettings: [],
    scenarioId: Config.SCENARIOS.DEFAULT,
  });
  assertFixtureBalances_(journal, { Checking: 200, Vault: 800 });
  return 'Fixture C passed';
}

function runDeterministicFixtureTestsPhase2_FixtureD() {
  resetFixtureRunState_();
  var anchor = fixtureAnchorDate_();
  var accounts = [
    { name: 'Operating', balance: 500, type: Config.ACCOUNT_TYPES.CASH, forecast: true },
    { name: 'Card', balance: -150, type: Config.ACCOUNT_TYPES.CREDIT, forecast: true },
  ];
  var events = [
    {
      date: anchor,
      kind: 'Transfer',
      behavior: Config.TRANSFER_TYPES.REPAYMENT_ALL,
      transferBehavior: Config.TRANSFER_TYPES.REPAYMENT_ALL,
      name: 'Pay Card',
      from: 'Operating',
      to: 'Card',
      amount: 0,
    },
  ];
  var journal = CoreApplyEvents.buildJournalRows({
    accounts: accounts,
    events: events,
    policies: [],
    riskSettings: [],
    scenarioId: Config.SCENARIOS.DEFAULT,
  });
  assertFixtureBalances_(journal, { Operating: 350, Card: 0 });
  return 'Fixture D passed';
}

function runDeterministicFixtureTestsPhase2_FixtureE() {
  resetFixtureRunState_();
  var anchor = fixtureAnchorDate_();
  var accounts = [
    { name: 'Cash', balance: 100, type: Config.ACCOUNT_TYPES.CASH, forecast: true },
    { name: 'Savings', balance: 300, type: Config.ACCOUNT_TYPES.CASH, forecast: true },
  ];
  var events = [
    {
      date: anchor,
      kind: 'Expense',
      behavior: 'Expense',
      name: 'Bills',
      from: 'Cash',
      amount: 150,
    },
  ];
  var policies = [
    {
      type: Config.POLICY_TYPES.AUTO_DEFICIT_COVER,
      name: 'Cover Cash',
      triggerAccount: 'Cash',
      fundingAccount: 'Savings',
      threshold: 0,
      maxPerEvent: null,
      priority: 1,
      startDate: anchor,
      endDate: addDays_(anchor, 1),
    },
  ];
  var journal = CoreApplyEvents.buildJournalRows({
    accounts: accounts,
    events: events,
    policies: policies,
    riskSettings: [],
    scenarioId: Config.SCENARIOS.DEFAULT,
  });
  assertFixtureBalances_(journal, { Cash: 0, Savings: 250 });
  var hasAutoCover = journal.rows.some(function (row) {
    return String(row[7] || '').indexOf('AUTO_DEFICIT_COVER') !== -1;
  });
  assertFixtureEqual_('Fixture E auto cover alert', true, hasAutoCover);
  return 'Fixture E passed';
}

function fixtureAnchorDate_() {
  var window = getForecastWindow_();
  var today = normalizeDate_(new Date());
  return window.start > today ? window.start : today;
}

function assertFixtureBalances_(journal, expectedByAccount) {
  if (!journal || !Array.isArray(journal.rows) || !journal.rows.length) {
    throw new Error('Fixture assertion failed: no journal rows.');
  }
  var snapshotStart = 7;
  var lastRow = journal.rows[journal.rows.length - 1];
  Object.keys(expectedByAccount).forEach(function (accountName) {
    var idx = (journal.forecastAccounts || []).indexOf(accountName);
    if (idx === -1) {
      throw new Error('Fixture assertion failed: missing forecast account "' + accountName + '".');
    }
    var actual = roundUpCents_(lastRow[snapshotStart + idx] || 0);
    var expected = roundUpCents_(expectedByAccount[accountName]);
    if (actual !== expected) {
      throw new Error(
        'Fixture assertion failed for "' +
          accountName +
          '". Expected ' +
          expected +
          ', got ' +
          actual +
          '.'
      );
    }
  });
}

function assertFixtureEqual_(label, expected, actual) {
  if (expected !== actual) {
    throw new Error(label + ' expected "' + expected + '" but got "' + actual + '".');
  }
}

function resetFixtureRunState_() {
  if (typeof resetRunState_ === 'function') {
    resetRunState_();
  }
}

