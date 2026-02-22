---
name: sprint-workflow
description: Structured sprint delivery workflow with reusable templates, branch-switching rules, testing gates, and closeout evidence. Use when Codex needs to run or enforce a repeatable sprint process across planning, implementation, validation, and release preparation.
---

# Sprint Workflow

Run this workflow in strict order unless the user explicitly asks to skip a phase.

## Quick Start

1. Run `scripts/init-sprint.ps1 -SprintId <id>` to scaffold a sprint workspace in `codex/sprints/<id>/`.
2. Execute `workflows/00-start-sprint.md`.
3. For each committed sprint item, execute `workflows/10-work-item-loop.md`.
4. Execute `workflows/20-close-sprint.md`.

## Required Rules

- Keep one active item at a time unless the user asks for parallel streams.
- Switch to the correct branch before editing files.
- Run targeted tests after each item, then run broader regression before closeout.
- Record commands, outcomes, and risks in sprint artifacts as evidence.
- Stop and ask the user before destructive git actions.

## Files To Load

- Sprint template: `templates/sprint-plan.template.md`
- Per-item template: `templates/work-item.template.md`
- PR and closeout template: `templates/closeout.template.md`
- Active segmentation map: `workflows/active-workflows.md`

