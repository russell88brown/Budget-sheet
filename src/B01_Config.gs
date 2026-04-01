// Centralized configuration and enums for the forecast engine.
// Source of truth: ts/core/config.ts via generated TypedBudget bundle.

function resolveTypedBudgetConfigExport_(name) {
  var container = typeof TypedBudget !== 'undefined' && TypedBudget ? TypedBudget : null;
  if (container && container.TypedBudget && typeof container.TypedBudget === 'object') {
    container = container.TypedBudget;
  }
  var value = container ? container[name] : null;
  if (value === null || value === undefined) {
    throw new Error('Typed runtime export "' + name + '" is unavailable. Run npm run build:typed.');
  }
  return value;
}

const Config = resolveTypedBudgetConfigExport_('Config');