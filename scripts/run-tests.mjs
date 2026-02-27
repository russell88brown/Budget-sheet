import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const testsDir = path.join(repoRoot, "tests");

const files = fs
  .readdirSync(testsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".test.ts"))
  .map((entry) => path.join("tests", entry.name));

if (!files.length) {
  console.error("No test files found in tests/*.test.ts");
  process.exit(1);
}

for (const file of files) {
  const result = spawnSync("npm", ["exec", "tsx", "--", file], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(typeof result.status === "number" ? result.status : 1);
  }
}
