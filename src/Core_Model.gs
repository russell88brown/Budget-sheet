// Domain core model helpers used by compile/apply modules.
const CoreModel = {
  normalizeMoney: function (value) {
    return roundUpCents_(value || 0);
  },

  normalizeDate: function (value) {
    return normalizeDate_(value || new Date());
  },

  normalizeCompiledEvent: function (event, index) {
    var source = event || {};
    var normalized = {};
    Object.keys(source).forEach(function (key) {
      normalized[key] = source[key];
    });

    normalized.id = source.id || ('evt_' + String(index || 0));
    normalized.date = CoreModel.normalizeDate(source.date);
    normalized.scenarioId = normalizeScenario_(source.scenarioId);
    normalized.kind = source.kind || '';
    normalized.behavior = source.behavior || '';
    normalized.name = source.name || '';
    normalized.category = source.category || '';
    normalized.from = source.from || '';
    normalized.to = source.to || '';
    normalized.account = source.account || '';
    normalized.amount = CoreModel.normalizeMoney(source.amount);
    if (normalized.transferBehavior === undefined || normalized.transferBehavior === null) {
      normalized.transferBehavior = source.transferBehavior || source.behavior || '';
    }
    if (normalized.memo === undefined || normalized.memo === null) {
      normalized.memo = source.memo || '';
    }
    return normalized;
  },
};

