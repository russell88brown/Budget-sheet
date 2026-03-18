// Deterministic same-day event ordering helpers.
var DEFAULT_EVENT_SORT_ORDER_ = [
  'Income',
  'Transfer:' + Config.TRANSFER_TYPES.TRANSFER_AMOUNT,
  'Transfer:' + Config.TRANSFER_TYPES.REPAYMENT_AMOUNT,
  'Transfer:' + Config.TRANSFER_TYPES.REPAYMENT_ALL,
  'Expense',
  'InterestAccrual',
  'Interest',
  'Transfer:' + Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT,
];

var EVENT_SORT_ORDER_ = null;
var EVENT_SORT_ORDER_LOOKUP_ = null;

function getEventSortConfig_() {
  return {
    transferAmount: Config.TRANSFER_TYPES.TRANSFER_AMOUNT,
    repaymentAmount: Config.TRANSFER_TYPES.REPAYMENT_AMOUNT,
    repaymentAll: Config.TRANSFER_TYPES.REPAYMENT_ALL,
    transferEverythingExcept: Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT,
  };
}

function ensureEventSortOrder_() {
  if (EVENT_SORT_ORDER_ && EVENT_SORT_ORDER_LOOKUP_) {
    return;
  }

  var order = DEFAULT_EVENT_SORT_ORDER_.slice();

  try {
    var typedSortOrder = getEventSortOrderTyped_(getEventSortConfig_());
    if (typedSortOrder && typedSortOrder.length) {
      order = typedSortOrder;
    }
  } catch (error) {
    // Apps Script can evaluate this file before the generated typed runtime file.
    // Fall back to the static order during bootstrap and let later calls use the runtime.
  }

  EVENT_SORT_ORDER_ = order;
  EVENT_SORT_ORDER_LOOKUP_ = EVENT_SORT_ORDER_.reduce(function (lookup, key, idx) {
    lookup[key] = idx;
    return lookup;
  }, {});
}

function getEventSortKey_(event) {
  var typed = getEventSortKeyTyped_(event, normalizeTransferType_);
  if (typed) {
    return typed;
  }
  if (!event || !event.kind) {
    return '';
  }
  if (event.kind === 'Transfer') {
    var behavior = normalizeTransferType_(event.transferBehavior || event.behavior, event.amount);
    return 'Transfer:' + behavior;
  }
  if (event.kind === 'Interest' && event.interestAccrual === true) {
    return 'InterestAccrual';
  }
  return event.kind;
}

function eventSortPriority_(event) {
  ensureEventSortOrder_();
  var typedPriority = eventSortPriorityTyped_(
    event,
    normalizeTransferType_,
    getEventSortConfig_()
  );
  if (typedPriority !== null && typedPriority !== undefined) {
    return typedPriority;
  }
  var key = getEventSortKey_(event);
  if (Object.prototype.hasOwnProperty.call(EVENT_SORT_ORDER_LOOKUP_, key)) {
    return EVENT_SORT_ORDER_LOOKUP_[key];
  }
  return EVENT_SORT_ORDER_.length + 1;
}
