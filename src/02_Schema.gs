// Canonical sheet schemas used by setup and documentation.
const Schema = {
  inputs: [
    {
      name: Config.SHEETS.ACCOUNTS,
      columns: [
        { name: 'Account Name', type: 'string', required: true, description: 'Unique identifier' },
        { name: 'Balance', type: 'number', required: true, description: 'Starting balance', format: '0.00' },
        {
          name: 'Type',
          type: 'enum',
          required: true,
          description: 'Cash / Credit',
          enumValues: Object.values(Config.ACCOUNT_TYPES),
        },
        { name: 'Include', type: 'boolean', required: false, description: 'Include in forecast outputs' },
        {
          name: 'Money In / Month',
          type: 'number',
          required: false,
          description: 'Average credited amount (income + incoming fixed transfers)',
          format: '0.00',
        },
        {
          name: 'Money Out / Month',
          type: 'number',
          required: false,
          description: 'Average debited amount (expenses + outgoing fixed transfers + fees)',
          format: '0.00',
        },
        {
          name: 'Net Interest / Month',
          type: 'number',
          required: false,
          description: 'Estimated monthly interest impact based on current balance and rate',
          format: '0.00',
        },
        {
          name: 'Net Change / Month',
          type: 'number',
          required: false,
          description: 'Money In / Month + Net Interest / Month - Money Out / Month',
          format: '0.00',
        },
        {
          name: 'Interest Rate (APR %)',
          type: 'number',
          required: false,
          description: 'Annual rate as a percent (e.g. 5 for 5%)',
          format: '0.00',
        },
        {
          name: 'Interest Fee / Month',
          type: 'number',
          required: false,
          description: 'Monthly fee charged to the account',
          format: '0.00',
        },
        {
          name: 'Interest Method',
          type: 'enum',
          required: false,
          description: 'How interest is calculated',
          enumValues: Object.values(Config.INTEREST_METHODS),
        },
        {
          name: 'Interest Frequency',
          type: 'enum',
          required: false,
          description: 'How often interest posts',
          enumValues: [
            Config.FREQUENCIES.DAILY,
            Config.FREQUENCIES.WEEKLY,
            Config.FREQUENCIES.MONTHLY,
            Config.FREQUENCIES.YEARLY,
          ],
        },
        {
          name: 'Interest Repeat Every',
          type: 'positive_int',
          required: false,
          description: 'Interval multiplier (default 1)',
          format: '0',
        },
        {
          name: 'Interest Start Date',
          type: 'date',
          required: false,
          description: 'First interest posting date',
          format: 'yyyy-mm-dd',
        },
      ],
    },
    {
      name: Config.SHEETS.POLICIES,
      columns: [
        { name: 'Include', type: 'boolean', required: true, description: 'Enable this policy rule' },
        {
          name: 'Policy Type',
          type: 'enum',
          required: true,
          description: 'Policy behavior mode',
          enumValues: Object.values(Config.POLICY_TYPES),
        },
        { name: 'Name', type: 'string', required: true, description: 'Policy label' },
        { name: 'Priority', type: 'positive_int', required: false, description: 'Lower runs first', format: '0' },
        { name: 'Start Date', type: 'date', required: false, description: 'Rule start date', format: 'yyyy-mm-dd' },
        { name: 'End Date', type: 'date', required: false, description: 'Optional stop date', format: 'yyyy-mm-dd' },
        { name: 'Trigger Account', type: 'ref', required: true, description: 'Account being protected from deficit' },
        { name: 'Funding Account', type: 'ref', required: true, description: 'Account used to fund protection' },
        {
          name: 'Threshold',
          type: 'number',
          required: false,
          description: 'Minimum balance target to preserve on trigger account',
          format: '0.00',
        },
        {
          name: 'Max Per Event',
          type: 'number',
          required: false,
          description: 'Optional cap for a single auto-cover action',
          format: '0.00',
        },
        { name: 'Notes', type: 'string', required: false, description: 'Optional' },
      ],
    },
    {
      name: Config.SHEETS.GOALS,
      columns: [
        { name: 'Include', type: 'boolean', required: true, description: 'Include in planning' },
        { name: 'Goal Name', type: 'string', required: true, description: 'Goal label' },
        { name: 'Target Amount', type: 'number', required: true, description: 'Goal target amount', format: '0.00' },
        { name: 'Target Date', type: 'date', required: true, description: 'Target completion date', format: 'yyyy-mm-dd' },
        { name: 'Priority', type: 'positive_int', required: false, description: 'Lower runs first', format: '0' },
        { name: 'Funding Account', type: 'ref', required: true, description: 'Primary account used for funding' },
        {
          name: 'Funding Policy',
          type: 'enum',
          required: true,
          description: 'How to fund this goal',
          enumValues: Object.values(Config.GOAL_FUNDING_POLICIES),
        },
        { name: 'Amount Per Month', type: 'number', required: false, description: 'Used for Fixed Amount policy', format: '0.00' },
        { name: 'Percent Of Inflow', type: 'number', required: false, description: 'Used for Percent of Inflow policy', format: '0.00' },
        { name: 'Notes', type: 'string', required: false, description: 'Optional' },
      ],
    },
    {
      name: Config.SHEETS.RISK,
      columns: [
        { name: 'Include', type: 'boolean', required: true, description: 'Enable this risk profile row' },
        { name: 'Scenario Name', type: 'string', required: true, description: 'Scenario label' },
        { name: 'Emergency Buffer Account', type: 'ref', required: false, description: 'Account to preserve buffer in' },
        { name: 'Emergency Buffer Minimum', type: 'number', required: false, description: 'Minimum balance floor', format: '0.00' },
        { name: 'Income Shock Percent', type: 'number', required: false, description: 'Downside haircut percent', format: '0.00' },
        { name: 'Expense Shock Percent', type: 'number', required: false, description: 'Upside increase percent', format: '0.00' },
        { name: 'Notes', type: 'string', required: false, description: 'Optional' },
      ],
    },
    {
      name: Config.SHEETS.INCOME,
      columns: [
        { name: 'Include', type: 'boolean', required: true, description: 'Include in forecast' },
        {
          name: 'Monthly Total',
          type: 'number',
          required: false,
          description: 'Computed monthly equivalent for this row',
          format: '0.00',
        },
        { name: 'Type', type: 'income_type', required: true, description: 'Salary / Other Income' },
        { name: 'Name', type: 'string', required: true, description: 'Label' },
        { name: 'Amount', type: 'number', required: true, description: '> 0', format: '0.00' },
        {
          name: 'Frequency',
          type: 'enum',
          required: true,
          description: 'Recurrence',
          enumValues: Object.values(Config.FREQUENCIES),
        },
        {
          name: 'Repeat Every',
          type: 'positive_int',
          required: false,
          description: 'Interval multiplier (default 1)',
          format: '0',
        },
        { name: 'Start Date', type: 'date', required: true, description: 'First occurrence', format: 'yyyy-mm-dd' },
        { name: 'End Date', type: 'date', required: false, description: 'Optional stop date', format: 'yyyy-mm-dd' },
        { name: 'To Account', type: 'ref', required: true, description: 'Destination account' },
        { name: 'Notes', type: 'string', required: false, description: 'Optional' },
      ],
    },
    {
      name: Config.SHEETS.EXPENSE,
      columns: [
        { name: 'Include', type: 'boolean', required: true, description: 'Include in forecast' },
        {
          name: 'Monthly Total',
          type: 'number',
          required: false,
          description: 'Computed monthly equivalent for this row',
          format: '0.00',
        },
        { name: 'Type', type: 'category', required: true, description: 'Expense type/category' },
        { name: 'Name', type: 'string', required: true, description: 'Label' },
        { name: 'Amount', type: 'number', required: true, description: '>= 0', format: '0.00' },
        {
          name: 'Frequency',
          type: 'enum',
          required: false,
          description: 'Recurrence',
          enumValues: Object.values(Config.FREQUENCIES),
        },
        {
          name: 'Repeat Every',
          type: 'positive_int',
          required: false,
          description: 'Interval multiplier (default 1)',
          format: '0',
        },
        {
          name: 'Start Date',
          type: 'date',
          required: false,
          description: 'First occurrence',
          format: 'yyyy-mm-dd',
        },
        {
          name: 'End Date',
          type: 'date',
          required: false,
          description: 'Optional stop date',
          format: 'yyyy-mm-dd',
        },
        { name: 'From Account', type: 'ref', required: true, description: 'Source account' },
        { name: 'Notes', type: 'string', required: false, description: 'Optional' },
      ],
    },
    {
      name: Config.SHEETS.TRANSFERS,
      columns: [
        { name: 'Include', type: 'boolean', required: true, description: 'Include in forecast' },
        {
          name: 'Monthly Total',
          type: 'number',
          required: false,
          description: 'Computed monthly equivalent for fixed transfer rows',
          format: '0.00',
        },
        {
          name: 'Type',
          type: 'enum',
          required: true,
          description: 'Repayment/Transfer behavior mode',
          enumValues: Object.values(Config.TRANSFER_TYPES),
        },
        { name: 'Name', type: 'string', required: true, description: 'Label' },
        { name: 'Amount', type: 'number', required: true, description: '>= 0', format: '0.00' },
        {
          name: 'Frequency',
          type: 'enum',
          required: false,
          description: 'Recurrence',
          enumValues: Object.values(Config.FREQUENCIES),
        },
        {
          name: 'Repeat Every',
          type: 'positive_int',
          required: false,
          description: 'Interval multiplier (default 1)',
          format: '0',
        },
        {
          name: 'Start Date',
          type: 'date',
          required: false,
          description: 'First occurrence',
          format: 'yyyy-mm-dd',
        },
        {
          name: 'End Date',
          type: 'date',
          required: false,
          description: 'Optional stop date',
          format: 'yyyy-mm-dd',
        },
        { name: 'From Account', type: 'ref', required: true, description: 'Source account' },
        { name: 'To Account', type: 'ref', required: true, description: 'Destination account' },
        { name: 'Notes', type: 'string', required: false, description: 'Optional' },
      ],
    },
  ],
  outputs: [
    {
      name: Config.SHEETS.JOURNAL,
      columns: [
        { name: 'Date', type: 'date', required: true, description: 'Event date', format: 'yyyy-mm-dd' },
        { name: 'Account', type: 'string', required: false, description: 'Debited/credited account' },
        {
          name: 'Transaction Type',
          type: 'enum',
          required: true,
          description: 'Income / Expense / Transfer (with transfer behavior detail) / Interest / Opening',
        },
        { name: 'Name', type: 'string', required: true, description: 'Label' },
        { name: 'Amount', type: 'number', required: true, description: 'Event amount', format: '0.00' },
        { name: 'Alerts', type: 'string', required: false, description: 'Engine flags' },
      ],
    },
  ],
  toMarkdown: function () {
    var lines = [];
    lines.push('# Sheet Schemas');
    lines.push('');
    lines.push('Generated from `src/02_Schema.gs`.');
    lines.push('');
    lines.push('## Inputs');
    lines.push('');
    Schema.inputs.forEach(function (spec) {
      lines.push('### `' + spec.name + '`');
      lines.push('');
      lines.push('| Column | Type | Required | Description |');
      lines.push('|-----|-----|---------|------------|');
      spec.columns.forEach(function (column) {
        lines.push(
          '| ' +
            column.name +
            ' | ' +
            column.type +
            ' | ' +
            (column.required ? 'Yes' : 'Optional') +
            ' | ' +
            column.description +
            ' |'
        );
      });
      lines.push('');
      lines.push('---');
      lines.push('');
    });
    lines.push('## Outputs');
    lines.push('');
    Schema.outputs.forEach(function (spec) {
      lines.push('### ' + spec.name);
      lines.push('');
      lines.push('| Column | Type | Required | Description |');
      lines.push('|-----|-----|---------|------------|');
      spec.columns.forEach(function (column) {
        lines.push(
          '| ' +
            column.name +
            ' | ' +
            column.type +
            ' | ' +
            (column.required ? 'Yes' : 'Optional') +
            ' | ' +
            column.description +
            ' |'
        );
      });
      lines.push('');
      lines.push('---');
      lines.push('');
    });
    return lines.join('\n');
  },
};
