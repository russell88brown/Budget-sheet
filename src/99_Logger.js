// Centralized logging and warnings.
const Logger = (function () {
  var entries = [];

  function add(level, message) {
    entries.push([new Date(), level, message]);
  }

  return {
    info: function (message) {
      add('INFO', message);
    },
    warn: function (message) {
      add('WARN', message);
    },
    error: function (message) {
      add('ERROR', message);
    },
    clear: function () {
      entries = [];
    },
    flush: function () {
      var output = entries.slice();
      entries = [];
      return output;
    },
  };
})();
