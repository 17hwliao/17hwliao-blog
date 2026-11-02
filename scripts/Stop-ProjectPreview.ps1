[CmdletBinding()]
param([ValidateRange(1024, 65535)][int]$Port = 2025)
$ErrorActionPreference = 'Stop'
$taskRepo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$taskRecord = Join-Path $taskRepo ".local-preview/projects-$Port.json"
if (-not (Test-Path -LiteralPath $taskRecord)) { Write-Host 'No server started by the preview script was recorded. Existing servers are left running.'; return }
$taskState = Get-Content -LiteralPath $taskRecord -Raw | ConvertFrom-Json
if ($taskState.repo -ne $taskRepo -or $taskState.port -ne $Port) { throw 'The preview record does not match this repository and port.' }
$taskProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($taskState.pid)"
if ($taskProcess) {
    $taskCommand = ([string]$taskProcess.CommandLine).Replace('\', '/')
    $taskSameStart = [Math]::Abs((([datetime]$taskProcess.CreationDate).ToUniversalTime() - ([datetime]::Parse($taskState.started)).ToUniversalTime()).TotalSeconds) -lt 2
    if (-not $taskSameStart -or -not $taskCommand.Contains($taskRepo.Replace('\', '/')) -or $taskCommand -notmatch 'next') { throw 'Process ownership could not be verified; no process was stopped.' }
    $taskChildren = Get-CimInstance Win32_Process -Filter "ParentProcessId = $($taskState.pid)"
    foreach ($taskChild in $taskChildren) {
        if (([string]$taskChild.CommandLine).Replace('\', '/').Contains($taskRepo.Replace('\', '/')) -and $taskChild.CommandLine -match 'next') { Stop-Process -Id $taskChild.ProcessId -ErrorAction SilentlyContinue }
    }
    Stop-Process -Id $taskState.pid -ErrorAction SilentlyContinue
}
Remove-Item -LiteralPath $taskRecord
Write-Host "Local preview on port $Port stopped."
