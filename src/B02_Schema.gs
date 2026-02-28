// Canonical sheet schemas used by setup and documentation.
// Source of truth: ts/core/schema.ts via generated TypedBudget bundle.

function resolveTypedBudgetSchemaExport_(name) {
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

const Schema = resolveTypedBudgetSchemaExport_('Schema');