import assert from "node:assert/strict";

import { TypedBudget } from "../ts/apps-script/entry";

const required = [
  "getEventSortOrder",
  "compareCompiledEvents",
  "resolveTransferAmount",
  "normalizeTransferType",
  "expandRecurrence",
  "isPolicyActiveOnDate",
  "getApplicableAutoDeficitPolicies",
  "normalizeScenarioSet",
  "computeSeriesStats",
  "buildRunModel",
  "buildRunModelWithExtensions",
  "filterScenarioRowsForModel",
  "buildRunExtensions",
  "hasMeaningfulRowDataForRuleId",
  "assignMissingRuleIdsRows",
  "disableUnknownScenarioRows",
  "buildAccountLookupFromRows",
  "validateAccountsRows",
  "validatePolicyRows",
  "validateGoalRows",
  "validateIncomeRowReasons",
  "validateTransferRowReasons",
  "validateExpenseRowReasons",
  "normalizeTransferRows",
  "normalizeRecurrenceRows",
  "normalizeAccountRows",
  "deactivateRowsByValidator",
  "buildIncomeMonthlyTotals",
  "buildExpenseMonthlyTotals",
  "buildTransferMonthlyTotals",
  "computeTransferMonthlyWorksheet",
  "computeRuleMonthlyWorksheet",
  "buildAccountBalanceMap",
  "buildAccountLookupMap",
  "computeAccountMonthlyFlowWorksheet",
  "composeRunLogNotes",
  "listDuplicateAccountNames",
  "resolveRunLogWriteRow",
  "buildRunLogEntryRow",
  "isRowInActiveScenario",
  "formatDuplicateAccountErrorMessage",
  "mapSheetRows",
  "buildScenarioCatalog",
  "mapAccountReaderRows",
  "mapPolicyReaderRows",
  "mapGoalReaderRows",
];

for (const key of required) {
  assert.equal(typeof (TypedBudget as Record<string, unknown>)[key], "function", key);
}

const exportedConfig = (TypedBudget as Record<string, unknown>).Config as
  | Record<string, unknown>
  | undefined;
const exportedSchema = (TypedBudget as Record<string, unknown>).Schema as
  | Record<string, unknown>
  | undefined;

assert.equal(typeof exportedConfig, "object");
assert.equal(exportedConfig?.SHEETS !== undefined, true);
assert.equal(typeof exportedSchema, "object");
assert.equal(typeof exportedSchema?.toMarkdown, "function");
