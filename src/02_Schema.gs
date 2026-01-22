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
      ],
    },
    {
      name: Config.SHEETS.INCOME,
      columns: [
        { name: 'Active', type: 'boolean', required: true, description: 'Include in forecast' },
        { name: 'Name', type: 'string', required: true, description: 'Label' },
        { name: 'Amount', type: 'number', required: true, description: '> 0', format: '0.00' },
        {
          name: 'Frequency',
          type: 'enum',
          required: true,
          description: 'Recurrence',
          enumValues: Object.values(Config.FREQUENCIES),
        },
        { name: 'Anchor Date', type: 'date', required: true, description: 'First occurrence', format: 'yyyy-mm-dd' },
        { name: 'Paid To', type: 'ref', required: true, description: 'Destination account' },
        { name: 'Notes', type: 'string', required: false, description: 'Optional' },
      ],
    },
    {
      name: Config.SHEETS.EXPENSE,
      columns: [
        { name: 'Active', type: 'boolean', required: true, description: 'Include in forecast' },
        {
          name: 'Behavior',
          type: 'enum',
          required: true,
          description: 'Scheduled / Provision / CapOnly / OneOff',
          enumValues: Object.values(Config.BEHAVIORS),
        },
        { name: 'Category', type: 'string', required: false, description: 'Reporting' },
        { name: 'Name', type: 'string', required: true, description: 'Label' },
        { name: 'Amount', type: 'number', required: true, description: '>= 0', format: '0.00' },
        {
          name: 'Frequency',
          type: 'enum',
          required: false,
          description: 'Required unless CapOnly / OneOff',
          enumValues: Object.values(Config.FREQUENCIES),
        },
        {
          name: 'Anchor Date',
          type: 'date',
          required: false,
          description: 'Required for Scheduled / Provision',
          format: 'yyyy-mm-dd',
        },
        { name: 'Once Date', type: 'date', required: false, description: 'Required for OneOff', format: 'yyyy-mm-dd' },
        { name: 'Paid From', type: 'ref', required: false, description: 'Required unless CapOnly' },
        { name: 'Paid To', type: 'ref', required: false, description: 'Required for Scheduled / Provision' },
        { name: 'Notes', type: 'string', required: false, description: 'Optional' },
      ],
    },
  ],
  outputs: [
    {
      name: Config.SHEETS.JOURNAL,
      columns: [
        { name: 'Date', type: 'date', required: true, description: 'Event date', format: 'yyyy-mm-dd' },
        { name: 'Kind', type: 'enum', required: true, description: 'Income / Expense / Transfer' },
        { name: 'Behavior', type: 'enum', required: true, description: 'Behavior' },
        { name: 'Name', type: 'string', required: true, description: 'Label' },
        { name: 'Category', type: 'string', required: false, description: 'Reporting' },
        { name: 'From', type: 'string', required: false, description: 'Source account' },
        { name: 'To', type: 'string', required: false, description: 'Destination account' },
        { name: 'Amount', type: 'number', required: true, description: 'Event amount', format: '0.00' },
      ],
    },
    {
      name: Config.SHEETS.DAILY_SUMMARY,
      columns: [
        { name: 'Date', type: 'date', required: true, description: 'Day', format: 'yyyy-mm-dd' },
        { name: 'Total Cash', type: 'number', required: true, description: 'Sum of cash balances', format: '0.00' },
        { name: 'Total Debt', type: 'number', required: true, description: 'Sum of credit balances', format: '0.00' },
        { name: 'Net Position', type: 'number', required: true, description: 'Cash minus debt', format: '0.00' },
      ],
    },
    {
      name: Config.SHEETS.OVERVIEW,
      columns: [
        { name: 'Metric', type: 'string', required: true, description: 'Label' },
        { name: 'Value', type: 'string', required: true, description: 'Value' },
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

function renderSchemaMarkdown() {
  var markdown = Schema.toMarkdown();
  Logger.info(markdown);
  return markdown;
}
