import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const repoRoot = path.resolve(scriptDir, '..');
const claspConfigPath = path.join(repoRoot, '.clasp.json');
const claspExamplePath = path.join(repoRoot, '.clasp.example.json');
const claspCredentialsPath = path.join(os.homedir(), '.clasprc.json');
const claspCommand = process.platform === 'win32' ? 'clasp.cmd' : 'clasp';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    fail(`Missing required environment variable: ${name}`);
  }
  return String(value).trim();
}

function runCommand(args) {
  const result = spawnSync(claspCommand, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    fail(`Failed to execute clasp. Ensure clasp is installed and available in PATH. ${result.error.message}`);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function writeCredentialsIfProvided() {
  const raw = process.env.CLASP_CREDENTIALS_JSON;
  if (!raw || !String(raw).trim()) {
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail(`CLASP_CREDENTIALS_JSON is not valid JSON: ${error.message}`);
  }

  writeJsonFile(claspCredentialsPath, parsed);
  console.log(`Wrote clasp credentials to ${claspCredentialsPath}`);
}

function withTemporaryClaspConfig(scriptId, fn) {
  if (!fs.existsSync(claspExamplePath)) {
    fail(`Missing ${claspExamplePath}.`);
  }

  const template = readJsonFile(claspExamplePath);
  const originalExists = fs.existsSync(claspConfigPath);
  const originalRaw = originalExists ? fs.readFileSync(claspConfigPath, 'utf8') : null;

  const nextConfig = {
    ...template,
    scriptId,
  };

  writeJsonFile(claspConfigPath, nextConfig);
  console.log(`Using Apps Script project: ${scriptId}`);

  try {
    fn();
  } finally {
    if (originalExists && originalRaw !== null) {
      fs.writeFileSync(claspConfigPath, originalRaw, 'utf8');
      console.log('Restored original .clasp.json');
    } else {
      fs.rmSync(claspConfigPath, { force: true });
      console.log('Removed temporary .clasp.json');
    }
  }
}

function deployMain() {
  writeCredentialsIfProvided();
  const scriptId = requireEnv('CLASP_SCRIPT_ID_PROD');
  withTemporaryClaspConfig(scriptId, () => {
    runCommand(['push', '--force']);
  });
}

function testBranch() {
  writeCredentialsIfProvided();
  const scriptId = requireEnv('CLASP_SCRIPT_ID_TEST');
  const runner = (process.env.TEST_RUNNER_FUNCTION || 'runDeterministicFixtureTestsPhase2_All').trim();

  withTemporaryClaspConfig(scriptId, () => {
    runCommand(['push', '--force']);
    runCommand(['run', runner]);
  });
}

const action = process.argv[2];

if (action === 'deploy-main') {
  deployMain();
} else if (action === 'test-branch') {
  testBranch();
} else {
  fail('Usage: node scripts/pr-tools.mjs <deploy-main|test-branch>');
}
