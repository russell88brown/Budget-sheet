// Deterministic same-day event ordering helpers.
var EVENT_SORT_ORDER_ = [
  'Income',
  'Transfer:' + Config.TRANSFER_TYPES.TRANSFER_AMOUNT,
  'Transfer:' + Config.TRANSFER_TYPES.REPAYMENT_AMOUNT,
  'Transfer:' + Config.TRANSFER_TYPES.REPAYMENT_ALL,
  'Expense',
  'InterestAccrual',
  'Interest',
  'Transfer:' + Config.TRANSFER_TYPES.TRANSFER_EVERYTHING_EXCEPT,
];

var EVENT_SORT_ORDER_LOOKUP_ = EVENT_SORT_ORDER_.reduce(function (lookup, key, idx) {
  lookup[key] = idx;
  return lookup;
}, {});

function getEventSortKey_(event) {
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
  var key = getEventSortKey_(event);
  if (Object.prototype.hasOwnProperty.call(EVENT_SORT_ORDER_LOOKUP_, key)) {
    return EVENT_SORT_ORDER_LOOKUP_[key];
  }
  return EVENT_SORT_ORDER_.length + 1;
}
