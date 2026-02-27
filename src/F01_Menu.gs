// Entrypoints and menu wiring.
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var fixtureMenu = ui
    .createMenu('Deterministic Fixture Tests')
    .addItem('Run All + Report', 'runDeterministicFixtureTests_RunAllWithReport')
    .addItem('Run All (Raw)', 'runDeterministicFixtureTests_All');
  var fixtureSpecs = typeof getDeterministicFixtureTestSpecs_ === 'function'
    ? getDeterministicFixtureTestSpecs_()
    : [];
  fixtureSpecs.forEach(function (fixture) {
    if (!fixture || !fixture.name || !fixture.handler) {
      return;
    }
    fixtureMenu.addItem(fixture.name, fixture.handler);
  });

  ui
    .createMenu('Budget Forecast')
    .addItem('Run Budget...', 'showRunBudgetDialog')
    .addSeparator()
    .addSubMenu(fixtureMenu)
    .addSeparator()
    .addItem('Export', 'showExportDialog')
    .addItem('Setup actions...', 'showSetupDialog')
    .addToUi();
}

function runForecast() {
  if (Engine && Engine.runForecast) {
    Engine.runForecast();
  }
}

function runJournal() {
  if (Engine && Engine.runJournalOnly) {
    Engine.runJournalOnly();
  } else {
    runForecast();
  }
}

function runDeterministicFixtureTests_RunAllWithReport() {
  var fixtures = getDeterministicFixtureTestSpecs_();
  var progressSteps = fixtures.length + 1;
  startRunProgress_('Deterministic Fixture Tests', progressSteps);
  var results = [];
  try {
    fixtures.forEach(function (fixture) {
      toastStep_('Running ' + fixture.name + '...');
      try {
        fixture.run();
        results.push({ name: fixture.name, status: 'PASS', message: '' });
      } catch (err) {
        results.push({
          name: fixture.name,
          status: 'FAIL',
          message: err && err.message ? String(err.message) : String(err),
        });
      }
    });

    var failed = results.filter(function (item) {
      return item.status === 'FAIL';
    });
    var summary = 'Fixture tests passed ' + (results.length - failed.length) + '/' + results.length + '.';
    if (failed.length) {
      var failedNames = failed.map(function (item) { return item.name; }).join(', ');
      summary += ' Failed: ' + failedNames + '.';
    }

    if (typeof recordLastRunMetadata_ === 'function') {
      recordLastRunMetadata_(
        'Deterministic Fixture Tests',
        Config.SCENARIOS.DEFAULT,
        failed.length ? 'Failed' : 'Success',
        { note: summary }
      );
    }

    toastStep_(summary);
    if (failed.length) {
      throw new Error(summary);
    }
    return summary;
  } finally {
    endRunProgress_();
  }
}

function showRunBudgetDialog() {
  var template = createTemplateFromFileCompat_('F02_RunDialog');
  var available = (Readers && Readers.readTags ? Readers.readTags() : [Config.SCENARIOS.DEFAULT])
    .map(function (value) {
      return normalizeScenario_(value);
    })
    .filter(function (value, idx, arr) {
      return value && arr.indexOf(value) === idx;
    });
  if (!available.length) {
    available = [Config.SCENARIOS.DEFAULT];
  }
  template.tags = available;
  var html = template.evaluate().setWidth(860).setHeight(520);
  SpreadsheetApp.getUi().showModalDialog(html, 'Run Budget');
}

function runBudgetSelections(actions, tagIds) {
  var available = (Readers && Readers.readTags ? Readers.readTags() : [Config.SCENARIOS.DEFAULT])
    .map(function (value) {
      return normalizeScenario_(value);
    })
    .filter(function (value, idx, arr) {
      return value && arr.indexOf(value) === idx;
    });
  var selectedActions = Array.isArray(actions)
    ? actions.map(function (value) { return String(value || '').toLowerCase(); })
    : [];
  selectedActions = selectedActions.filter(function (value, idx, arr) {
    return value && arr.indexOf(value) === idx;
  });
  if (!selectedActions.length) {
    throw new Error('Select at least one action.');
  }
  selectedActions.forEach(function (actionType) {
    if (
      actionType !== 'summarise_accounts' &&
      actionType !== 'journal' &&
      actionType !== 'daily' &&
      actionType !== 'monthly' &&
      actionType !== 'dashboard'
    ) {
      throw new Error('Unknown action type.');
    }
  });

  var selectedTags = Array.isArray(tagIds)
    ? tagIds.map(function (value) { return normalizeScenario_(value); })
    : [];
  selectedTags.push(Config.SCENARIOS.DEFAULT);
  selectedTags = selectedTags.filter(function (value, idx, arr) {
    return value && arr.indexOf(value) === idx;
  });
  if (!selectedTags.length) {
    throw new Error('Select at least one tag.');
  }
  selectedTags.forEach(function (tagId) {
    if (available.indexOf(tagId) === -1) {
      throw new Error('Unknown tag "' + tagId + '".');
    }
  });

  var actionLabel = selectedActions
    .map(function (value) {
      if (value === 'summarise_accounts') {
        return 'Summarise Accounts';
      }
      if (value === 'journal') {
        return 'Journal';
      }
      if (value === 'daily') {
        return 'Daily';
      }
      if (value === 'monthly') {
        return 'Monthly';
      }
      if (value === 'dashboard') {
        return 'Dashboard';
      }
      return value;
    })
    .join(' + ');
  var tagLabel = selectedTags.join(', ');

  try {
    if (selectedActions.indexOf('summarise_accounts') !== -1) {
      selectedTags.forEach(function (tagId) {
        runAccountSummariesOnly_(buildRunModel_(tagId));
      });
    }

    if (selectedActions.indexOf('journal') !== -1) {
      if (selectedTags.length > 1 && typeof runJournalForIds_ === 'function') {
        runJournalForIds_(selectedTags);
      } else {
        var singleTagId = selectedTags[0];
        var runModel = buildRunModelWithExtensions_(singleTagId);
        if (Engine && Engine.runJournalForRunModel) {
          Engine.runJournalForRunModel(runModel);
        } else if (Engine && Engine.runJournalForScenario) {
          Engine.runJournalForScenario(singleTagId);
        } else {
          runJournal();
        }
      }
    }

    var daily = null;
    var monthly = null;
    var summaryTagFilter = selectedTags.length > 1 ? selectedTags : selectedTags[0];
    var needsJournalData =
      selectedActions.indexOf('daily') !== -1 ||
      selectedActions.indexOf('monthly') !== -1 ||
      selectedActions.indexOf('dashboard') !== -1;
    if (needsJournalData && typeof assertJournalRowsAvailableForScenarioSet_ === 'function') {
      assertJournalRowsAvailableForScenarioSet_(summaryTagFilter);
    }

    if (selectedActions.indexOf('daily') !== -1) {
      daily = buildDailySummary_(summaryTagFilter);
      if (typeof assertDailyReconcilesWithJournal_ === 'function') {
        assertDailyReconcilesWithJournal_(daily, summaryTagFilter);
      }
      writeDailySummary_(daily);
    }
    if (selectedActions.indexOf('monthly') !== -1) {
      if (!daily) {
        daily = buildDailySummary_(summaryTagFilter);
        if (typeof assertDailyReconcilesWithJournal_ === 'function') {
          assertDailyReconcilesWithJournal_(daily, summaryTagFilter);
        }
      }
      monthly = buildMonthlySummary_(daily);
      if (typeof assertMonthlyReconcilesWithDaily_ === 'function') {
        assertMonthlyReconcilesWithDaily_(monthly, daily);
      }
      writeMonthlySummary_(monthly);
    }
    if (selectedActions.indexOf('dashboard') !== -1) {
      if (!daily) {
        daily = buildDailySummary_(summaryTagFilter);
        if (typeof assertDailyReconcilesWithJournal_ === 'function') {
          assertDailyReconcilesWithJournal_(daily, summaryTagFilter);
        }
      }
      if (!monthly) {
        monthly = buildMonthlySummary_(daily);
        if (typeof assertMonthlyReconcilesWithDaily_ === 'function') {
          assertMonthlyReconcilesWithDaily_(monthly, daily);
        }
      }
      writeDashboard_(buildDashboardData_(daily, summaryTagFilter));
    }

    recordLastRunMetadata_('Run Budget: ' + actionLabel, tagLabel, 'Success');
    return actionLabel + ' complete for: ' + tagLabel + '.';
  } catch (err) {
    recordLastRunMetadata_('Run Budget: ' + actionLabel, tagLabel, 'Failed');
    throw err;
  }
}

function runAccountSummariesOnly_(runModel) {
  var activeTagId = runModel && runModel.scenarioId
    ? normalizeScenario_(runModel.scenarioId)
    : Config.SCENARIOS.DEFAULT;
  startRunProgress_('Account Summaries (' + activeTagId + ')', 3);
  try {
    toastStep_('Refreshing account summary values...');
    refreshAccountSummariesForRunModel_(runModel || buildRunModel_(activeTagId));
    recordLastRunMetadata_('Account Summaries', activeTagId, 'Success');
    toastStep_('Account summaries complete.');
  } catch (err) {
    recordLastRunMetadata_('Account Summaries', activeTagId, 'Failed');
    throw err;
  } finally {
    endRunProgress_();
  }
}

function summariseAccounts() {
  runAccountSummariesOnly_(buildRunModel_(Config.SCENARIOS.DEFAULT));
}

function validateTransfersExpenses() {
  summariseAccounts();
}

function showSetupDialog() {
  var html = createHtmlOutputFromFileCompat_('A03_SetupDialog')
    .setWidth(560)
    .setHeight(460);
  SpreadsheetApp.getUi().showModalDialog(html, 'Setup Options');
}

