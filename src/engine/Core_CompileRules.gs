// Domain core: compile scenario rules into a single sorted event stream.
const CoreCompileRules = {
  buildEventsForScenarioModel: function (scenarioModel) {
    var model = scenarioModel || {};
    var accounts = model.accounts || [];
    var incomeRules = model.incomeRules || [];
    var transferRules = model.transferRules || [];
    var expenseRules = model.expenseRules || [];

    return Events.buildIncomeEvents(incomeRules)
      .concat(Events.buildTransferEvents(transferRules))
      .concat(Events.buildExpenseEvents(expenseRules))
      .concat(Events.buildInterestEvents(accounts));
  },

  sortEvents: function (events) {
    var list = Array.isArray(events)
      ? events.map(function (event, idx) {
          return CoreModel.normalizeCompiledEvent(event, idx + 1);
        })
      : [];
    list.sort(compareCompiledEvents_);
    return list;
  },

  buildSortedEventsForScenarioModel: function (scenarioModel) {
    return CoreCompileRules.sortEvents(
      CoreCompileRules.buildEventsForScenarioModel(scenarioModel)
    );
  },
};

function compareCompiledEvents_(a, b) {
  var dateDiff = normalizeDate_(a.date).getTime() - normalizeDate_(b.date).getTime();
  if (dateDiff !== 0) {
    return dateDiff;
  }
  var priorityDiff = eventSortPriority_(a) - eventSortPriority_(b);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }
  var nameA = a.name || '';
  var nameB = b.name || '';
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  return 0;
}
