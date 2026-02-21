// Recurrence expansion based on start and end dates.
const Recurrence = {
  normalizeRepeatEvery: function (repeatEvery) {
    var raw = Number(repeatEvery);
    if (!isFinite(raw) || raw < 1) {
      return 1;
    }
    return Math.floor(raw);
  },

  getStepMonths: function (frequency, repeatEvery) {
    var every = Recurrence.normalizeRepeatEvery(repeatEvery);
    if (frequency === Config.FREQUENCIES.MONTHLY) {
      return every;
    }
    if (frequency === Config.FREQUENCIES.YEARLY) {
      return every * 12;
    }
    return null;
  },

  getStepDays: function (frequency, repeatEvery) {
    if (frequency === Config.FREQUENCIES.DAILY) {
      return Recurrence.normalizeRepeatEvery(repeatEvery);
    }
    return null;
  },

  periodsPerYear: function (frequency, repeatEvery) {
    var every = Recurrence.normalizeRepeatEvery(repeatEvery);
    switch (frequency) {
      case Config.FREQUENCIES.DAILY:
        return 365 / every;
      case Config.FREQUENCIES.MONTHLY:
        return 12 / every;
      case Config.FREQUENCIES.YEARLY:
        return 1 / every;
      default:
        return 0;
    }
  },

  expand: function (options) {
    var startDate = options.startDate;
    var frequency = options.frequency;
    var repeatEvery = Recurrence.normalizeRepeatEvery(options.repeatEvery);
    var endDate = options.endDate;

    if (!startDate || !frequency) {
      return [];
    }

    var window = getForecastWindow_();
    var anchor = normalizeDate_(startDate);
    var end = endDate ? normalizeDate_(endDate) : window.end;
    var today = normalizeDate_(new Date());

    var windowStart = window.start > today ? window.start : today;
    if (endDate && anchor.getTime() === end.getTime()) {
      if (anchor < windowStart) {
        return [];
      }
      if (anchor > window.end) {
        return [];
      }
      return [new Date(anchor.getTime())];
    }
    var start = alignToWindow_(anchor, frequency, repeatEvery, windowStart);
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
      current = Recurrence.stepForward(current, frequency, repeatEvery);
      if (!current) {
        break;
      }
    }

    return dates;
  },

  stepForward: function (date, frequency, repeatEvery) {
    var stepDays = Recurrence.getStepDays(frequency, repeatEvery);
    if (stepDays) {
      return addDays_(date, stepDays);
    }

    var stepMonths = Recurrence.getStepMonths(frequency, repeatEvery);
    if (stepMonths) {
      return addMonthsClamped_(date, stepMonths);
    }

    return null;
  },
};

function getForecastWindow_() {
  var defaults = {
    start: normalizeDate_(new Date()),
    end: addMonthsClamped_(normalizeDate_(new Date()), 6),
  };
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(Config.LISTS_SHEET);
  if (!sheet) {
    return defaults;
  }
  var startRange = ss.getRangeByName(Config.NAMED_RANGES.FORECAST_START);
  var endRange = ss.getRangeByName(Config.NAMED_RANGES.FORECAST_END);
  var startValue = startRange ? startRange.getValue() : sheet.getRange('B2').getValue();
  var endValue = endRange ? endRange.getValue() : sheet.getRange('B3').getValue();
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

function alignToWindow_(anchor, frequency, repeatEvery, windowStart) {
  if (anchor > windowStart) {
    return anchor;
  }

  var stepDays = Recurrence.getStepDays(frequency, repeatEvery);
  if (stepDays) {
    var daysDiff = Math.floor((windowStart.getTime() - anchor.getTime()) / 86400000);
    var steps = Math.floor(daysDiff / stepDays);
    var candidate = addDays_(anchor, steps * stepDays);
    if (candidate < windowStart) {
      candidate = addDays_(candidate, stepDays);
    }
    return candidate;
  }

  var stepMonths = Recurrence.getStepMonths(frequency, repeatEvery);
  if (!stepMonths) {
    return null;
  }

  var monthsDiff =
    (windowStart.getFullYear() - anchor.getFullYear()) * 12 +
    (windowStart.getMonth() - anchor.getMonth());
  var stepsMonths = Math.floor(monthsDiff / stepMonths);
  var candidate = addMonthsClamped_(anchor, stepsMonths * stepMonths);
  if (candidate < windowStart) {
    candidate = addMonthsClamped_(candidate, stepMonths);
  }
  return candidate;
}
