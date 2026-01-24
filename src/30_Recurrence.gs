// Recurrence expansion based on start and end dates.
const Recurrence = {
  expand: function (options) {
    var startDate = options.startDate;
    var frequency = options.frequency;
    var endDate = options.endDate;

    if (!startDate || !frequency) {
      return [];
    }

    var window = getForecastWindow_();
    var anchor = normalizeDate_(startDate);
    var end = endDate ? normalizeDate_(endDate) : window.end;
    var today = normalizeDate_(new Date());

    var windowStart = window.start > today ? window.start : today;
    var start = alignToWindow_(anchor, frequency, windowStart);
    if (!start) {
      return [];
    }
    if (end > window.end) {
      end = window.end;
    }

    if (start > end) {
      return [];
    }

    var dates = [];
    var current = start;
    while (current <= end) {
      dates.push(new Date(current.getTime()));
      current = Recurrence.stepForward(current, frequency);
      if (!current) {
        break;
      }
    }

    return dates;
  },

  stepForward: function (date, frequency) {
    switch (frequency) {
      case Config.FREQUENCIES.WEEKLY:
        return addDays_(date, 7);
      case Config.FREQUENCIES.FORTNIGHTLY:
        return addDays_(date, 14);
      case Config.FREQUENCIES.MONTHLY:
        return addMonthsClamped_(date, 1);
      case Config.FREQUENCIES.QUARTERLY:
        return addMonthsClamped_(date, 3);
      case Config.FREQUENCIES.SEMI_ANNUALLY:
        return addMonthsClamped_(date, 6);
      case Config.FREQUENCIES.ANNUALLY:
        return addMonthsClamped_(date, 12);
      case Config.FREQUENCIES.ONCE:
        return null;
      default:
        return null;
    }
  },
};

function getForecastWindow_() {
  var defaults = {
    start: normalizeDate_(new Date()),
    end: addMonthsClamped_(normalizeDate_(new Date()), 6),
  };
  var sheet = SpreadsheetApp.getActive().getSheetByName(Config.LISTS_SHEET);
  if (!sheet) {
    return defaults;
  }
  var startValue = sheet.getRange('A2').getValue();
  var endValue = sheet.getRange('B2').getValue();
  var start = startValue ? normalizeDate_(startValue) : defaults.start;
  var end = endValue ? normalizeDate_(endValue) : defaults.end;
  if (start > end) {
    return defaults;
  }
  return { start: start, end: end };
}

function normalizeDate_(value) {
  var date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays_(date, days) {
  var next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

function addMonthsClamped_(date, months) {
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

function alignToWindow_(anchor, frequency, windowStart) {
  if (anchor > windowStart) {
    return anchor;
  }

  if (frequency === Config.FREQUENCIES.WEEKLY || frequency === Config.FREQUENCIES.FORTNIGHTLY) {
    var stepDays = frequency === Config.FREQUENCIES.WEEKLY ? 7 : 14;
    var daysDiff = Math.floor((windowStart.getTime() - anchor.getTime()) / 86400000);
    var steps = Math.floor(daysDiff / stepDays);
    var candidate = addDays_(anchor, steps * stepDays);
    if (candidate <= windowStart) {
      candidate = addDays_(candidate, stepDays);
    }
    return candidate;
  }

  var stepMonths = 0;
  switch (frequency) {
    case Config.FREQUENCIES.MONTHLY:
      stepMonths = 1;
      break;
    case Config.FREQUENCIES.QUARTERLY:
      stepMonths = 3;
      break;
    case Config.FREQUENCIES.SEMI_ANNUALLY:
      stepMonths = 6;
      break;
    case Config.FREQUENCIES.ANNUALLY:
      stepMonths = 12;
      break;
    case Config.FREQUENCIES.ONCE:
    default:
      return null;
  }

  var monthsDiff =
    (windowStart.getFullYear() - anchor.getFullYear()) * 12 +
    (windowStart.getMonth() - anchor.getMonth());
  var stepsMonths = Math.floor(monthsDiff / stepMonths);
  var candidate = addMonthsClamped_(anchor, stepsMonths * stepMonths);
  if (candidate <= windowStart) {
    candidate = addMonthsClamped_(candidate, stepMonths);
  }
  return candidate;
}
