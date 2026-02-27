import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const codexRoot = path.join(repoRoot, 'codex');
const historyDir = path.join(codexRoot, 'history');
const currentSprintFile = path.join(codexRoot, 'current-sprint');
const planTemplateFile = path.join(codexRoot, 'sprint_tempalte-plan.md');
const prTemplateFile = path.join(codexRoot, 'sprint_template-pr.md');

const requiredSections = {
  'sprint-plan.md': [
    'Metadata',
    'Objective',
    'Scope In',
    'Task Checklist',
    'Acceptance Criteria',
    'Definition Of Done',
  ],
  'PR.md': [
    'Summary',
    'Sprint Plan Reference',
    'Completed Scope',
    'Change Log',
    'Test Evidence',
  ],
};

function fail(message) {
  console.error(`[sprint-tools] ${message}`);
  process.exit(1);
}

function info(message) {
  console.log(`[sprint-tools] ${message}`);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function isValidSprintId(sprintId) {
  return /^[a-z0-9][a-z0-9._-]*$/.test(sprintId);
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function copyTemplate(templatePath, targetFilePath, sprintId) {
  if (!fs.existsSync(templatePath)) {
    fail(`Template missing: ${templatePath}`);
  }

  if (fs.existsSync(targetFilePath)) {
    info(`Skipped existing file: ${path.relative(repoRoot, targetFilePath)}`);
    return;
  }

  const raw = readFile(templatePath);
  const content = raw.replaceAll('<sprint-id>', sprintId);
  writeFile(targetFilePath, content);
  info(`Created: ${path.relative(repoRoot, targetFilePath)}`);
}

function runGitCreateBranch(branchName) {
  const result = spawnSync('git', ['checkout', '-b', branchName], {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  if (result.error) {
    fail(`Failed to run git checkout -b ${branchName}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`git checkout -b ${branchName} failed with exit code ${result.status ?? 1}`);
  }
}

function startSprint(sprintId, options) {
  if (!sprintId) {
    fail('Usage: node scripts/sprint-tools.mjs start <sprint-id> [--no-branch]');
  }
  if (!isValidSprintId(sprintId)) {
    fail('Sprint ID must match: lowercase letters, digits, dots, underscores, hyphens.');
  }

  ensureDir(codexRoot);
  ensureDir(historyDir);

  const sprintPath = path.join(historyDir, sprintId);
  ensureDir(sprintPath);

  copyTemplate(planTemplateFile, path.join(sprintPath, 'sprint-plan.md'), sprintId);
  copyTemplate(prTemplateFile, path.join(sprintPath, 'PR.md'), sprintId);

  writeFile(currentSprintFile, `${sprintId}\n`);
  info(`Updated: ${path.relative(repoRoot, currentSprintFile)} -> ${sprintId}`);

  if (!options.noBranch) {
    runGitCreateBranch(`sprint/${sprintId}`);
  }
}

function parseSections(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = new Map();
  let currentSection = null;
  let buffer = [];

  function flushSection() {
    if (!currentSection) {
      return;
    }
    sections.set(currentSection, buffer.join('\n').trim());
    buffer = [];
  }

  for (const line of lines) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) {
      flushSection();
      currentSection = match[1].trim();
      continue;
    }

    if (currentSection) {
      buffer.push(line);
    }
  }

  flushSection();
  return sections;
}

function isMeaningful(text) {
  if (!text) {
    return false;
  }

  if (/TODO:/i.test(text) || /\bTODO\b/i.test(text)) {
    return false;
  }

  const normalized = text
    .replace(/`[^`]*`/g, '')
    .replace(/[|:-]/g, ' ')
    .replace(/\[[ xX]\]/g, ' ')
    .replace(/<sprint-id>/gi, ' ')
    .replace(/YYYY-MM-DD/gi, ' ')
    .replace(/\b(Item|Task|Criterion|Constraint|Risk|Mitigation|Win|Issue|Cause|Change|Follow-up)\s+\d+\b/gi, ' ')
    .replace(/\bPass\/Fail\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized.length >= 10;
}

function checkFileSections(filePath, sectionNames) {
  const markdown = readFile(filePath);
  const sections = parseSections(markdown);
  const missingSections = [];
  const emptySections = [];

  for (const section of sectionNames) {
    if (!sections.has(section)) {
      missingSections.push(section);
      continue;
    }
    if (!isMeaningful(sections.get(section))) {
      emptySections.push(section);
    }
  }

  return { missingSections, emptySections };
}

function checkSprint() {
  if (!fs.existsSync(currentSprintFile)) {
    fail(`Missing ${path.relative(repoRoot, currentSprintFile)}. Run sprint:start first.`);
  }

  const sprintId = readFile(currentSprintFile).trim();
  if (!sprintId) {
    fail(`${path.relative(repoRoot, currentSprintFile)} is empty.`);
  }

  const sprintPath = path.join(historyDir, sprintId);
  if (!fs.existsSync(sprintPath)) {
    fail(`Current sprint folder missing: ${path.relative(repoRoot, sprintPath)}`);
  }

  const failures = [];
  for (const [fileName, sectionNames] of Object.entries(requiredSections)) {
    const filePath = path.join(sprintPath, fileName);
    if (!fs.existsSync(filePath)) {
      failures.push(`Missing file: ${path.relative(repoRoot, filePath)}`);
      continue;
    }

    const { missingSections, emptySections } = checkFileSections(filePath, sectionNames);
    if (missingSections.length > 0) {
      failures.push(
        `${path.relative(repoRoot, filePath)} missing sections: ${missingSections.join(', ')}`
      );
    }
    if (emptySections.length > 0) {
      failures.push(
        `${path.relative(repoRoot, filePath)} has incomplete sections: ${emptySections.join(', ')}`
      );
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`[sprint-tools] ${failure}`);
    }
    process.exit(1);
  }

  info(`Sprint documentation check passed for: ${sprintId}`);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (!command) {
    fail('Usage: node scripts/sprint-tools.mjs <start|check> ...');
  }

  if (command === 'start') {
    const sprintId = rest[0];
    const noBranch = rest.includes('--no-branch');
    startSprint(sprintId, { noBranch });
    return;
  }

  if (command === 'check') {
    checkSprint();
    return;
  }

  fail('Usage: node scripts/sprint-tools.mjs <start|check> ...');
}

parseArgs(process.argv.slice(2));
