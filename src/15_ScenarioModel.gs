// Builds a single scenario-sliced model shared by run pipelines.
const ScenarioModel = {
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
      policies: filterScenarioRowsForModel_(Readers.readPolicies(), activeScenarioId),
      goals: filterScenarioRowsForModel_(Readers.readGoals(), activeScenarioId),
      riskSettings: filterScenarioRowsForModel_(Readers.readRiskSettings(), activeScenarioId),
    };
  },
};

function buildScenarioModel_(scenarioId) {
  return ScenarioModel.build(scenarioId);
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
