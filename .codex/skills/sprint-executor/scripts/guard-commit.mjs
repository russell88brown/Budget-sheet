import { spawnSync } from 'node:child_process';

function fail(message) {
  console.error(`[guard-commit] ${message}`);
  process.exit(1);
}

function runGit(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.error) {
    fail(`Failed to run git ${args.join(' ')}: ${result.error.message}`);
  }
  if ((result.status ?? 1) !== 0) {
    fail(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return (result.stdout || '').trim();
}

function main() {
  const sprintId = process.argv[2];
  const allowedPrefixes = process.argv.slice(3).filter(Boolean);

  if (!sprintId) {
    fail(
      'Usage: node .codex/skills/sprint-executor/scripts/guard-commit.mjs <sprint-id> <allowed-prefix...>'
    );
  }

  const currentBranch = runGit(['branch', '--show-current']);
  const expectedBranch = `sprint/${sprintId}`;

  if (currentBranch !== expectedBranch) {
    fail(`Wrong branch. Expected "${expectedBranch}" but found "${currentBranch}".`);
  }

  const stagedOutput = runGit(['diff', '--cached', '--name-only']);
  const stagedFiles = stagedOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (stagedFiles.length === 0) {
    fail('No staged files found.');
  }

  if (allowedPrefixes.length === 0) {
    console.log('[guard-commit] OK: branch and staged files present.');
    process.exit(0);
  }

  const unexpected = stagedFiles.filter(
    (filePath) => !allowedPrefixes.some((prefix) => filePath.startsWith(prefix))
  );

  if (unexpected.length > 0) {
    fail(
      `Unexpected staged files:\n${unexpected
        .map((filePath) => `- ${filePath}`)
        .join('\n')}\nAllowed prefixes: ${allowedPrefixes.join(', ')}`
    );
  }

  console.log('[guard-commit] OK: branch and staged file scope verified.');
}

main();

