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
        { name: 'Category', type: 'category', required: false, description: 'Reporting' },
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
        {
          name: 'Monthly Total',
          type: 'number',
          required: false,
          description: 'Computed monthly equivalent for this row',
          format: '0.00',
        },
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
          name: 'Transfer Type',
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
          description: 'Income / Expense / Transfer / Interest',
        },
        { name: 'Name', type: 'string', required: true, description: 'Label' },
        { name: 'Amount', type: 'number', required: true, description: 'Event amount', format: '0.00' },
        { name: 'Alerts', type: 'string', required: false, description: 'Engine flags' },
      ],
    },
    {
      name: Config.SHEETS.LOGS,
      columns: [
        { name: 'Timestamp', type: 'date', required: true, description: 'Logged time', format: 'yyyy-mm-dd hh:mm' },
        { name: 'Level', type: 'string', required: true, description: 'INFO / WARN / ERROR' },
        { name: 'Message', type: 'string', required: true, description: 'Log message' },
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
