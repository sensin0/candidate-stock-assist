$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$TaskName = "CandidateStockAssistMorningUpdate"
$NodeCommand = "npm"
$Arguments = "run morning"
$Time = "07:00"

$Action = New-ScheduledTaskAction -Execute $NodeCommand -Argument $Arguments -WorkingDirectory $RootDir
$DailyTrigger = New-ScheduledTaskTrigger -Daily -At $Time
$LogonTrigger = New-ScheduledTaskTrigger -AtLogOn
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $Action `
  -Trigger @($DailyTrigger, $LogonTrigger) `
  -Settings $Settings `
  -Description "Candidate stock assist morning update and report. Runs daily and at logon." `
  -Force | Out-Null

Write-Host "Registered morning update task: $TaskName ($Time and logon)"
