// Optional extension adapter for non-core run features.
// Core remains Accounts + Income + Transfers + Expenses + Journal math.
const RunExtensions = {
  build: function (runModelWithExtensions) {
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
