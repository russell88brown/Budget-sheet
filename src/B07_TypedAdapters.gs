// Typed adapter bridge. Uses generated TypedBudget API when available.

function typedBudgetApi_() {
  return typeof TypedBudget !== 'undefined' ? TypedBudget : null;
}

function normalizeTagTyped_(value) {
  var api = typedBudgetApi_();
  if (api && typeof api.normalizeTag === 'function') {
    return api.normalizeTag(value);
  }
  var fallback = Config.SCENARIOS.DEFAULT;
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }
  var cleaned = String(value).trim();
  if (!cleaned) {
    return fallback;
  }
  if (cleaned.toLowerCase() === String(fallback).toLowerCase()) {
    return fallback;
  }
  return cleaned;
}

function toBooleanTyped_(value) {
  var api = typedBudgetApi_();
  if (api && typeof api.toBoolean === 'function') {
    return api.toBoolean(value);
  }
  return value === true || value === 'TRUE' || value === 'true' || value === 1;
}

function toNumberTyped_(value) {
  var api = typedBudgetApi_();
  if (api && typeof api.toNumber === 'function') {
    return api.toNumber(value);
  }
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  var num = Number(value);
  return isNaN(num) ? null : num;
}

function toDateTyped_(value) {
  var api = typedBudgetApi_();
  if (api && typeof api.toDate === 'function') {
    return api.toDate(value);
  }
  if (!value) {
    return null;
  }
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return value;
  }
  var parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function toPositiveIntTyped_(value) {
  var api = typedBudgetApi_();
  if (api && typeof api.toPositiveInt === 'function') {
    return api.toPositiveInt(value);
  }
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  var num = Number(value);
  if (!isFinite(num)) {
    return null;
  }
  if (num < 1) {
    return null;
  }
  return Math.floor(num);
}

function normalizeFrequencyTyped_(value) {
  var api = typedBudgetApi_();
  if (api && typeof api.normalizeFrequency === 'function') {
    return api.normalizeFrequency(value, Config.FREQUENCIES);
  }

  if (!value) {
    return { frequency: value, repeatEvery: null, isSingleOccurrence: false };
  }

  var cleaned = String(value).trim();
  var lower = cleaned.toLowerCase();

  if (lower === 'daily') {
    return { frequency: Config.FREQUENCIES.DAILY, repeatEvery: null, isSingleOccurrence: false };
  }
  if (lower === 'once' || lower === 'one-off' || lower === 'one off') {
    return { frequency: Config.FREQUENCIES.ONCE, repeatEvery: 1, isSingleOccurrence: true };
  }
  if (lower === 'weekly') {
    return { frequency: Config.FREQUENCIES.WEEKLY, repeatEvery: null, isSingleOccurrence: false };
  }
  if (lower === 'monthly') {
    return { frequency: Config.FREQUENCIES.MONTHLY, repeatEvery: null, isSingleOccurrence: false };
  }
  if (lower === 'yearly' || lower === 'annually') {
    return {
      frequency: Config.FREQUENCIES.YEARLY,
      repeatEvery: lower === 'annually' ? 1 : null,
      isSingleOccurrence: false,
    };
  }
  return { frequency: cleaned, repeatEvery: null, isSingleOccurrence: false };
}

function normalizeRecurrenceTyped_(frequencyValue, repeatEveryValue, startDateValue, endDateValue) {
  var api = typedBudgetApi_();
  if (api && typeof api.normalizeRecurrence === 'function') {
    return api.normalizeRecurrence(
      frequencyValue,
      repeatEveryValue,
      startDateValue,
      endDateValue,
      Config.FREQUENCIES
    );
  }

  var startDate = toDateTyped_(startDateValue);
  var endDate = toDateTyped_(endDateValue);
  var normalized = normalizeFrequencyTyped_(frequencyValue);
  var repeatEvery = normalized.repeatEvery || toPositiveIntTyped_(repeatEveryValue) || 1;

  if (normalized.isSingleOccurrence && startDate && !endDate) {
    endDate = startDate;
  }

  return {
    frequency: normalized.frequency,
    repeatEvery: repeatEvery,
    isSingleOccurrence: normalized.isSingleOccurrence,
    startDate: startDate,
    endDate: endDate,
  };
}

function normalizeTransferTypeTyped_(value, amountValue) {
  var api = typedBudgetApi_();
  if (api && typeof api.normalizeTransferType === 'function') {
    return api.normalizeTransferType(value, amountValue, Config.TRANSFER_TYPES);
  }
  if (value === null || value === undefined) {
    return value;
  }
  var cleaned = String(value).trim();
  if (!cleaned) {
    return cleaned;
  }
  var lower = cleaned.toLowerCase();
  if (lower === String(Config.TRANSFER_TYPES.REPAYMENT_AMOUNT).toLowerCase()) {
    return Config.TRANSFER_TYPES.REPAYMENT_AMOUNT;
  }
  if (lower === String(Config.TRANSFER_TYPES.REPAYMENT_ALL).toLowerCase()) {
    return Config.TRANSFER_TYPES.REPAYMENT_ALL;
  }
  if (lower === String(Config.TRANSFER_TYPES.TRANSFER_AMOUNT).toLowerCase()) {
    return Config.TRANSFER_TYPES.TRANSFER_AMOUNT;
  }
  if (lower === String(Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT).toLowerCase()) {
    return Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT;
  }

  if (lower === 'repayment') {
    var amount = toNumberTyped_(amountValue);
    if (amount === 0) {
      return Config.TRANSFER_TYPES.REPAYMENT_ALL;
    }
    return Config.TRANSFER_TYPES.REPAYMENT_AMOUNT;
  }
  if (lower === 'transfer') {
    return Config.TRANSFER_TYPES.TRANSFER_AMOUNT;
  }

  return cleaned;
}

function normalizePolicyTypeTyped_(value) {
  var api = typedBudgetApi_();
  if (api && typeof api.normalizePolicyType === 'function') {
    return api.normalizePolicyType(value, Config.POLICY_TYPES);
  }
  if (value === null || value === undefined) {
    return value;
  }
  var cleaned = String(value).trim();
  if (!cleaned) {
    return cleaned;
  }
  var lower = cleaned.toLowerCase();
  if (lower === String(Config.POLICY_TYPES.AUTO_DEFICIT_COVER).toLowerCase()) {
    return Config.POLICY_TYPES.AUTO_DEFICIT_COVER;
  }
  return cleaned;
}

function buildSourceRuleIdTyped_(prefix, source, fallbackName) {
  var api = typedBudgetApi_();
  if (api && typeof api.buildSourceRuleId === 'function') {
    return api.buildSourceRuleId(prefix, source || {}, fallbackName);
  }
  var explicit = source && source.ruleId ? String(source.ruleId).trim() : '';
  if (explicit) {
    return explicit;
  }
  var name = fallbackName ? String(fallbackName).trim() : '';
  if (!name) {
    return prefix + ':UNKNOWN';
  }
  return prefix + ':' + name.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function eventBuilderContextTyped_() {
  return {
    expandRecurrence: function (options) {
      return Recurrence.expand(options || {});
    },
    frequencies: { DAILY: Config.FREQUENCIES.DAILY },
    behaviorLabels: { Expense: Config.BEHAVIOR_LABELS.Expense },
    buildSourceRuleId: function (prefix, source, fallbackName) {
      return buildSourceRuleIdTyped_(prefix, source, fallbackName);
    },
    getForecastWindow: function () {
      return getForecastWindow_();
    },
  };
}

function buildIncomeEventsTyped_(incomeRules) {
  var api = typedBudgetApi_();
  if (api && typeof api.buildIncomeEvents === 'function') {
    return api.buildIncomeEvents(incomeRules || [], eventBuilderContextTyped_());
  }
  return null;
}

function buildExpenseEventsTyped_(expenseRules) {
  var api = typedBudgetApi_();
  if (api && typeof api.buildExpenseEvents === 'function') {
    return api.buildExpenseEvents(expenseRules || [], eventBuilderContextTyped_());
  }
  return null;
}

function buildTransferEventsTyped_(transferRules) {
  var api = typedBudgetApi_();
  if (api && typeof api.buildTransferEvents === 'function') {
    return api.buildTransferEvents(transferRules || [], eventBuilderContextTyped_());
  }
  return null;
}

function buildInterestEventsTyped_(accounts) {
  var api = typedBudgetApi_();
  if (api && typeof api.buildInterestEvents === 'function') {
    return api.buildInterestEvents(accounts || [], eventBuilderContextTyped_());
  }
  return null;
}

function normalizeActionsTyped_(actions) {
  var api = typedBudgetApi_();
  if (api && typeof api.normalizeActions === 'function') {
    return api.normalizeActions(actions || []);
  }
  var values = Array.isArray(actions)
    ? actions.map(function (value) { return String(value || '').toLowerCase(); })
    : [];
  var seen = {};
  var result = [];
  values.forEach(function (value) {
    if (!value || seen[value]) {
      return;
    }
    if (
      value !== 'summarise_accounts' &&
      value !== 'journal' &&
      value !== 'daily' &&
      value !== 'monthly' &&
      value !== 'dashboard'
    ) {
      throw new Error('Unknown action type.');
    }
    seen[value] = true;
    result.push(value);
  });
  if (!result.length) {
    throw new Error('Select at least one action.');
  }
  return result;
}

function selectRunTagsTyped_(availableValues, selectedValues) {
  var api = typedBudgetApi_();
  if (api && typeof api.selectRunTags === 'function') {
    return api.selectRunTags(availableValues || [], selectedValues || []);
  }
  var available = (availableValues || []).map(function (value) {
    return normalizeTagTyped_(value);
  });
  if (available.indexOf(Config.SCENARIOS.DEFAULT) === -1) {
    available.push(Config.SCENARIOS.DEFAULT);
  }
  var selected = (selectedValues || []).map(function (value) {
    return normalizeTagTyped_(value);
  });
  selected.push(Config.SCENARIOS.DEFAULT);
  selected = selected.filter(function (value, idx, arr) {
    return value && arr.indexOf(value) === idx;
  });
  selected.forEach(function (tagId) {
    if (available.indexOf(tagId) === -1) {
      throw new Error('Unknown tag "' + tagId + '".');
    }
  });
  return selected;
}

function getTagColumnIndexTyped_(headers) {
  var api = typedBudgetApi_();
  if (api && typeof api.getTagColumnIndex === 'function') {
    return api.getTagColumnIndex(headers || []);
  }
  if (!headers || !headers.length) {
    return -1;
  }
  var tagIdx = headers.indexOf('Tag');
  if (tagIdx !== -1) {
    return tagIdx;
  }
  return headers.indexOf('Scenario');
}

function normalizeDateTyped_(value) {
  var api = typedBudgetApi_();
  if (api && typeof api.normalizeDate === 'function') {
    return api.normalizeDate(value);
  }
  var date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDaysTyped_(date, days) {
  var api = typedBudgetApi_();
  if (api && typeof api.addDays === 'function') {
    return api.addDays(date, days);
  }
  var next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

function addMonthsClampedTyped_(date, months) {
  var api = typedBudgetApi_();
  if (api && typeof api.addMonthsClamped === 'function') {
    return api.addMonthsClamped(date, months);
  }
  var year = date.getFullYear();
  var monthIndex = date.getMonth() + months;
  var day = date.getDate();
  var targetYear = year + Math.floor(monthIndex / 12);
  var targetMonth = monthIndex % 12;
  if (targetMonth < 0) {
    targetMonth += 12;
    targetYear -= 1;
  }
  var lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  var clampedDay = Math.min(day, lastDay);
  return new Date(targetYear, targetMonth, clampedDay);
}

function normalizeRepeatEveryTyped_(repeatEvery) {
  var api = typedBudgetApi_();
  if (api && typeof api.normalizeRepeatEvery === 'function') {
    return api.normalizeRepeatEvery(repeatEvery);
  }
  var raw = Number(repeatEvery);
  if (!isFinite(raw) || raw < 1) {
    return 1;
  }
  return Math.floor(raw);
}

function getStepMonthsTyped_(frequency, repeatEvery) {
  var api = typedBudgetApi_();
  if (api && typeof api.getStepMonths === 'function') {
    return api.getStepMonths(frequency, repeatEvery, Config.FREQUENCIES);
  }
  var every = normalizeRepeatEveryTyped_(repeatEvery);
  if (frequency === Config.FREQUENCIES.MONTHLY) {
    return every;
  }
  if (frequency === Config.FREQUENCIES.YEARLY) {
    return every * 12;
  }
  return null;
}

function getStepDaysTyped_(frequency, repeatEvery) {
  var api = typedBudgetApi_();
  if (api && typeof api.getStepDays === 'function') {
    return api.getStepDays(frequency, repeatEvery, Config.FREQUENCIES);
  }
  if (frequency === Config.FREQUENCIES.DAILY) {
    return normalizeRepeatEveryTyped_(repeatEvery);
  }
  if (frequency === Config.FREQUENCIES.WEEKLY) {
    return normalizeRepeatEveryTyped_(repeatEvery) * 7;
  }
  return null;
}

function periodsPerYearTyped_(frequency, repeatEvery) {
  var api = typedBudgetApi_();
  if (api && typeof api.periodsPerYear === 'function') {
    return api.periodsPerYear(frequency, repeatEvery, Config.FREQUENCIES);
  }
  var every = normalizeRepeatEveryTyped_(repeatEvery);
  switch (frequency) {
    case Config.FREQUENCIES.ONCE:
      return 0;
    case Config.FREQUENCIES.DAILY:
      return 365 / every;
    case Config.FREQUENCIES.WEEKLY:
      return (365 / 7) / every;
    case Config.FREQUENCIES.MONTHLY:
      return 12 / every;
    case Config.FREQUENCIES.YEARLY:
      return 1 / every;
    default:
      return 0;
  }
}

function stepForwardTyped_(date, frequency, repeatEvery) {
  var api = typedBudgetApi_();
  if (api && typeof api.stepForward === 'function') {
    return api.stepForward(date, frequency, repeatEvery, {
      frequencies: Config.FREQUENCIES,
      addDays: addDaysTyped_,
      addMonthsClamped: addMonthsClampedTyped_,
    });
  }

  var stepDays = getStepDaysTyped_(frequency, repeatEvery);
  if (stepDays) {
    return addDaysTyped_(date, stepDays);
  }

  var stepMonths = getStepMonthsTyped_(frequency, repeatEvery);
  if (stepMonths) {
    return addMonthsClampedTyped_(date, stepMonths);
  }

  return null;
}

function alignToWindowTyped_(anchor, frequency, repeatEvery, windowStart) {
  var api = typedBudgetApi_();
  if (api && typeof api.alignToWindow === 'function') {
    return api.alignToWindow(anchor, frequency, repeatEvery, windowStart, {
      frequencies: Config.FREQUENCIES,
      addDays: addDaysTyped_,
      addMonthsClamped: addMonthsClampedTyped_,
    });
  }

  if (anchor > windowStart) {
    return anchor;
  }

  var stepDays = getStepDaysTyped_(frequency, repeatEvery);
  if (stepDays) {
    var daysDiff = Math.floor((windowStart.getTime() - anchor.getTime()) / 86400000);
    var steps = Math.floor(daysDiff / stepDays);
    var candidate = addDaysTyped_(anchor, steps * stepDays);
    if (candidate < windowStart) {
      candidate = addDaysTyped_(candidate, stepDays);
    }
    return candidate;
  }

  var stepMonths = getStepMonthsTyped_(frequency, repeatEvery);
  if (!stepMonths) {
    return null;
  }

  var monthsDiff =
    (windowStart.getFullYear() - anchor.getFullYear()) * 12 +
    (windowStart.getMonth() - anchor.getMonth());
  var stepsMonths = Math.floor(monthsDiff / stepMonths);
  var candidate = addMonthsClampedTyped_(anchor, stepsMonths * stepMonths);
  if (candidate < windowStart) {
    candidate = addMonthsClampedTyped_(candidate, stepMonths);
  }
  return candidate;
}

function expandRecurrenceTyped_(options, context) {
  var api = typedBudgetApi_();
  if (api && typeof api.expandRecurrence === 'function') {
    return api.expandRecurrence(options || {}, {
      frequencies: Config.FREQUENCIES,
      normalizeDate: normalizeDateTyped_,
      addDays: addDaysTyped_,
      addMonthsClamped: addMonthsClampedTyped_,
      window: context && context.window ? context.window : null,
      today: context ? context.today : null,
    });
  }
  return null;
}

function getEventSortOrderTyped_(config) {
  var api = typedBudgetApi_();
  if (api && typeof api.getEventSortOrder === 'function') {
    return api.getEventSortOrder(config);
  }
  return [];
}

function getEventSortKeyTyped_(event, normalizeTransferTypeFn) {
  var api = typedBudgetApi_();
  if (api && typeof api.getEventSortKey === 'function') {
    return api.getEventSortKey(event, normalizeTransferTypeFn);
  }
  return '';
}

function eventSortPriorityTyped_(event, normalizeTransferTypeFn, config) {
  var api = typedBudgetApi_();
  if (api && typeof api.eventSortPriority === 'function') {
    return api.eventSortPriority(event, normalizeTransferTypeFn, config);
  }
  return null;
}

function normalizeCompiledEventTyped_(event, index, ctx) {
  var api = typedBudgetApi_();
  if (api && typeof api.normalizeCompiledEvent === 'function') {
    return api.normalizeCompiledEvent(event, index, ctx);
  }
  return null;
}

function compareCompiledEventsTyped_(a, b, ctx) {
  var api = typedBudgetApi_();
  if (api && typeof api.compareCompiledEvents === 'function') {
    return api.compareCompiledEvents(a, b, ctx);
  }
  return null;
}
