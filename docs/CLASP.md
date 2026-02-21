# Clasp Setup (Push/Pull Apps Script)

This project keeps Apps Script code in `src/` and syncs to Google Apps Script using `clasp`.

## Purpose

- Keep the real Google Apps Script `scriptId` out of git.
- Make local setup repeatable for any developer.
- Push/pull the project linked to a specific Google Sheet Apps Script project.

## Prerequisites

- Node.js LTS
- npm (bundled with Node.js)
- Google account access to the target Apps Script project

## One-time setup

1. Install clasp:
   ```powershell
   npm install -g @google/clasp
   ```
2. Log in:
   ```powershell
   clasp login
   ```
3. Create local clasp config from template:
   ```powershell
   Copy-Item .clasp.example.json .clasp.json
   ```
4. Edit `.clasp.json` and set `scriptId` to your target project.

## Daily workflow

- Pull remote changes:
  ```powershell
  clasp pull
  ```
- Push local changes:
  ```powershell
  clasp push
  ```
- Optional: open script in browser:
  ```powershell
  clasp open
  ```

## Files and safety

- `.clasp.json` is ignored by git.
- `.clasp.example.json` is committed as a template.
