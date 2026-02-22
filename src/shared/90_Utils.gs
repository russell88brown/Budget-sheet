// Shared helper utilities.
const Utils = {
  toDate() {},
  addDays() {},
  clampEndOfMonth() {},
};

function isMissingHtmlFileError_(err) {
  return String(err).indexOf('No HTML file named') !== -1;
}

function createTemplateFromFileCompat_(name, folder) {
  var candidates = [];
  if (folder) {
    candidates.push(folder + '/' + name);
  }
  candidates.push(name);
  var lastError = null;
  for (var i = 0; i < candidates.length; i += 1) {
    try {
      return HtmlService.createTemplateFromFile(candidates[i]);
    } catch (err) {
      if (!isMissingHtmlFileError_(err)) {
        throw err;
      }
      lastError = err;
    }
  }
  throw lastError || new Error('Missing HTML file: ' + name);
}

function createHtmlOutputFromFileCompat_(name, folder) {
  var candidates = [];
  if (folder) {
    candidates.push(folder + '/' + name);
  }
  candidates.push(name);
  var lastError = null;
  for (var i = 0; i < candidates.length; i += 1) {
    try {
      return HtmlService.createHtmlOutputFromFile(candidates[i]);
    } catch (err) {
      if (!isMissingHtmlFileError_(err)) {
        throw err;
      }
      lastError = err;
    }
  }
  throw lastError || new Error('Missing HTML file: ' + name);
}
