// Domain core: apply sorted events into balances and journal rows.
const CoreApplyEvents = {
  applyEventsToJournal: function (options) {
    options = options || {};
    var accounts = options.accounts || [];
    var events = options.events || [];
    var policies = options.policies || [];
    var scenarioId = options.scenarioId || Config.SCENARIOS.DEFAULT;

    var balances = coreBuildBalanceMap_(accounts);
    var forecastable = coreBuildForecastableMap_(accounts);
    var accountTypesByKey = coreBuildAccountTypesByKey_(accounts);
    var policyRules = policies || [];
    var forecastAccounts = accounts
      .filter(function (account) {
        return forecastable[coreAccountKey_(account.name)];
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
          accountTypesByKey,
          policyRules,
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
          accountTypesByKey,
          scenarioId
        )
      );
    });

    return { rows: rows, forecastAccounts: forecastAccounts };
  },
};

function coreBuildOpeningRows_(accounts, date, forecastAccounts, balances, scenarioId) {
  var typed = buildOpeningRowsTyped_(accounts, date, forecastAccounts, balances, scenarioId);
  if (typed) {
    return typed;
  }

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
      '',
    ].concat(balanceSnapshot);
  });
}

function coreBuildBalanceMap_(accounts) {
  var typed = buildBalanceMapTyped_(accounts);
  if (typed) {
    return typed;
  }

  var map = {};
  accounts.forEach(function (account) {
    var key = coreAccountKey_(account && account.name);
    if (!key) {
      return;
    }
    map[key] = roundUpCents_(account.balance || 0);
  });
  return map;
}

function coreBuildForecastableMap_(accounts) {
  var typed = buildForecastableMapTyped_(accounts);
  if (typed) {
    return typed;
  }

  var map = {};
  accounts.forEach(function (account) {
    var key = coreAccountKey_(account && account.name);
    if (!key) {
      return;
    }
    map[key] = account.forecast === true;
  });
  return map;
}

function coreBuildForecastBalanceCells_(balances, forecastAccounts) {
  var typed = buildForecastBalanceCellsTyped_(balances, forecastAccounts);
  if (typed) {
    return typed;
  }

  return forecastAccounts.map(function (name) {
    return balances[coreAccountKey_(name)] || 0;
  });
}

function coreBuildJournalEventRows_(
  event,
  balancesAfterFrom,
  balancesAfterTo,
  forecastAccounts,
  accountTypesByKey,
  scenarioId
) {
  var typed = buildJournalEventRowsTyped_(
    event,
    balancesAfterFrom,
    balancesAfterTo,
    forecastAccounts,
    accountTypesByKey,
    scenarioId
  );
  if (typed) {
    return typed;
  }

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
      var accountKey = coreAccountKey_(accountName);
      var accountType = accountTypesByKey[accountKey];
      var cashNegative =
        accountType !== Config.ACCOUNT_TYPES.CREDIT && balanceForRow[accountKey] < 0;
      var creditPaidOff =
        accountType === Config.ACCOUNT_TYPES.CREDIT &&
        Math.abs(roundUpCents_(balanceForRow[accountKey])) === 0 &&
        rowAmount > 0;
      return [
        event.date,
        scenarioId,
        accountName,
        transactionType,
        event.name,
        rowAmount,
        event.sourceRuleId || '',
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
  var accountKey = coreAccountKey_(accountName);
  var accountType = accountTypesByKey[accountKey];
  var cashNegative =
    accountType !== Config.ACCOUNT_TYPES.CREDIT &&
    balancesAfterTo[accountKey] < 0;
  var creditPaidOff =
    accountType === Config.ACCOUNT_TYPES.CREDIT &&
    Math.abs(roundUpCents_(balancesAfterTo[accountKey])) === 0 &&
    signedAmount > 0;
  return [
    [
      event.date,
      scenarioId,
      accountName || '',
      transactionType,
      event.name,
      signedAmount,
      event.sourceRuleId || '',
      coreBuildAlerts_(cashNegative, creditPaidOff, event.alertTag),
    ].concat(balanceSnapshotTo),
  ];
}

function coreBuildAlerts_(cashNegative, creditPaidOff, explicitAlert) {
  var typed = buildAlertsTyped_(cashNegative, creditPaidOff, explicitAlert);
  if (typed !== null && typed !== undefined) {
    return typed;
  }

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
  var typed = applyEventWithSnapshotsTyped_(balances, event);
  if (typed) {
    return typed;
  }

  var pre = coreCloneBalances_(balances);
  var amount = roundUpCents_(event.amount || 0);
  var toKey = coreAccountKey_(event.to);
  var fromKey = coreAccountKey_(event.from);
  var accountKey = coreAccountKey_(event.account);

  if (event.kind === 'Income') {
    if (toKey && balances[toKey] !== undefined) {
      balances[toKey] = roundUpCents_((balances[toKey] || 0) + amount);
    }
    event.appliedAmount = amount;
    return { afterFrom: coreCloneBalances_(balances), afterTo: coreCloneBalances_(balances) };
  }

  if (event.kind === 'Expense') {
    if (fromKey && balances[fromKey] !== undefined) {
      balances[fromKey] = roundUpCents_((balances[fromKey] || 0) - amount);
    }
    event.appliedAmount = amount;
    return { afterFrom: coreCloneBalances_(balances), afterTo: coreCloneBalances_(balances) };
  }

  if (event.kind === 'Interest') {
    var interestAmount = coreComputeInterestAmount_(balances, event);
    event.appliedAmount = interestAmount;
    if (interestAmount === 0) {
      event.skipJournal = true;
      return { afterFrom: pre, afterTo: pre };
    }
    if (accountKey && balances[accountKey] !== undefined) {
      balances[accountKey] = roundUpCents_((balances[accountKey] || 0) + interestAmount);
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
    if (fromKey && afterFrom[fromKey] !== undefined) {
      afterFrom[fromKey] = roundUpCents_((afterFrom[fromKey] || 0) - amount);
    }
    var afterTo = coreCloneBalances_(afterFrom);
    if (toKey && afterTo[toKey] !== undefined) {
      afterTo[toKey] = roundUpCents_((afterTo[toKey] || 0) + amount);
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
  accountTypesByKey,
  policyRules,
  forecastAccounts,
  scenarioId
) {
  var typed = applyAutoDeficitCoverRowsBeforeEventTyped_(
    balances,
    event,
    accountTypesByKey,
    policyRules,
    forecastAccounts,
    scenarioId
  );
  if (typed) {
    return typed;
  }

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
  var coverageNeed = coreGetDeficitCoverageNeedForEvent_(balances, event, accountTypesByKey, threshold);
  if (!coverageNeed || !coverageNeed.account || coverageNeed.amount <= 0) {
    return [];
  }
  var coveredAccount = coverageNeed.account;
  var coveredAccountKey = coreAccountKey_(coveredAccount);
  var remainingNeed = coverageNeed.amount;
  var rows = [];

  for (var i = 0; i < applicablePolicies.length && remainingNeed > 0; i += 1) {
    var policy = applicablePolicies[i];
    var sourceAccount = (policy.fundingAccount || '').toString().trim();
    var sourceKey = coreAccountKey_(sourceAccount);
    if (!sourceAccount || sourceKey === coveredAccountKey) {
      continue;
    }
    if (!sourceKey || balances[sourceKey] === undefined) {
      continue;
    }
    var available = roundUpCents_(Math.max(0, balances[sourceKey] || 0));
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
      sourceRuleId: policy.ruleId || ('POL:' + (policy.name || 'AUTO_DEFICIT_COVER')),
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
        accountTypesByKey,
        scenarioId
      )
    );
    remainingNeed = roundUpCents_(remainingNeed - amount);
  }

  return rows;
}

function coreGetApplicableAutoDeficitPolicies_(policyRules, event) {
  var typed = getApplicableAutoDeficitPoliciesTyped_(policyRules, event);
  if (!typed) {
    throw new Error('Typed journal runtime is unavailable. Run npm run build:typed.');
  }
  return typed;
}

function coreIsPolicyActiveOnDate_(policy, date) {
  var typed = isPolicyActiveOnDateTyped_(policy, date);
  if (typed === null || typed === undefined) {
    throw new Error('Typed journal runtime is unavailable. Run npm run build:typed.');
  }
  return typed;
}

function coreGetDeficitCoverageNeedForEvent_(balances, event, accountTypesByKey, threshold) {
  var typed = getDeficitCoverageNeedForEventTyped_(balances, event, accountTypesByKey, threshold);
  if (typed === undefined) {
    throw new Error('Typed journal runtime is unavailable. Run npm run build:typed.');
  }
  return typed;
}

function coreEstimateTransferOutgoingAmount_(balances, event) {
  var typed = estimateTransferOutgoingAmountTyped_(balances, event);
  if (typed === null || typed === undefined) {
    throw new Error('Typed journal runtime is unavailable. Run npm run build:typed.');
  }
  return typed;
}

function coreResolveTransferAmount_(balances, event, amount) {
  var typed = resolveTransferAmountForJournalTyped_(balances, event, amount);
  if (!typed) {
    throw new Error('Typed journal runtime is unavailable. Run npm run build:typed.');
  }
  return typed;
}

function coreComputeInterestAmount_(balances, event) {
  var interestAccountKey = coreAccountKey_(event && event.account);
  var interestBucket = interestAccountKey ? coreGetInterestBucket_(interestAccountKey) : { accrued: 0, lastPostingDate: null };
  var typed = computeInterestAmountTyped_(balances, event, interestBucket);
  if (typed === null || typed === undefined) {
    throw new Error('Typed journal runtime is unavailable. Run npm run build:typed.');
  }
  return typed;
}

function coreAccrueDailyInterest_(balances, event) {
  var interestAccountKey = coreAccountKey_(event && event.account);
  var interestBucket = interestAccountKey ? coreGetInterestBucket_(interestAccountKey) : { accrued: 0, lastPostingDate: null };
  var typedHandled = accrueDailyInterestTyped_(balances, event, interestBucket);
  if (!typedHandled) {
    throw new Error('Typed journal runtime is unavailable. Run npm run build:typed.');
  }
}

function coreComputeInterestFeePerPosting_(event) {
  var typed = computeInterestFeePerPostingTyped_(event);
  if (typed === null || typed === undefined) {
    throw new Error('Typed journal runtime is unavailable. Run npm run build:typed.');
  }
  return typed;
}

function coreGetInterestBucket_(accountName) {
  var typed = getInterestBucketTyped_(typeof runState_ === 'undefined' ? null : runState_, accountName);
  if (!typed) {
    throw new Error('Typed journal runtime is unavailable. Run npm run build:typed.');
  }
  return typed;
}

function coreCloneBalances_(balances) {
  var typed = cloneBalancesTyped_(balances);
  if (typed) {
    return typed;
  }

  return Object.keys(balances).reduce(function (copy, key) {
    copy[key] = balances[key];
    return copy;
  }, {});
}

function coreAccountKey_(value) {
  return normalizeAccountLookupKey_(value);
}

function coreBuildAccountTypesByKey_(accounts) {
  var typed = buildAccountTypesByKeyTyped_(accounts);
  if (typed) {
    return typed;
  }

  var byKey = {};
  (accounts || []).forEach(function (account) {
    if (!account || !account.name) {
      return;
    }
    byKey[coreAccountKey_(account.name)] = account.type;
  });
  return byKey;
}

