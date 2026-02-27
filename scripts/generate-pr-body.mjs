import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const repoRoot = path.resolve(scriptDir, "..");

const codexRoot = path.join(repoRoot, "codex");
const currentSprintFile = path.join(codexRoot, "current-sprint");
const outputFile = path.join(repoRoot, ".github", "pull_request_body.generated.md");

function fail(message) {
  console.error(`[pr-body] ${message}`);
  process.exit(1);
}

function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing file: ${path.relative(repoRoot, filePath)}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

const sprintStateRaw = readFile(currentSprintFile).trim();
if (!sprintStateRaw) {
  fail("codex/current-sprint is empty.");
}

const sprintId = sprintStateRaw.split("|")[0];
if (!sprintId) {
  fail("Unable to parse sprint ID from codex/current-sprint.");
}

const sprintPrNotes = path.join(codexRoot, "branch", sprintId, "PR.md");
const prNotesContent = readFile(sprintPrNotes).trim();

const body =
  "<!-- Auto-generated. Source: codex sprint PR notes. -->\n" +
  `<!-- Sprint: ${sprintId} -->\n\n` +
  prNotesContent +
  "\n";

fs.writeFileSync(outputFile, body, "utf8");
console.log(`[pr-body] Wrote ${path.relative(repoRoot, outputFile)}`);
