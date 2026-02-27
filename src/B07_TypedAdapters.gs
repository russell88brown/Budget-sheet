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

function transferCalculationContextTyped_() {
  return {
    transferTypes: Config.TRANSFER_TYPES,
    accountKey: function (value) {
      return coreAccountKey_(value);
    },
    roundMoney: function (value) {
      return roundUpCents_(value || 0);
    },
  };
}

function estimateTransferOutgoingAmountTyped_(balances, event) {
  var api = typedBudgetApi_();
  if (api && typeof api.estimateTransferOutgoingAmount === 'function') {
    return api.estimateTransferOutgoingAmount(
      balances || {},
      event || {},
      transferCalculationContextTyped_()
    );
  }
  return null;
}

function resolveTransferAmountTyped_(balances, event, amount) {
  var api = typedBudgetApi_();
  if (api && typeof api.resolveTransferAmount === 'function') {
    return api.resolveTransferAmount(
      balances || {},
      event || {},
      amount || 0,
      transferCalculationContextTyped_()
    );
  }
  return null;
}

function computeInterestFeePerPostingTyped_(event) {
  var api = typedBudgetApi_();
  if (api && typeof api.computeInterestFeePerPosting === 'function') {
    return api.computeInterestFeePerPosting(event || {}, {
      toNumber: toNumberTyped_,
      periodsPerYear: function (frequency, repeatEvery) {
        return periodsPerYearTyped_(frequency, repeatEvery);
      },
    });
  }
  return null;
}

function isPolicyActiveOnDateTyped_(policy, date) {
  var api = typedBudgetApi_();
  if (api && typeof api.isPolicyActiveOnDate === 'function') {
    return api.isPolicyActiveOnDate(policy || {}, date, normalizeDateTyped_);
  }
  return null;
}

function getApplicableAutoDeficitPoliciesTyped_(policyRules, event) {
  var api = typedBudgetApi_();
  if (api && typeof api.getApplicableAutoDeficitPolicies === 'function') {
    return api.getApplicableAutoDeficitPolicies(policyRules || [], event || {}, {
      autoDeficitCoverType: Config.POLICY_TYPES.AUTO_DEFICIT_COVER,
      normalizeAccountLookupKey: function (value) {
        return normalizeAccountLookupKey_(value);
      },
      toPositiveInt: toPositiveIntTyped_,
      normalizeDate: normalizeDateTyped_,
    });
  }
  return null;
}

function normalizeScenarioSetTyped_(scenarioIds) {
  var api = typedBudgetApi_();
  if (api && typeof api.normalizeScenarioSet === 'function') {
    return api.normalizeScenarioSet(scenarioIds);
  }
  var ids = Array.isArray(scenarioIds) ? scenarioIds : [scenarioIds];
  var normalized = ids
    .map(function (value) { return normalizeTagTyped_(value); })
    .filter(function (value, idx, arr) { return value && arr.indexOf(value) === idx; });
  return normalized.length ? normalized : [Config.SCENARIOS.DEFAULT];
}

function filterByScenarioTyped_(rows, scenarioId) {
  var api = typedBudgetApi_();
  if (api && typeof api.filterByScenario === 'function') {
    return api.filterByScenario(rows || [], scenarioId);
  }
  if (!Array.isArray(rows) || !rows.length) {
    return [];
  }
  var activeScenarioId = normalizeTagTyped_(scenarioId);
  return rows.filter(function (row) {
    return normalizeTagTyped_(row && row.scenarioId) === activeScenarioId;
  });
}

function filterByScenarioSetTyped_(rows, scenarioIds) {
  var api = typedBudgetApi_();
  if (api && typeof api.filterByScenarioSet === 'function') {
    return api.filterByScenarioSet(rows || [], scenarioIds);
  }
  if (!Array.isArray(rows) || !rows.length) {
    return [];
  }
  var lookup = {};
  normalizeScenarioSetTyped_(scenarioIds).forEach(function (id) {
    lookup[id] = true;
  });
  return rows.filter(function (row) {
    return !!lookup[normalizeTagTyped_(row && row.scenarioId)];
  });
}

function buildScenarioLookupTyped_(catalogValues) {
  var api = typedBudgetApi_();
  if (api && typeof api.buildScenarioLookup === 'function') {
    return api.buildScenarioLookup(catalogValues || []);
  }
  var lookup = {};
  var values = Array.isArray(catalogValues) ? catalogValues : [catalogValues];
  values.forEach(function (value) {
    lookup[normalizeTagTyped_(value)] = true;
  });
  lookup[Config.SCENARIOS.DEFAULT] = true;
  return lookup;
}

function shouldIncludeScenarioColumnTyped_(scenarioColumnIndex, scenarioIds) {
  var api = typedBudgetApi_();
  if (api && typeof api.shouldIncludeScenarioColumn === 'function') {
    return api.shouldIncludeScenarioColumn(scenarioColumnIndex, scenarioIds);
  }
  return scenarioColumnIndex !== -1 && normalizeScenarioSetTyped_(scenarioIds).length > 1;
}

function valuesWithinToleranceTyped_(left, right, tolerance) {
  var api = typedBudgetApi_();
  if (api && typeof api.valuesWithinTolerance === 'function') {
    return api.valuesWithinTolerance(left, right, tolerance);
  }
  var lhs = typeof left === 'number' ? left : 0;
  var rhs = typeof right === 'number' ? right : 0;
  var limit = tolerance === undefined ? 0.01 : tolerance;
  return Math.abs(lhs - rhs) <= limit;
}

function countDaysBelowTyped_(rows, index, threshold) {
  var api = typedBudgetApi_();
  if (api && typeof api.countDaysBelow === 'function') {
    return api.countDaysBelow(rows || [], index, threshold);
  }
  return (rows || []).reduce(function (count, row) {
    return count + (((row && row[index]) || 0) < threshold ? 1 : 0);
  }, 0);
}

function computeSeriesStatsTyped_(rows, index) {
  var api = typedBudgetApi_();
  if (api && typeof api.computeSeriesStats === 'function') {
    return api.computeSeriesStats(rows || [], index, function (value) {
      return roundUpCents_(value || 0);
    });
  }
  return null;
}

function summarizeNegativeCashTopSourcesTyped_(rows, alertsIndex, amountIndex, sourceRuleIdIndex) {
  var api = typedBudgetApi_();
  if (api && typeof api.summarizeNegativeCashTopSourcesFromRows === 'function') {
    return api.summarizeNegativeCashTopSourcesFromRows(
      rows || [],
      alertsIndex,
      amountIndex,
      sourceRuleIdIndex,
      toNumberTyped_,
      function (value) { return roundUpCents_(value || 0); }
    );
  }
  return null;
}

function isRecurringForMonthlyAverageTyped_(rule) {
  var api = typedBudgetApi_();
  if (api && typeof api.isRecurringForMonthlyAverage === 'function') {
    return api.isRecurringForMonthlyAverage(rule || {}, {
      toDate: toDateTyped_,
      normalizeDate: normalizeDateTyped_,
      periodsPerYear: periodsPerYearTyped_,
    });
  }
  return null;
}

function monthlyFactorForRecurrenceTyped_(frequency, repeatEvery) {
  var api = typedBudgetApi_();
  if (api && typeof api.monthlyFactorForRecurrence === 'function') {
    return api.monthlyFactorForRecurrence(frequency, repeatEvery, periodsPerYearTyped_);
  }
  return null;
}

function isTransferAmountRequiredForMonthlyTotalTyped_(behavior) {
  var api = typedBudgetApi_();
  if (api && typeof api.isTransferAmountRequiredForMonthlyTotal === 'function') {
    return api.isTransferAmountRequiredForMonthlyTotal(behavior, Config.TRANSFER_TYPES);
  }
  return null;
}

function shouldCalculateTransferMonthlyTotalTyped_(include, recurring, recurrence, fromKey, toKey, behavior, amount) {
  var api = typedBudgetApi_();
  if (api && typeof api.shouldCalculateTransferMonthlyTotal === 'function') {
    return api.shouldCalculateTransferMonthlyTotal(
      include,
      recurring,
      recurrence || {},
      fromKey,
      toKey,
      behavior,
      amount,
      Config.TRANSFER_TYPES
    );
  }
  return null;
}

function resolveTransferMonthlyTotalTyped_(behavior, amount, factor, accountBalances, toKey) {
  var api = typedBudgetApi_();
  if (api && typeof api.resolveTransferMonthlyTotal === 'function') {
    return api.resolveTransferMonthlyTotal(behavior, amount, factor, accountBalances || {}, toKey, {
      transferTypes: Config.TRANSFER_TYPES,
      roundMoney: function (value) { return roundUpCents_(value || 0); },
    });
  }
  return null;
}

function normalizeAccountTotalsKeysTyped_(totalsByAccount) {
  var api = typedBudgetApi_();
  if (api && typeof api.normalizeAccountTotalsKeys === 'function') {
    return api.normalizeAccountTotalsKeys(totalsByAccount || {}, {
      normalizeAccountLookupKey: normalizeAccountLookupKey_,
      toNumber: toNumber_,
      roundMoney: function (value) { return roundUpCents_(value || 0); },
    });
  }
  return null;
}

function normalizeTransferTotalsKeysTyped_(transferTotals) {
  var api = typedBudgetApi_();
  if (api && typeof api.normalizeTransferTotalsKeys === 'function') {
    return api.normalizeTransferTotalsKeys(transferTotals || { credits: {}, debits: {} }, {
      normalizeAccountLookupKey: normalizeAccountLookupKey_,
      toNumber: toNumber_,
      roundMoney: function (value) { return roundUpCents_(value || 0); },
    });
  }
  return null;
}

function getAccountSummaryHeaderIndexesTyped_(headers) {
  var api = typedBudgetApi_();
  if (api && typeof api.getAccountSummaryHeaderIndexes === 'function') {
    return api.getAccountSummaryHeaderIndexes(headers || []);
  }
  return null;
}

function computeEstimatedMonthlyInterestTyped_(balance, ratePercent, method) {
  var api = typedBudgetApi_();
  if (api && typeof api.computeEstimatedMonthlyInterest === 'function') {
    return api.computeEstimatedMonthlyInterest(balance, ratePercent, method, {
      apyCompoundMethod: Config.INTEREST_METHODS.APY_COMPOUND,
      roundMoney: function (value) { return roundUpCents_(value || 0); },
    });
  }
  return null;
}

function findDuplicateAccountNamesTyped_(accounts) {
  var api = typedBudgetApi_();
  if (api && typeof api.findDuplicateAccountNames === 'function') {
    return api.findDuplicateAccountNames(accounts || [], normalizeAccountLookupKey_);
  }
  return null;
}

function mapLegacyFrequencyTyped_(frequencyValue, repeatEveryValue, startDateValue, endDateValue) {
  var api = typedBudgetApi_();
  if (api && typeof api.mapLegacyFrequency === 'function') {
    return api.mapLegacyFrequency(
      frequencyValue,
      repeatEveryValue,
      startDateValue,
      endDateValue,
      Config.FREQUENCIES
    );
  }
  return null;
}

function normalizeInterestMethodTyped_(value) {
  var api = typedBudgetApi_();
  if (api && typeof api.normalizeInterestMethod === 'function') {
    return api.normalizeInterestMethod(value, Config.INTEREST_METHODS);
  }
  return null;
}

function normalizeInterestFrequencyTyped_(value) {
  var api = typedBudgetApi_();
  if (api && typeof api.normalizeInterestFrequency === 'function') {
    return api.normalizeInterestFrequency(value, Config.FREQUENCIES);
  }
  return null;
}

function normalizeAccountTypeTyped_(value) {
  var api = typedBudgetApi_();
  if (api && typeof api.normalizeAccountType === 'function') {
    return api.normalizeAccountType(value, Config.ACCOUNT_TYPES);
  }
  return null;
}

function isValidNumberOrBlankTyped_(value) {
  var api = typedBudgetApi_();
  if (api && typeof api.isValidNumberOrBlank === 'function') {
    return api.isValidNumberOrBlank(value, toNumberTyped_);
  }
  return null;
}

function isValidAccountSummaryNumberTyped_(value) {
  var api = typedBudgetApi_();
  if (api && typeof api.isValidAccountSummaryNumber === 'function') {
    return api.isValidAccountSummaryNumber(value);
  }
  return null;
}

function reconcileMonthlyWithDailyTyped_(monthly, daily) {
  var api = typedBudgetApi_();
  if (api && typeof api.reconcileMonthlyWithDaily === 'function') {
    return api.reconcileMonthlyWithDaily(monthly || {}, daily || {}, {
      normalizeDate: normalizeDateTyped_,
      normalizeTag: normalizeTagTyped_,
      valuesWithinTolerance: function (left, right) {
        return valuesWithinToleranceTyped_(left, right, SUMMARY_RECON_TOLERANCE_);
      },
    });
  }
  return undefined;
}

function buildAccountTypeMapTyped_(accounts) {
  var api = typedBudgetApi_();
  if (api && typeof api.buildAccountTypeMap === 'function') {
    return api.buildAccountTypeMap(accounts || []);
  }
  return null;
}

function deriveJournalTransactionTypeTyped_(event) {
  var api = typedBudgetApi_();
  if (api && typeof api.deriveJournalTransactionType === 'function') {
    return api.deriveJournalTransactionType(event || {});
  }
  return null;
}

function mergeJournalArtifactsTyped_(artifacts, baseColumnCount) {
  var api = typedBudgetApi_();
  if (api && typeof api.mergeJournalArtifacts === 'function') {
    return api.mergeJournalArtifacts(artifacts || [], baseColumnCount || 8);
  }
  return null;
}

function buildBalanceMapTyped_(accounts) {
  var api = typedBudgetApi_();
  if (api && typeof api.buildBalanceMap === 'function') {
    return api.buildBalanceMap(accounts || [], coreAccountKey_, function (value) {
      return roundUpCents_(value || 0);
    });
  }
  return null;
}

function buildForecastableMapTyped_(accounts) {
  var api = typedBudgetApi_();
  if (api && typeof api.buildForecastableMap === 'function') {
    return api.buildForecastableMap(accounts || [], coreAccountKey_);
  }
  return null;
}

function buildForecastBalanceCellsTyped_(balances, forecastAccounts) {
  var api = typedBudgetApi_();
  if (api && typeof api.buildForecastBalanceCells === 'function') {
    return api.buildForecastBalanceCells(balances || {}, forecastAccounts || [], coreAccountKey_);
  }
  return null;
}

function buildAlertsTyped_(cashNegative, creditPaidOff, explicitAlert) {
  var api = typedBudgetApi_();
  if (api && typeof api.buildAlerts === 'function') {
    return api.buildAlerts(cashNegative, creditPaidOff, explicitAlert);
  }
  return null;
}

function buildOpeningRowsTyped_(accounts, date, forecastAccounts, balances, scenarioId) {
  var api = typedBudgetApi_();
  if (api && typeof api.buildOpeningRows === 'function') {
    return api.buildOpeningRows(accounts || [], date, forecastAccounts || [], balances || {}, scenarioId, {
      accountKey: coreAccountKey_,
      roundMoney: function (value) { return roundUpCents_(value || 0); },
      buildAlerts: function (cashNegative, creditPaidOff, explicitAlert) {
        return buildAlertsTyped_(cashNegative, creditPaidOff, explicitAlert);
      },
      deriveJournalTransactionType: deriveJournalTransactionType_,
      buildForecastBalanceCells: function (balanceMap, names) {
        return buildForecastBalanceCellsTyped_(balanceMap, names);
      },
      creditAccountType: Config.ACCOUNT_TYPES.CREDIT,
    });
  }
  return null;
}

function buildJournalEventRowsTyped_(
  event,
  balancesAfterFrom,
  balancesAfterTo,
  forecastAccounts,
  accountTypesByKey,
  scenarioId
) {
  var api = typedBudgetApi_();
  if (api && typeof api.buildJournalEventRows === 'function') {
    return api.buildJournalEventRows(
      event || {},
      balancesAfterFrom || {},
      balancesAfterTo || {},
      forecastAccounts || [],
      accountTypesByKey || {},
      scenarioId,
      {
        accountKey: coreAccountKey_,
        roundMoney: function (value) { return roundUpCents_(value || 0); },
        buildAlerts: function (cashNegative, creditPaidOff, explicitAlert) {
          return buildAlertsTyped_(cashNegative, creditPaidOff, explicitAlert);
        },
        deriveJournalTransactionType: deriveJournalTransactionType_,
        buildForecastBalanceCells: function (balanceMap, names) {
          return buildForecastBalanceCellsTyped_(balanceMap, names);
        },
        creditAccountType: Config.ACCOUNT_TYPES.CREDIT,
      }
    );
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
