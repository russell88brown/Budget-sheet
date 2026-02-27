# Codex Prompt List

## 1
Detail: Create a new branch work folder from an external request.
Prompt:
```text
Follow codex/SKILL.md and create a new branch folder in codex/branch based on <EXTERNAL_PROMPT>
```

## 2
Detail: Create plan from prompt and set current sprint phase correctly.
Prompt:
```text
Follow codex/SKILL.md, generate the sprint plan, and set codex/current-sprint to create_plan_from_prompt|in_progress for <BRANCH_RELATIVE_PATH>
```

## 3
Detail: Review and finalize plan scope, risks, and validation strategy.
Prompt:
```text
Follow codex/SKILL.md, finalize sprint-plan.md, and set codex/current-sprint to review_and_finalize_plan|in_progress for <BRANCH_RELATIVE_PATH>
```

## 4
Detail: Execute one scoped implementation chunk and update docs.
Prompt:
```text
Follow codex/SKILL.md, implement one checklist chunk, update sprint-plan.md and PR.md, and set codex/current-sprint to execute_task_chunk|in_progress for <BRANCH_RELATIVE_PATH>
```

## 5
Detail: Review PR notes against real code and evidence.
Prompt:
```text
Follow codex/SKILL.md and reconcile PR.md against implemented code, then set codex/current-sprint to review_pr_against_code|in_progress for <BRANCH_RELATIVE_PATH>
```

## 6
Detail: Determine remaining work and keep checklist truthful.
Prompt:
```text
Follow codex/SKILL.md, update remaining actions in sprint-plan.md and PR.md, and set codex/current-sprint to determine_remaining_actions|in_progress for <BRANCH_RELATIVE_PATH>
```

## 7
Detail: Run final checks and housekeeping before PR handoff.
Prompt:
```text
Follow codex/SKILL.md, run relevant validations, update PR evidence tables, and set codex/current-sprint to final_checks_and_housekeeping|in_progress for <BRANCH_RELATIVE_PATH>
```

## 8
Detail: Document PR for the sprint folder with required sections.
Prompt:
```text
Follow codex/SKILL.md and draft or update PR.md with summary, changelog, test evidence, risks, and remaining actions for <BRANCH_RELATIVE_PATH>
```

## 9
Detail: Keep migration tracking current when migration work exists.
Prompt:
```text
Follow codex/SKILL.md and update migration-matrix.md to match completed and remaining migration tasks for <BRANCH_RELATIVE_PATH>
```

## 10
Detail: Close a sprint cleanly when definition of done is satisfied.
Prompt:
```text
Follow codex/SKILL.md, mark codex/current-sprint status as completed for the active phase, and confirm PR readiness for <BRANCH_RELATIVE_PATH>
```

