// Builds a single run model shared by run pipelines.
// Core model scope is Accounts + Income + Transfers + Expenses.
const CoreRunModel = {
  build: function (scenarioId) {
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
  if (!Array.isArray(rows) || !rows.length) {
    return [];
  }
  var activeScenarioId = normalizeScenario_(scenarioId);
  return rows.filter(function (row) {
    var rowScenarioId = row ? normalizeScenario_(row.scenarioId) : Config.SCENARIOS.DEFAULT;
    return rowScenarioId === activeScenarioId;
  });
}
