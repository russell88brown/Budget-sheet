// Domain core: apply sorted events into balances and journal rows.
const CoreApplyEvents = {
  buildJournalRows: function (options) {
    options = options || {};
    var accounts = options.accounts || [];
    var events = options.events || [];
    var policies = options.policies || [];
    var riskSettings = options.riskSettings || [];
    var scenarioId = options.scenarioId || Config.SCENARIOS.DEFAULT;

    var balances = coreBuildBalanceMap_(accounts);
    var forecastable = coreBuildForecastableMap_(accounts);
    var accountTypes = buildAccountTypeMap_(accounts);
    var policyRules = policies || [];
    var riskContext = coreResolveRiskContext_(riskSettings || []);
    var forecastAccounts = accounts
      .filter(function (account) {
        return forecastable[account.name];
      })
      .map(function (account) {
        return account.name;
      });
    var rows = [];
    var openingDate = events.length ? normalizeDate_(events[0].date) : normalizeDate_(new Date());

    rows = rows.concat(coreBuildOpeningRows_(accounts, openingDate, forecastAccounts, balances, scenarioId));

    events.forEach(function (event) {
      rows = rows.concat(
        coreApplyAutoDeficitCoverRowsBeforeEvent_(
          balances,
          event,
          accountTypes,
          policyRules,
          riskContext,
          forecastAccounts,
          scenarioId
        )
      );
      var snapshots = coreApplyEventWithSnapshots_(balances, event);
      if (event.skipJournal) {
        return;
      }
      rows = rows.concat(
        coreBuildJournalEventRows_(
          event,
          snapshots.afterFrom,
          snapshots.afterTo,
          forecastAccounts,
          accountTypes,
          scenarioId
        )
      );
    });

    return { rows: rows, forecastAccounts: forecastAccounts };
  },
};

function coreBuildOpeningRows_(accounts, date, forecastAccounts, balances, scenarioId) {
  return accounts.map(function (account) {
    var balanceSnapshot = coreBuildForecastBalanceCells_(balances, forecastAccounts);
    return [
      new Date(date.getTime()),
      scenarioId,
      account.name,
      'Opening',
      'Opening Balance',
      account.balance || 0,
      '',
    ].concat(balanceSnapshot);
  });
}

function coreBuildBalanceMap_(accounts) {
  var map = {};
  accounts.forEach(function (account) {
    map[account.name] = roundUpCents_(account.balance || 0);
  });
  return map;
}

function coreBuildForecastableMap_(accounts) {
  var map = {};
  accounts.forEach(function (account) {
    map[account.name] = account.forecast === true;
  });
  return map;
}

function coreBuildForecastBalanceCells_(balances, forecastAccounts) {
  return forecastAccounts.map(function (name) {
    return balances[name] || 0;
  });
}

function coreBuildJournalEventRows_(
  event,
  balancesAfterFrom,
  balancesAfterTo,
  forecastAccounts,
  accountTypes,
  scenarioId
) {
  var balanceSnapshotFrom = coreBuildForecastBalanceCells_(balancesAfterFrom, forecastAccounts);
  var balanceSnapshotTo = coreBuildForecastBalanceCells_(balancesAfterTo, forecastAccounts);
  var transactionType = deriveJournalTransactionType_(event);
  var amount = event.appliedAmount !== undefined ? event.appliedAmount : event.amount || 0;
  var signedAmount = amount;
  if (event.kind === 'Expense' || (event.kind === 'Transfer' && event.from)) {
    signedAmount = -amount;
  }
  if (event.kind === 'Transfer') {
    var accounts = [event.from, event.to].filter(function (name) {
      return name && name !== 'External';
    });
    return accounts.map(function (accountName) {
      var rowAmount = signedAmount;
      if (accountName === event.to) {
        rowAmount = amount;
      }
      var snapshot = accountName === event.to ? balanceSnapshotTo : balanceSnapshotFrom;
      var balanceForRow = accountName === event.to ? balancesAfterTo : balancesAfterFrom;
      var cashNegative =
        accountTypes[accountName] !== Config.ACCOUNT_TYPES.CREDIT && balanceForRow[accountName] < 0;
      var creditPaidOff =
        accountTypes[accountName] === Config.ACCOUNT_TYPES.CREDIT &&
        Math.abs(roundUpCents_(balanceForRow[accountName])) === 0 &&
        rowAmount > 0;
      return [
        event.date,
        scenarioId,
        accountName,
        transactionType,
        event.name,
        rowAmount,
        coreBuildAlerts_(cashNegative, creditPaidOff, event.alertTag),
      ].concat(snapshot);
    });
  }

  var accountName;
  if (event.kind === 'Interest') {
    accountName = event.account;
  } else {
    accountName = event.kind === 'Income' ? event.to : event.from;
  }
  var cashNegative =
    accountTypes[accountName] !== Config.ACCOUNT_TYPES.CREDIT &&
    balancesAfterTo[accountName] < 0;
  var creditPaidOff =
    accountTypes[accountName] === Config.ACCOUNT_TYPES.CREDIT &&
    Math.abs(roundUpCents_(balancesAfterTo[accountName])) === 0 &&
    signedAmount > 0;
  return [
    [
      event.date,
      scenarioId,
      accountName || '',
      transactionType,
      event.name,
      signedAmount,
      coreBuildAlerts_(cashNegative, creditPaidOff, event.alertTag),
    ].concat(balanceSnapshotTo),
  ];
}

function coreBuildAlerts_(cashNegative, creditPaidOff, explicitAlert) {
  var alerts = [];
  if (cashNegative) {
    alerts.push('NEGATIVE_CASH');
  }
  if (creditPaidOff) {
    alerts.push('CREDIT_PAID_OFF');
  }
  if (explicitAlert) {
    alerts.push(explicitAlert);
  }
  return alerts.join(' | ');
}

function coreApplyEventWithSnapshots_(balances, event) {
  var pre = coreCloneBalances_(balances);
  var amount = roundUpCents_(event.amount || 0);

  if (event.kind === 'Income') {
    if (event.to) {
      balances[event.to] = roundUpCents_((balances[event.to] || 0) + amount);
    }
    event.appliedAmount = amount;
    return { afterFrom: coreCloneBalances_(balances), afterTo: coreCloneBalances_(balances) };
  }

  if (event.kind === 'Expense') {
    if (event.from) {
      balances[event.from] = roundUpCents_((balances[event.from] || 0) - amount);
    }
    event.appliedAmount = amount;
    return { afterFrom: coreCloneBalances_(balances), afterTo: coreCloneBalances_(balances) };
  }

  if (event.kind === 'Interest') {
    var interestAccount = event.account;
    var interestAmount = coreComputeInterestAmount_(balances, event);
    event.appliedAmount = interestAmount;
    if (interestAmount === 0) {
      event.skipJournal = true;
      return { afterFrom: pre, afterTo: pre };
    }
    if (interestAccount) {
      balances[interestAccount] = roundUpCents_((balances[interestAccount] || 0) + interestAmount);
    }
    return { afterFrom: coreCloneBalances_(balances), afterTo: coreCloneBalances_(balances) };
  }

  if (event.kind === 'Transfer') {
    var transferResolution = coreResolveTransferAmount_(balances, event, amount);
    amount = transferResolution.amount;
    if (transferResolution.skip) {
      return { afterFrom: pre, afterTo: pre };
    }

    var afterFrom = coreCloneBalances_(pre);
    if (event.from) {
      afterFrom[event.from] = roundUpCents_((afterFrom[event.from] || 0) - amount);
    }
    var afterTo = coreCloneBalances_(afterFrom);
    if (event.to) {
      afterTo[event.to] = roundUpCents_((afterTo[event.to] || 0) + amount);
    }
    Object.keys(afterTo).forEach(function (name) {
      balances[name] = afterTo[name];
    });
    event.appliedAmount = amount;
    return { afterFrom: afterFrom, afterTo: afterTo };
  }

  return { afterFrom: pre, afterTo: pre };
}

function coreApplyAutoDeficitCoverRowsBeforeEvent_(
  balances,
  event,
  accountTypes,
  policyRules,
  riskContext,
  forecastAccounts,
  scenarioId
) {
  var applicablePolicies = coreGetApplicableAutoDeficitPolicies_(policyRules, event);
  if (!applicablePolicies.length) {
    return [];
  }

  var threshold = applicablePolicies.reduce(function (maxValue, policy) {
    var value = toNumber_(policy.threshold);
    if (value === null || value < 0) {
      value = 0;
    }
    return value > maxValue ? value : maxValue;
  }, 0);
  var coverageNeed = coreGetDeficitCoverageNeedForEvent_(balances, event, accountTypes, threshold);
  if (!coverageNeed || !coverageNeed.account || coverageNeed.amount <= 0) {
    return [];
  }
  var coveredAccount = coverageNeed.account;
  var remainingNeed = coverageNeed.amount;
  var rows = [];

  for (var i = 0; i < applicablePolicies.length && remainingNeed > 0; i += 1) {
    var policy = applicablePolicies[i];
    var sourceAccount = (policy.fundingAccount || '').toString().trim();
    if (!sourceAccount || sourceAccount === coveredAccount) {
      continue;
    }
    if (balances[sourceAccount] === undefined) {
      continue;
    }
    var available = roundUpCents_(Math.max(0, balances[sourceAccount] || 0));
    var reservedBuffer = coreGetReservedEmergencyBufferForSource_(riskContext, sourceAccount);
    if (reservedBuffer > 0) {
      available = roundUpCents_(Math.max(0, available - reservedBuffer));
    }
    if (available <= 0) {
      continue;
    }

    var maxPerEvent = toNumber_(policy.maxPerEvent);
    var cap = maxPerEvent !== null && maxPerEvent > 0 ? maxPerEvent : remainingNeed;
    var amount = roundUpCents_(Math.min(remainingNeed, available, cap));
    if (amount <= 0) {
      continue;
    }

    var coverEvent = {
      date: event.date,
      kind: 'Transfer',
      behavior: Config.POLICY_TYPES.AUTO_DEFICIT_COVER,
      transferBehavior: Config.TRANSFER_TYPES.TRANSFER_AMOUNT,
      name: policy.name || ('Auto deficit cover - ' + coveredAccount),
      from: sourceAccount,
      to: coveredAccount,
      amount: amount,
      alertTag: 'AUTO_DEFICIT_COVER',
    };
    var snapshots = coreApplyEventWithSnapshots_(balances, coverEvent);
    if (coverEvent.skipJournal) {
      continue;
    }
    rows = rows.concat(
      coreBuildJournalEventRows_(
        coverEvent,
        snapshots.afterFrom,
        snapshots.afterTo,
        forecastAccounts,
        accountTypes,
        scenarioId
      )
    );
    remainingNeed = roundUpCents_(remainingNeed - amount);
  }

  return rows;
}

function coreGetApplicableAutoDeficitPolicies_(policyRules, event) {
  if (!event || !event.from || !Array.isArray(policyRules) || !policyRules.length) {
    return [];
  }
  var eventFromKey = normalizeAccountLookupKey_(event.from);
  return policyRules
    .filter(function (policy) {
      if (!policy || policy.type !== Config.POLICY_TYPES.AUTO_DEFICIT_COVER) {
        return false;
      }
      if (normalizeAccountLookupKey_(policy.triggerAccount) !== eventFromKey) {
        return false;
      }
      return coreIsPolicyActiveOnDate_(policy, event.date);
    })
    .sort(function (a, b) {
      var pa = toPositiveInt_(a.priority) || 100;
      var pb = toPositiveInt_(b.priority) || 100;
      if (pa !== pb) {
        return pa - pb;
      }
      var na = a.name || '';
      var nb = b.name || '';
      return na < nb ? -1 : na > nb ? 1 : 0;
    });
}

function coreResolveRiskContext_(riskSettings) {
  if (!Array.isArray(riskSettings) || !riskSettings.length) {
    return null;
  }
  return riskSettings[0];
}

function coreGetReservedEmergencyBufferForSource_(riskContext, sourceAccount) {
  if (!riskContext || !sourceAccount) {
    return 0;
  }
  var bufferAccount = (riskContext.emergencyBufferAccount || '').toString().trim();
  if (!bufferAccount) {
    return 0;
  }
  if (normalizeAccountLookupKey_(bufferAccount) !== normalizeAccountLookupKey_(sourceAccount)) {
    return 0;
  }
  var minValue = toNumber_(riskContext.emergencyBufferMinimum);
  if (minValue === null || minValue <= 0) {
    return 0;
  }
  return roundUpCents_(minValue);
}

function coreIsPolicyActiveOnDate_(policy, date) {
  var day = normalizeDate_(date || new Date());
  var startDate = policy && policy.startDate ? normalizeDate_(policy.startDate) : null;
  var endDate = policy && policy.endDate ? normalizeDate_(policy.endDate) : null;
  if (startDate && day.getTime() < startDate.getTime()) {
    return false;
  }
  if (endDate && day.getTime() > endDate.getTime()) {
    return false;
  }
  return true;
}

function coreGetDeficitCoverageNeedForEvent_(balances, event, accountTypes, threshold) {
  if (!event || !event.kind) {
    return null;
  }
  if (event.kind !== 'Expense' && event.kind !== 'Transfer') {
    return null;
  }
  if (!event.from || accountTypes[event.from] === Config.ACCOUNT_TYPES.CREDIT) {
    return null;
  }
  if ((event.transferBehavior || event.behavior) === Config.POLICY_TYPES.AUTO_DEFICIT_COVER) {
    return null;
  }

  var outgoing = 0;
  if (event.kind === 'Expense') {
    outgoing = roundUpCents_(event.amount || 0);
  } else {
    outgoing = coreEstimateTransferOutgoingAmount_(balances, event);
  }

  if (outgoing <= 0) {
    return null;
  }
  var currentBalance = roundUpCents_(balances[event.from] || 0);
  var safeThreshold = toNumber_(threshold);
  if (safeThreshold === null || safeThreshold < 0) {
    safeThreshold = 0;
  }
  var needed = roundUpCents_(Math.max(0, outgoing + safeThreshold - currentBalance));
  if (needed <= 0) {
    return null;
  }
  return {
    account: event.from,
    amount: needed,
  };
}

function coreEstimateTransferOutgoingAmount_(balances, event) {
  var transferType = event.transferBehavior || event.behavior;
  var amount = roundUpCents_(event.amount || 0);

  if (transferType === Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT) {
    return 0;
  }
  if (transferType === Config.TRANSFER_TYPES.TRANSFER_AMOUNT) {
    return amount > 0 ? amount : 0;
  }
  if (transferType === Config.TRANSFER_TYPES.REPAYMENT_ALL) {
    var targetAll = event.to ? balances[event.to] || 0 : 0;
    return targetAll < 0 ? roundUpCents_(Math.abs(targetAll)) : 0;
  }
  if (transferType === Config.TRANSFER_TYPES.REPAYMENT_AMOUNT) {
    var targetAmount = event.to ? balances[event.to] || 0 : 0;
    if (targetAmount >= 0 || amount <= 0) {
      return 0;
    }
    return roundUpCents_(Math.min(amount, Math.abs(targetAmount)));
  }
  return amount > 0 ? amount : 0;
}

function coreResolveTransferAmount_(balances, event, amount) {
  var transferType = event.transferBehavior || event.behavior;

  if (transferType === Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT) {
    var sourceBalance = event.from ? balances[event.from] || 0 : 0;
    var keepAmount = amount || 0;
    var moveAmount = roundUpCents_(Math.max(0, sourceBalance - keepAmount));
    if (moveAmount <= 0) {
      event.appliedAmount = 0;
      event.skipJournal = true;
      return { amount: 0, skip: true };
    }
    return { amount: moveAmount, skip: false };
  }

  if (transferType === Config.TRANSFER_TYPES.TRANSFER_AMOUNT) {
    if (amount <= 0) {
      event.appliedAmount = 0;
      event.skipJournal = true;
      return { amount: 0, skip: true };
    }
    return { amount: amount, skip: false };
  }

  if (
    transferType !== Config.TRANSFER_TYPES.REPAYMENT_AMOUNT &&
    transferType !== Config.TRANSFER_TYPES.REPAYMENT_ALL
  ) {
    return { amount: amount, skip: false };
  }

  var target = event.to ? balances[event.to] || 0 : 0;
  if (target >= 0) {
    event.appliedAmount = 0;
    event.skipJournal = true;
    if (typeof runState_ !== 'undefined' && runState_) {
      runState_.creditPaidOffWarned = runState_.creditPaidOffWarned || {};
      if (!runState_.creditPaidOffWarned[event.name]) {
        runState_.creditPaidOffWarned[event.name] = true;
      }
    }
    return { amount: 0, skip: true };
  }

  var required = Math.abs(target);
  var resolvedAmount = amount;
  if (transferType === Config.TRANSFER_TYPES.REPAYMENT_ALL) {
    resolvedAmount = required;
  } else if (resolvedAmount <= 0) {
    event.appliedAmount = 0;
    event.skipJournal = true;
    return { amount: 0, skip: true };
  } else if (resolvedAmount > required) {
    resolvedAmount = roundUpCents_(required);
  }
  return { amount: resolvedAmount, skip: false };
}

function coreComputeInterestAmount_(balances, event) {
  if (!event) {
    return 0;
  }
  if (event.interestAccrual) {
    coreAccrueDailyInterest_(balances, event);
    return 0;
  }
  var account = event.account;
  if (!account) {
    return 0;
  }
  var bucket = coreGetInterestBucket_(account);
  var accrued = bucket.accrued || 0;
  var fee = coreComputeInterestFeePerPosting_(event);
  bucket.accrued = 0;
  bucket.lastPostingDate = event.date ? normalizeDate_(event.date) : null;
  return roundUpCents_(accrued - fee);
}

function coreAccrueDailyInterest_(balances, event) {
  var account = event.account;
  if (!account) {
    return;
  }
  var rate = event.rate;
  if (rate === null || rate === undefined || rate === '') {
    return;
  }
  var balance = balances[account] || 0;
  if (!balance) {
    return;
  }
  var annualRate = rate / 100;
  var dailyRate = annualRate / 365;
  if (event.method === Config.INTEREST_METHODS.APY_COMPOUND) {
    dailyRate = Math.pow(1 + annualRate, 1 / 365) - 1;
  }
  var bucket = coreGetInterestBucket_(account);
  bucket.accrued = (bucket.accrued || 0) + balance * dailyRate;
}

function coreComputeInterestFeePerPosting_(event) {
  var monthlyFee = toNumber_(event.monthlyFee);
  if (monthlyFee === null || monthlyFee <= 0) {
    return 0;
  }
  var periodsPerYear = Recurrence.periodsPerYear(event.frequency, event.repeatEvery);
  if (!periodsPerYear) {
    return monthlyFee;
  }
  return monthlyFee * (12 / periodsPerYear);
}

function coreGetInterestBucket_(accountName) {
  if (typeof runState_ === 'undefined' || !runState_) {
    return { accrued: 0, lastPostingDate: null };
  }
  runState_.interest = runState_.interest || {};
  if (!runState_.interest[accountName]) {
    runState_.interest[accountName] = { accrued: 0, lastPostingDate: null };
  }
  return runState_.interest[accountName];
}

function coreCloneBalances_(balances) {
  return Object.keys(balances).reduce(function (copy, key) {
    copy[key] = balances[key];
    return copy;
  }, {});
}

