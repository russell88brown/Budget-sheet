// Builds a single run model shared by run pipelines.
// Core model scope is Accounts + Income + Transfers + Expenses.
const CoreRunModel = {
  build: function (scenarioId) {
    var api = typedRunModelApi_();
    if (api && typeof api.buildRunModel === 'function') {
      return api.buildRunModel(
        scenarioId,
        runModelSources_(),
        normalizeScenario_,
        Config.SCENARIOS.DEFAULT
      );
    }
    var activeScenarioId = normalizeScenario_(scenarioId);
    var accounts = filterScenarioRowsForModel_(Readers.readAccounts(), activeScenarioId)
      .filter(function (account) {
        return account && account.name;
      });
    return {
      scenarioId: activeScenarioId,
      accounts: accounts,
      incomeRules: filterScenarioRowsForModel_(Readers.readIncome(), activeScenarioId),
      transferRules: filterScenarioRowsForModel_(Readers.readTransfers(), activeScenarioId),
      expenseRules: filterScenarioRowsForModel_(Readers.readExpenses(), activeScenarioId),
    };
  },

  withExtensions: function (scenarioId) {
    var api = typedRunModelApi_();
    if (api && typeof api.buildRunModelWithExtensions === 'function') {
      return api.buildRunModelWithExtensions(
        scenarioId,
        runModelSources_(),
        normalizeScenario_,
        Config.SCENARIOS.DEFAULT
      );
    }
    var model = CoreRunModel.build(scenarioId);
    model.policies = filterScenarioRowsForModel_(Readers.readPolicies(), model.scenarioId);
    model.goals = filterScenarioRowsForModel_(Readers.readGoals(), model.scenarioId);
    return model;
  },
};

function buildRunModel_(scenarioId) {
  return CoreRunModel.build(scenarioId);
}

function buildRunModelWithExtensions_(scenarioId) {
  return CoreRunModel.withExtensions(scenarioId);
}

function filterScenarioRowsForModel_(rows, scenarioId) {
  var api = typedRunModelApi_();
  if (api && typeof api.filterScenarioRowsForModel === 'function') {
    return api.filterScenarioRowsForModel(rows, scenarioId, normalizeScenario_, Config.SCENARIOS.DEFAULT);
  }
  if (!Array.isArray(rows) || !rows.length) {
    return [];
  }
  var activeScenarioId = normalizeScenario_(scenarioId);
  return rows.filter(function (row) {
    var rowScenarioId = row ? normalizeScenario_(row.scenarioId) : Config.SCENARIOS.DEFAULT;
    return rowScenarioId === activeScenarioId;
  });
}

function runModelSources_() {
  return {
    accounts: Readers.readAccounts(),
    incomeRules: Readers.readIncome(),
    transferRules: Readers.readTransfers(),
    expenseRules: Readers.readExpenses(),
    policies: Readers.readPolicies(),
    goals: Readers.readGoals(),
  };
}

function typedRunModelApi_() {
  var container = typeof TypedBudget !== 'undefined' && TypedBudget ? TypedBudget : null;
  if (container && container.TypedBudget && typeof container.TypedBudget === 'object') {
    container = container.TypedBudget;
  }
  return container;
}
