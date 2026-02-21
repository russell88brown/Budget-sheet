Subject: Apps Script Sync Setup (Manual Copy or clasp)

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

## Option A: Manual copy into Apps Script editor

1. Open the target Google Sheet.
2. Open **Extensions -> Apps Script**.
3. Copy all `.gs` and `.html` files from `src/` into the editor project.
4. Replace/update project manifest using `src/appsscript.json`.
5. Save and reload the Google Sheet.

Use this option for one-off setup or quick validation.

## Option B: clasp workflow (recommended)

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