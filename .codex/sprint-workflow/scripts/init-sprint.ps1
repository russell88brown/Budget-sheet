param(
  [Parameter(Mandatory = $true)]
  [string]$SprintId,
  [string]$BaseBranch = "main",
  [string]$SprintLead = "unassigned",
  [string[]]$Items = @()
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Resolve-Path (Join-Path $scriptDir "..")
$templateDir = Join-Path $rootDir "templates"
$outputDir = Join-Path $rootDir ("../sprints/" + $SprintId)
$itemsDir = Join-Path $outputDir "items"

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
New-Item -ItemType Directory -Path $itemsDir -Force | Out-Null

$today = Get-Date -Format "yyyy-MM-dd"

function Write-TemplateFile {
  param(
    [string]$SourcePath,
    [string]$TargetPath,
    [hashtable]$Replacements
  )

  $raw = Get-Content $SourcePath -Raw
  foreach ($key in $Replacements.Keys) {
    $raw = $raw.Replace($key, $Replacements[$key])
  }
  Set-Content -Path $TargetPath -Value $raw
}

$common = @{
  "{{SPRINT_ID}}" = $SprintId
  "{{DATE}}" = $today
  "{{SPRINT_LEAD}}" = $SprintLead
  "{{BASE_BRANCH}}" = $BaseBranch
}

Write-TemplateFile `
  -SourcePath (Join-Path $templateDir "sprint-plan.template.md") `
  -TargetPath (Join-Path $outputDir "sprint-plan.md") `
  -Replacements $common

Write-TemplateFile `
  -SourcePath (Join-Path $templateDir "closeout.template.md") `
  -TargetPath (Join-Path $outputDir "closeout.md") `
  -Replacements $common

if ($Items.Count -eq 0) {
  $Items = @("ITEM-001")
}

$normalizedItems = @()
foreach ($rawItem in $Items) {
  $parts = $rawItem -split ","
  foreach ($part in $parts) {
    $trimmed = $part.Trim()
    if ($trimmed.Length -gt 0) {
      $normalizedItems += $trimmed
    }
  }
}

foreach ($item in $normalizedItems) {
  $slug = $item.ToLower().Replace(" ", "-")
  $itemBranch = "feat/$slug"
  $itemReplacements = @{
    "{{SPRINT_ID}}" = $SprintId
    "{{ITEM_ID}}" = $item
    "{{ITEM_TITLE}}" = "TODO"
    "{{OWNER}}" = $SprintLead
    "{{ITEM_BRANCH}}" = $itemBranch
    "{{TIME}}" = $today
    "{{COMMAND}}" = "TODO"
    "{{RESULT}}" = "TODO"
    "{{PASS_FAIL}}" = "TODO"
  }

  $target = Join-Path $itemsDir ($item + ".md")
  Write-TemplateFile `
    -SourcePath (Join-Path $templateDir "work-item.template.md") `
    -TargetPath $target `
    -Replacements $itemReplacements
}

Write-Output ("Initialized sprint workspace: " + (Resolve-Path $outputDir))
