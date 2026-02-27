# Codex Prompt Stages

## Stage 1: Create Plan From Prompt Array

Copy/paste:

```text
Follow codex/SKILL.md for full process.

Request:
Create a sprint plan from this prompt array:
[
  "<PROMPT_1>",
  "<PROMPT_2>",
  "<PROMPT_3>"
]
```

Examples:
- `I would like to improve dashboards by this, this, and this.`
- `I have a bug with the calculation of ZBC LD.`
- `I would like to do a review on this.`

## Stage 2: Finalise Plan From Branch Folder Path

Copy/paste:

```text
Finalise the sprint plan from this branch folder path:
<PASTE_BRANCH_FOLDER_PATH>
```

## Stage 3: Implement Plan + Update Docs

Copy/paste:

```text
Implement the plan and update documentation.
```

## Stage 4: PR Review + Final Housekeeping

Copy/paste:

```text
Review and update PR notes, do final housekeeping, and do a diff against production.
```

