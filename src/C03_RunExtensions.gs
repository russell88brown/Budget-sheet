// Optional extension adapter for non-core run features.
// Core remains Accounts + Income + Transfers + Expenses + Journal math.
const RunExtensions = {
  build: function (runModelWithExtensions) {
    var api = typedRunExtensionsApi_();
    if (api && typeof api.buildRunExtensions === 'function') {
      return api.buildRunExtensions(runModelWithExtensions || {});
    }
    var model = runModelWithExtensions || {};
    return {
      // Policy-driven auto-deficit cover remains optional extension behavior.
      policies: Array.isArray(model.policies) ? model.policies : [],
      // Goals currently do not mutate journal math.
      goals: Array.isArray(model.goals) ? model.goals : [],
    };
  },
};

function buildRunExtensions_(runModelWithExtensions) {
  return RunExtensions.build(runModelWithExtensions);
}

function typedRunExtensionsApi_() {
  var container = typeof TypedBudget !== 'undefined' && TypedBudget ? TypedBudget : null;
  if (container && container.TypedBudget && typeof container.TypedBudget === 'object') {
    container = container.TypedBudget;
  }
  return container;
}
