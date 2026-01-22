// Recurrence expansion based on start and end dates.
const Recurrence = {
  expand: function (options) {
    var startDate = options.startDate;
    var frequency = options.frequency;
    var endDate = options.endDate;

    if (!startDate || !frequency) {
      return [];
    }

    var start = normalizeDate_(startDate);
    var end = endDate ? normalizeDate_(endDate) : addDays_(new Date(), Config.FORECAST_DAYS);
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
