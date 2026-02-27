// Recurrence expansion based on start and end dates.
const Recurrence = {
  normalizeRepeatEvery: function (repeatEvery) {
    return normalizeRepeatEveryTyped_(repeatEvery);
  },

  getStepMonths: function (frequency, repeatEvery) {
    return getStepMonthsTyped_(frequency, repeatEvery);
  },

  getStepDays: function (frequency, repeatEvery) {
    return getStepDaysTyped_(frequency, repeatEvery);
  },

  periodsPerYear: function (frequency, repeatEvery) {
    return periodsPerYearTyped_(frequency, repeatEvery);
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
    var typedDates = expandRecurrenceTyped_(
      {
        startDate: startDate,
        frequency: frequency,
        repeatEvery: repeatEvery,
        endDate: endDate,
      },
      { window: window, today: new Date() }
    );
    if (typedDates) {
      return typedDates.map(function (date) {
        return new Date(date.getTime());
      });
    }

    var anchor = normalizeDate_(startDate);
    var end = endDate ? normalizeDate_(endDate) : window.end;
    var today = normalizeDate_(new Date());

    var windowStart = window.start > today ? window.start : today;
    if (frequency === Config.FREQUENCIES.ONCE) {
      if (anchor < windowStart) {
        return [];
      }
      if (anchor > window.end) {
        return [];
      }
      return [new Date(anchor.getTime())];
    }
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
    return stepForwardTyped_(date, frequency, repeatEvery);
  },
};

var forecastWindowCache_ = null;

function resetForecastWindowCache_() {
  forecastWindowCache_ = null;
}

function getForecastWindow_() {
  if (forecastWindowCache_) {
    return {
      start: new Date(forecastWindowCache_.start.getTime()),
      end: new Date(forecastWindowCache_.end.getTime()),
    };
  }

  var defaults = {
    start: normalizeDate_(new Date()),
    end: addMonthsClamped_(normalizeDate_(new Date()), 6),
  };
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(Config.LISTS_SHEET);
  if (!sheet) {
    forecastWindowCache_ = { start: defaults.start, end: defaults.end };
    return {
      start: new Date(defaults.start.getTime()),
      end: new Date(defaults.end.getTime()),
    };
  }
  var startRange = ss.getRangeByName(Config.NAMED_RANGES.FORECAST_START);
  var endRange = ss.getRangeByName(Config.NAMED_RANGES.FORECAST_END);
  var startValue = startRange ? startRange.getValue() : sheet.getRange('B2').getValue();
  var endValue = endRange ? endRange.getValue() : sheet.getRange('B3').getValue();
  var start = startValue ? normalizeDate_(startValue) : defaults.start;
  var end = endValue ? normalizeDate_(endValue) : defaults.end;
  if (start > end) {
    forecastWindowCache_ = { start: defaults.start, end: defaults.end };
    return {
      start: new Date(defaults.start.getTime()),
      end: new Date(defaults.end.getTime()),
    };
  }
  forecastWindowCache_ = { start: start, end: end };
  return { start: new Date(start.getTime()), end: new Date(end.getTime()) };
}

function normalizeDate_(value) {
  return normalizeDateTyped_(value);
}

function addDays_(date, days) {
  return addDaysTyped_(date, days);
}

function addMonthsClamped_(date, months) {
  return addMonthsClampedTyped_(date, months);
}

function alignToWindow_(anchor, frequency, repeatEvery, windowStart) {
  return alignToWindowTyped_(anchor, frequency, repeatEvery, windowStart);
}
