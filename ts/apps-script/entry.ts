import {
  getTagColumnIndex,
  normalizeActions,
  normalizeAvailableTags,
  normalizeTag,
  selectRunTags,
} from "../engine/runSelections";
import { addDays, addMonthsClamped, normalizeDate } from "../core/dateMath";
import {
  eventSortPriority,
  getEventSortKey,
  getEventSortOrder,
  type EventSortConfig,
} from "../core/eventSort";
import {
  compareCompiledEvents,
  normalizeCompiledEvent,
  type CompiledEventContext,
} from "../core/compiledEvent";
import {
  normalizeFrequency,
  normalizePolicyType,
  normalizeRecurrence,
  normalizeTransferType,
  toBoolean,
  toDate,
  toNumber,
  toPositiveInt,
  type ReaderFrequencyConfig,
  type ReaderPolicyConfig,
  type ReaderTransferConfig,
} from "../core/readerNormalization";
import {
  buildExpenseEvents,
  buildIncomeEvents,
  buildInterestEvents,
  buildSourceRuleId,
  buildTransferEvents,
  type EventBuilderContext,
  type RecurrenceOptions,
} from "../core/eventBuilders";
import {
  computeInterestFeePerPosting,
  estimateTransferOutgoingAmount,
  resolveTransferAmount,
  type InterestFeeContext,
  type ResolveTransferAmountResult,
  type TransferCalculationContext,
  type TransferTypeConfig,
} from "../core/applyCalculations";
import {
  getApplicableAutoDeficitPolicies,
  isPolicyActiveOnDate,
  type PolicyRuleContext,
} from "../core/policyRules";
import {
  buildScenarioLookup,
  filterByScenario,
  filterByScenarioSet,
  normalizeScenarioSet,
  shouldIncludeScenarioColumn,
} from "../core/tagScope";
import {
  computeSeriesStats,
  countDaysBelow,
  valuesWithinTolerance,
  type SeriesStats,
} from "../core/summaryStats";
import { summarizeNegativeCashTopSourcesFromRows } from "../core/summaryExplainability";
import {
  isRecurringForMonthlyAverage,
  monthlyFactorForRecurrence,
} from "../core/monthlyRecurrence";
import {
  isTransferAmountRequiredForMonthlyTotal,
  resolveTransferMonthlyTotal,
  shouldCalculateTransferMonthlyTotal,
} from "../core/transferMonthlyTotals";
import {
  computeEstimatedMonthlyInterest,
  getAccountSummaryHeaderIndexes,
  normalizeAccountTotalsKeys,
  normalizeTransferTotalsKeys,
} from "../core/accountSummaries";
import { findDuplicateAccountNames } from "../core/accountValidation";
import {
  isValidAccountSummaryNumber,
  isValidNumberOrBlank,
  mapLegacyFrequency,
  normalizeAccountType,
  normalizeInterestFrequency,
  normalizeInterestMethod,
} from "../core/journalNormalization";
import { reconcileMonthlyWithDaily } from "../core/monthlyReconciliation";
import {
  buildAccountTypeMap,
  deriveJournalTransactionType,
  mergeJournalArtifacts,
} from "../core/journalAssembly";
import {
  buildAlerts,
  buildBalanceMap,
  buildForecastBalanceCells,
  buildForecastableMap,
} from "../core/journalApplyHelpers";
import { buildJournalEventRows, buildOpeningRows } from "../core/journalRows";
import {
  applyEventWithSnapshots,
  buildAccountTypesByKey,
  cloneBalances,
} from "../core/journalEventApplication";
import {
  accrueDailyInterest,
  computeInterestAmount,
  getDeficitCoverageNeedForEvent,
  getInterestBucket,
} from "../core/journalDeficitInterest";
import { applyAutoDeficitCoverRowsBeforeEvent } from "../core/journalAutoDeficit";
import { resolveTransferAmountForJournalWithDefault } from "../core/journalTransferResolution";
import { getJournalBaseColumnCount, normalizeJournalRunIds } from "../core/journalOrchestration";
import { buildJournalArtifactsForRunModel } from "../core/journalBuild";
import { buildMultiRunJournalPayload } from "../core/journalMultiRun";
import {
  resolveJournalScenarioId,
  shouldUseEngineDirect,
} from "../core/journalRuntime";
import { executeJournalPipelineCore } from "../core/journalPipelineExecution";
import {
  assertAccountsShape,
  assertEventsShape,
  assertPoliciesShape,
  type BudgetAccount,
  type BudgetEvent,
  type BudgetPolicy,
  type JournalRow,
} from "../core/contracts";
import {
  alignToWindow,
  expandRecurrence,
  getStepDays,
  getStepMonths,
  normalizeRepeatEvery,
  periodsPerYear,
  stepForward,
  type ExpandRecurrenceOptions,
  type RecurrenceContext,
  type RecurrenceFrequencies,
  type RecurrenceStepContext,
} from "../core/recurrence";
import { CONFIG } from "../core/config";
import { SCHEMA } from "../core/schema";
import {
  buildRunModel,
  buildRunModelWithExtensions,
  filterScenarioRowsForModel,
} from "../core/runModel";
import { buildRunExtensions } from "../core/runExtensions";
import {
  assignMissingRuleIdsRows,
  hasMeaningfulRowDataForRuleId,
} from "../core/ruleIdAssignment";
import { disableUnknownScenarioRows } from "../core/scenarioValidation";
import {
  buildAccountLookupFromRows,
  validateAccountsRows,
} from "../core/journalAccountRows";
import { validatePolicyRows } from "../core/journalPolicyRows";
import { validateGoalRows } from "../core/journalGoalRows";
import {
  validateExpenseRowReasons,
  validateIncomeRowReasons,
  validateTransferRowReasons,
} from "../core/journalRowValidation";
import { normalizeTransferRows } from "../core/transferRowNormalization";
import { normalizeRecurrenceRows } from "../core/recurrenceRowNormalization";
import { normalizeAccountRows } from "../core/accountRowNormalization";
import { deactivateRowsByValidator } from "../core/rowDeactivation";

export const TypedBudget = {
  Config: CONFIG,
  Schema: SCHEMA,
  buildRunModel,
  buildRunModelWithExtensions,
  filterScenarioRowsForModel,
  buildRunExtensions,
  hasMeaningfulRowDataForRuleId,
  assignMissingRuleIdsRows,
  disableUnknownScenarioRows,
  buildAccountLookupFromRows,
  validateAccountsRows,
  validatePolicyRows,
  validateGoalRows,
  validateIncomeRowReasons,
  validateTransferRowReasons,
  validateExpenseRowReasons,
  normalizeTransferRows,
  normalizeRecurrenceRows,
  normalizeAccountRows,
  deactivateRowsByValidator,
  DEFAULT_TAG: "Base",
  normalizeTag,
  normalizeAvailableTags,
  normalizeActions,
  selectRunTags,
  getTagColumnIndex,
  normalizeDate,
  addDays,
  addMonthsClamped,
  getEventSortOrder,
  getEventSortKey,
  eventSortPriority,
  normalizeRepeatEvery,
  getStepMonths,
  getStepDays,
  periodsPerYear,
  stepForward,
  alignToWindow,
  expandRecurrence,
  normalizeCompiledEvent,
  compareCompiledEvents,
  toBoolean,
  toNumber,
  toDate,
  toPositiveInt,
  normalizeFrequency,
  normalizeRecurrence,
  normalizeTransferType,
  normalizePolicyType,
  buildSourceRuleId,
  buildIncomeEvents,
  buildExpenseEvents,
  buildTransferEvents,
  buildInterestEvents,
  estimateTransferOutgoingAmount,
  resolveTransferAmount,
  computeInterestFeePerPosting,
  isPolicyActiveOnDate,
  getApplicableAutoDeficitPolicies,
  normalizeScenarioSet,
  filterByScenario,
  filterByScenarioSet,
  buildScenarioLookup,
  shouldIncludeScenarioColumn,
  valuesWithinTolerance,
  countDaysBelow,
  computeSeriesStats,
  summarizeNegativeCashTopSourcesFromRows,
  isRecurringForMonthlyAverage,
  monthlyFactorForRecurrence,
  isTransferAmountRequiredForMonthlyTotal,
  shouldCalculateTransferMonthlyTotal,
  resolveTransferMonthlyTotal,
  normalizeAccountTotalsKeys,
  normalizeTransferTotalsKeys,
  getAccountSummaryHeaderIndexes,
  computeEstimatedMonthlyInterest,
  findDuplicateAccountNames,
  mapLegacyFrequency,
  normalizeInterestMethod,
  normalizeInterestFrequency,
  normalizeAccountType,
  isValidNumberOrBlank,
  isValidAccountSummaryNumber,
  reconcileMonthlyWithDaily,
  buildAccountTypeMap,
  deriveJournalTransactionType,
  mergeJournalArtifacts,
  buildBalanceMap,
  buildForecastableMap,
  buildForecastBalanceCells,
  buildAlerts,
  buildOpeningRows,
  buildJournalEventRows,
  cloneBalances,
  buildAccountTypesByKey,
  applyEventWithSnapshots,
  getDeficitCoverageNeedForEvent,
  accrueDailyInterest,
  computeInterestAmount,
  getInterestBucket,
  applyAutoDeficitCoverRowsBeforeEvent,
  resolveTransferAmountForJournalWithDefault,
  normalizeJournalRunIds,
  getJournalBaseColumnCount,
  buildJournalArtifactsForRunModel,
  buildMultiRunJournalPayload,
  resolveJournalScenarioId,
  shouldUseEngineDirect,
  executeJournalPipelineCore,
  assertAccountsShape,
  assertEventsShape,
  assertPoliciesShape,
};

export type TypedBudgetApi = typeof TypedBudget;
export type { EventSortConfig };
export type { CompiledEventContext };
export type { RecurrenceFrequencies };
export type { RecurrenceStepContext };
export type { RecurrenceContext };
export type { ExpandRecurrenceOptions };
export type { ReaderFrequencyConfig };
export type { ReaderTransferConfig };
export type { ReaderPolicyConfig };
export type { EventBuilderContext };
export type { RecurrenceOptions };
export type { TransferTypeConfig };
export type { TransferCalculationContext };
export type { ResolveTransferAmountResult };
export type { InterestFeeContext };
export type { PolicyRuleContext };
export type { SeriesStats };
export type { BudgetAccount };
export type { BudgetEvent };
export type { BudgetPolicy };
export type { JournalRow };
