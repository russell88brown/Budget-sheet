// Deterministic fixture tests for the domain-core compile/apply flow.
function getDeterministicFixtureTestSpecs_() {
  return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map(function (id) {
    return fixtureSpecById_(id);
  });
}

function runDeterministicFixtureTests_All() {
  return getDeterministicFixtureTestSpecs_().map(function (fixture) {
    return fixture.run();
  });
}

// Golden parity fixture pinned for migration merge gating.
function runDeterministicFixtureTests_GoldenScenario() {
  return runDeterministicFixtureTests_FixtureI();
}

function runDeterministicFixtureTests_FixtureA() {
  resetFixtureRunState_();
  var anchor = fixtureAnchorDate_();
  var model = fixtureModel_({
    accounts: [
      fixtureAccount_('Operating', 1000, Config.ACCOUNT_TYPES.CASH),
      fixtureAccount_('Card', -500, Config.ACCOUNT_TYPES.CREDIT),
    ],
    incomeRules: [
      {
        scenarioId: Config.SCENARIOS.DEFAULT,
        ruleId: 'INC_FIX_A_PAYCHECK',
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
        ruleId: 'EXP_FIX_A_RENT',
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
        ruleId: 'TRN_FIX_A_CARD_PAYMENT',
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
  });
  var compiled = compileAndApplyFixtureModel_(model);
  var events = compiled.events;
  var journal = compiled.journal;
  assertFixtureEqual_('Fixture A event count', 3, events.length);
  assertFixtureEqual_('Fixture A row count', 6, journal.rows.length);
  assertFixtureBalances_(journal, { Operating: 1300, Card: -300 });
  assertJournalSourceRuleIdsPresent_(journal, [
    'INC_FIX_A_PAYCHECK',
    'EXP_FIX_A_RENT',
    'TRN_FIX_A_CARD_PAYMENT',
  ]);
  return 'Fixture A passed';
}

function runDeterministicFixtureTests_FixtureB() {
  resetFixtureRunState_();
  var anchor = fixtureAnchorDate_();
  var nextDay = addDays_(anchor, 1);
  var model = fixtureModel_({
    accounts: [fixtureAccount_('Wallet', 0, Config.ACCOUNT_TYPES.CASH)],
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
  });
  var events = compileAndApplyFixtureModel_(model).events;
  assertFixtureEqual_('Fixture B event count', 2, events.length);
  assertFixtureEqual_('Fixture B first event name', 'Gift', events[0].name);
  assertFixtureEqual_('Fixture B second event name', 'Bonus', events[1].name);
  return 'Fixture B passed';
}

function runDeterministicFixtureTests_FixtureC() {
  resetFixtureRunState_();
  var anchor = fixtureAnchorDate_();
  var accounts = [
    fixtureAccount_('Checking', 1000, Config.ACCOUNT_TYPES.CASH),
    fixtureAccount_('Vault', 0, Config.ACCOUNT_TYPES.CASH),
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
  var journal = applyFixtureEvents_(accounts, events, [], Config.SCENARIOS.DEFAULT);
  assertFixtureBalances_(journal, { Checking: 200, Vault: 800 });
  return 'Fixture C passed';
}

function runDeterministicFixtureTests_FixtureD() {
  resetFixtureRunState_();
  var anchor = fixtureAnchorDate_();
  var accounts = [
    fixtureAccount_('Operating', 500, Config.ACCOUNT_TYPES.CASH),
    fixtureAccount_('Card', -150, Config.ACCOUNT_TYPES.CREDIT),
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
  var journal = applyFixtureEvents_(accounts, events, [], Config.SCENARIOS.DEFAULT);
  assertFixtureBalances_(journal, { Operating: 350, Card: 0 });
  return 'Fixture D passed';
}

function runDeterministicFixtureTests_FixtureE() {
  resetFixtureRunState_();
  var anchor = fixtureAnchorDate_();
  var accounts = [
    fixtureAccount_('Cash', 100, Config.ACCOUNT_TYPES.CASH),
    fixtureAccount_('Savings', 300, Config.ACCOUNT_TYPES.CASH),
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
  var journal = applyFixtureEvents_(accounts, events, policies, Config.SCENARIOS.DEFAULT);
  assertFixtureBalances_(journal, { Cash: 0, Savings: 250 });
  var hasAutoCover = journal.rows.some(function (row) {
    return String(row[7] || '').indexOf('AUTO_DEFICIT_COVER') !== -1;
  });
  assertFixtureEqual_('Fixture E auto cover alert', true, hasAutoCover);
  return 'Fixture E passed';
}

function runDeterministicFixtureTests_FixtureF() {
  var rows = [
    [null, null, null, null, null, -120, 'EXP:RENT', 'NEGATIVE_CASH'],
    [null, null, null, null, null, -25, 'EXP:RENT', 'NEGATIVE_CASH'],
    [null, null, null, null, null, -60, 'EXP:GROCERIES', 'NEGATIVE_CASH | AUTO_DEFICIT_COVER'],
    [null, null, null, null, null, 35, 'INC:TOPUP', 'NEGATIVE_CASH'],
    [null, null, null, null, null, -40, '', 'NEGATIVE_CASH'],
    [null, null, null, null, null, 150, 'INC:SALARY', ''],
  ];
  var top = summarizeNegativeCashTopSourcesFromRows_(
    rows,
    7, // Alerts
    5, // Amount
    6 // Source Rule ID
  );
  assertFixtureEqual_('Fixture F top count', 3, top.length);
  assertFixtureEqual_('Fixture F top #1 id', 'EXP:RENT', top[0][0]);
  assertFixtureEqual_('Fixture F top #1 amount', 145, top[0][1]);
  assertFixtureEqual_('Fixture F top #1 events', 2, top[0][2]);
  assertFixtureEqual_('Fixture F top #2 id', 'EXP:GROCERIES', top[1][0]);
  assertFixtureEqual_('Fixture F top #2 amount', 60, top[1][1]);
  assertFixtureEqual_('Fixture F top #3 id', '(Unattributed)', top[2][0]);
  assertFixtureEqual_('Fixture F top #3 amount', 40, top[2][1]);
  assertFixtureEqual_('Fixture F excludes inflow on negative-cash row', false, !!top.filter(function (item) {
    return item[0] === 'INC:TOPUP';
  }).length);
  return 'Fixture F passed';
}

function runDeterministicFixtureTests_FixtureG() {
  var anchor = fixtureAnchorDate_();
  var events = [
    { date: anchor, kind: 'Transfer', behavior: Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT, transferBehavior: Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT, name: 'Sweep', sourceRuleId: 'TRN:SWEEP', amount: 100 },
    { date: anchor, kind: 'Expense', behavior: 'Fixed', name: 'Expense', sourceRuleId: 'EXP:RENT', amount: 50 },
    { date: anchor, kind: 'Transfer', behavior: Config.TRANSFER_TYPES.REPAYMENT_ALL, transferBehavior: Config.TRANSFER_TYPES.REPAYMENT_ALL, name: 'Repay all', sourceRuleId: 'TRN:REPAY_ALL', amount: 0 },
    { date: anchor, kind: 'Interest', interestAccrual: true, name: 'Interest Accrual', sourceRuleId: 'INT:ACCRUAL', amount: 0 },
    { date: anchor, kind: 'Transfer', behavior: Config.TRANSFER_TYPES.TRANSFER_AMOUNT, transferBehavior: Config.TRANSFER_TYPES.TRANSFER_AMOUNT, name: 'Transfer amount', sourceRuleId: 'TRN:TRANSFER_AMOUNT', amount: 25 },
    { date: anchor, kind: 'Transfer', behavior: Config.TRANSFER_TYPES.REPAYMENT_AMOUNT, transferBehavior: Config.TRANSFER_TYPES.REPAYMENT_AMOUNT, name: 'Repay amount', sourceRuleId: 'TRN:REPAY_AMOUNT', amount: 20 },
    { date: anchor, kind: 'Income', behavior: 'Salary', name: 'Income', sourceRuleId: 'INC:SALARY', amount: 100 },
    { date: anchor, kind: 'Interest', interestAccrual: false, name: 'Interest', sourceRuleId: 'INT:POST', amount: 0 },
  ];
  var sorted = CoreCompileRules.sortEvents(events);
  var order = sorted.map(function (event) {
    return String(event.sourceRuleId || '');
  });
  assertFixtureSequenceEqual_(
    'Fixture G order',
    ['INC:SALARY', 'TRN:TRANSFER_AMOUNT', 'TRN:REPAY_AMOUNT', 'TRN:REPAY_ALL', 'EXP:RENT', 'INT:ACCRUAL', 'INT:POST', 'TRN:SWEEP'],
    order
  );

  var tieBreakEvents = [
    { date: anchor, kind: 'Income', behavior: 'Salary', name: 'Paycheck', sourceRuleId: 'INC:Z', amount: 100 },
    { date: anchor, kind: 'Income', behavior: 'Salary', name: 'Paycheck', sourceRuleId: 'INC:A', amount: 100 },
  ];
  var tieSorted = CoreCompileRules.sortEvents(tieBreakEvents);
  assertFixtureEqual_('Fixture G tie-break #1', 'INC:A', tieSorted[0].sourceRuleId);
  assertFixtureEqual_('Fixture G tie-break #2', 'INC:Z', tieSorted[1].sourceRuleId);

  return 'Fixture G passed';
}

function runDeterministicFixtureTests_FixtureH() {
  resetFixtureRunState_();
  var anchor = fixtureAnchorDate_();
  var model = fixtureModel_({
    accounts: [fixtureAccount_('Cash', 200, Config.ACCOUNT_TYPES.CASH)],
    expenseRules: [
      {
        scenarioId: Config.SCENARIOS.DEFAULT,
        ruleId: 'EXP_FIX_H_INVALID_FROM',
        type: 'Bills',
        name: 'Invalid Expense',
        amount: 100,
        frequency: Config.FREQUENCIES.ONCE,
        repeatEvery: 1,
        startDate: anchor,
        endDate: anchor,
        paidFrom: '',
      },
    ],
  });
  var compiled = compileAndApplyFixtureModel_(model);
  var events = compiled.events;
  var journal = compiled.journal;
  assertFixtureEqual_('Fixture H event count', 0, events.length);
  assertFixtureEqual_('Fixture H row count', 1, journal.rows.length);
  assertFixtureBalances_(journal, { Cash: 200 });
  return 'Fixture H passed';
}

function runDeterministicFixtureTests_FixtureI() {
  resetFixtureRunState_();
  var anchor = fixtureAnchorDate_();
  var model = fixtureModel_({
    accounts: [
      fixtureAccount_('Operating', 0, Config.ACCOUNT_TYPES.CASH),
      fixtureAccount_('Sink', 0, Config.ACCOUNT_TYPES.CASH),
      fixtureAccount_('Card', -1000, Config.ACCOUNT_TYPES.CREDIT),
    ],
    incomeRules: [
      {
        scenarioId: Config.SCENARIOS.DEFAULT,
        ruleId: 'INC_FIX_I_PAY',
        type: 'Salary',
        name: 'Pay',
        amount: 1000,
        frequency: Config.FREQUENCIES.MONTHLY,
        repeatEvery: 1,
        startDate: anchor,
        endDate: addDays_(anchor, 59),
        paidTo: 'Operating',
      },
    ],
    transferRules: [
      {
        scenarioId: Config.SCENARIOS.DEFAULT,
        ruleId: 'TRN_FIX_I_SWEEP',
        type: Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT,
        behavior: Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT,
        name: 'Sweep',
        amount: 100,
        frequency: Config.FREQUENCIES.MONTHLY,
        repeatEvery: 1,
        startDate: anchor,
        endDate: addDays_(anchor, 59),
        paidFrom: 'Operating',
        paidTo: 'Sink',
      },
      {
        scenarioId: Config.SCENARIOS.DEFAULT,
        ruleId: 'TRN_FIX_I_REPAY',
        type: Config.TRANSFER_TYPES.REPAYMENT_ALL,
        behavior: Config.TRANSFER_TYPES.REPAYMENT_ALL,
        name: 'Repay Card',
        amount: 0,
        frequency: Config.FREQUENCIES.MONTHLY,
        repeatEvery: 1,
        startDate: anchor,
        endDate: addDays_(anchor, 59),
        paidFrom: 'Sink',
        paidTo: 'Card',
      },
    ],
  });
  var journal = compileAndApplyFixtureModel_(model).journal;
  assertFixtureBalances_(journal, { Operating: 100, Sink: 900, Card: 0 });
  return 'Fixture I passed';
}

function fixtureSpecById_(id) {
  var handler = 'runDeterministicFixtureTests_Fixture' + id;
  var run = globalThis[handler];
  if (typeof run !== 'function') {
    throw new Error('Fixture handler missing: ' + handler);
  }
  return { name: 'Fixture ' + id, handler: handler, run: run };
}

function fixtureAccount_(name, balance, type) {
  return { name: name, balance: balance, type: type, forecast: true };
}

function fixtureModel_(overrides) {
  var base = {
    scenarioId: Config.SCENARIOS.DEFAULT,
    accounts: [],
    incomeRules: [],
    expenseRules: [],
    transferRules: [],
    policies: [],
  };
  var patch = overrides || {};
  return {
    scenarioId: patch.scenarioId || base.scenarioId,
    accounts: patch.accounts || base.accounts,
    incomeRules: patch.incomeRules || base.incomeRules,
    expenseRules: patch.expenseRules || base.expenseRules,
    transferRules: patch.transferRules || base.transferRules,
    policies: patch.policies || base.policies,
  };
}

function applyFixtureEvents_(accounts, events, policies, scenarioId) {
  return CoreApplyEvents.applyEventsToJournal({
    accounts: accounts || [],
    events: events || [],
    policies: policies || [],
    scenarioId: scenarioId || Config.SCENARIOS.DEFAULT,
  });
}

function compileAndApplyFixtureModel_(model) {
  var active = fixtureModel_(model);
  var events = CoreCompileRules.buildSortedEvents(active);
  return {
    events: events,
    journal: applyFixtureEvents_(active.accounts, events, active.policies, active.scenarioId),
  };
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
  var snapshotStart = 8;
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

function assertFixtureSequenceEqual_(label, expected, actual) {
  var expectedList = Array.isArray(expected) ? expected : [];
  var actualList = Array.isArray(actual) ? actual : [];
  assertFixtureEqual_(label + ' length', expectedList.length, actualList.length);
  expectedList.forEach(function (item, idx) {
    assertFixtureEqual_(label + ' #' + (idx + 1), item, actualList[idx]);
  });
}

function assertJournalSourceRuleIdsPresent_(journal, expectedRuleIds) {
  if (!journal || !Array.isArray(journal.rows) || !journal.rows.length) {
    throw new Error('Fixture assertion failed: no journal rows for source-rule checks.');
  }
  var expected = Array.isArray(expectedRuleIds) ? expectedRuleIds.slice() : [];
  var seen = {};

  journal.rows.forEach(function (row) {
    var transactionType = String(row[3] || '');
    if (transactionType === 'Opening') {
      return;
    }
    var sourceRuleId = String(row[6] || '').trim();
    if (!sourceRuleId) {
      throw new Error('Fixture assertion failed: missing Source Rule ID on non-opening row.');
    }
    seen[sourceRuleId] = true;
  });

  expected.forEach(function (ruleId) {
    if (!seen[ruleId]) {
      throw new Error('Fixture assertion failed: expected Source Rule ID "' + ruleId + '" not found.');
    }
  });
}

function resetFixtureRunState_() {
  if (typeof resetRunState_ === 'function') {
    resetRunState_();
  }
}


