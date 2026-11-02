[CmdletBinding()]
param(
    [ValidateRange(1024, 65535)][int]$Port = 2025,
    [switch]$Open
)
$ErrorActionPreference = 'Stop'
$taskRepo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$taskNode = (Get-Command node -ErrorAction Stop).Source
$taskNext = Join-Path $taskRepo 'node_modules/next/dist/bin/next'
if (-not (Test-Path -LiteralPath $taskNext)) { throw 'Dependencies are missing. Run pnpm install in the blog repository first.' }
$taskUrl = "http://127.0.0.1:$Port/projects"
$taskStateDirectory = Join-Path $taskRepo '.local-preview'
$taskRecord = Join-Path $taskStateDirectory "projects-$Port.json"
$taskListener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($taskListener) {
    $taskExisting = Get-CimInstance Win32_Process -Filter "ProcessId = $($taskListener.OwningProcess)"
    $taskCommand = ([string]$taskExisting.CommandLine).Replace('\', '/')
    if (-not $taskCommand.Contains($taskRepo.Replace('\', '/')) -or $taskCommand -notmatch 'next') {
        throw "Port $Port is used by another process. Choose another port with -Port 2026."
    }
    Write-Host "Reusing this blog's existing local server."
} else {
    $taskOtherServer = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object {
        ([string]$_.CommandLine).Replace('\', '/').Contains($taskRepo.Replace('\', '/')) -and $_.CommandLine -match 'dist[\\/]server[\\/]lib[\\/]start-server\.js'
    } | Select-Object -First 1
    if ($taskOtherServer) {
        $taskParent = Get-CimInstance Win32_Process -Filter "ProcessId = $($taskOtherServer.ParentProcessId)"
        $taskPortMatch = [regex]::Match([string]$taskParent.CommandLine, '(?:--port|-p)(?:=|\s+)(\d+)')
        $taskExistingAddress = if ($taskPortMatch.Success) { " at http://127.0.0.1:$($taskPortMatch.Groups[1].Value)/projects" } else { ' for this repository' }
        throw "This blog already has a local server$taskExistingAddress. Reuse it or stop that server first; a second instance cannot share the same development build directory."
    }
    New-Item -ItemType Directory -Path $taskStateDirectory -Force | Out-Null
    $taskService = Start-Process -FilePath $taskNode -ArgumentList @('"' + $taskNext + '"', 'dev', '--hostname', '127.0.0.1', '-p', [string]$Port) -WorkingDirectory $taskRepo -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskStateDirectory "projects-$Port.log") -RedirectStandardError (Join-Path $taskStateDirectory "projects-$Port.error.log") -PassThru
    @{ pid = $taskService.Id; started = $taskService.StartTime.ToUniversalTime().ToString('o'); repo = $taskRepo; port = $Port; url = $taskUrl } | ConvertTo-Json | Set-Content -LiteralPath $taskRecord -Encoding utf8
}
$taskReady = $false
$taskDeadline = (Get-Date).AddSeconds(90)
while ((Get-Date) -lt $taskDeadline) {
    if ($taskService) {
        $taskService.Refresh()
        if ($taskService.HasExited) {
            Remove-Item -LiteralPath $taskRecord -ErrorAction SilentlyContinue
            throw "The local server exited during startup. Check $taskStateDirectory for logs."
        }
    }
    try {
        $taskResponse = Invoke-WebRequest -Uri $taskUrl -UseBasicParsing -TimeoutSec 4
        if ($taskResponse.StatusCode -eq 200) { $taskReady = $true; break }
    } catch { Start-Sleep -Milliseconds 800 }
}
if (-not $taskReady) { throw "The preview did not become ready. Check $taskStateDirectory for logs. You can stop an owned service with Stop-ProjectPreview.ps1 -Port $Port." }
Write-Host "Preview ready: $taskUrl"
Write-Host "PR walkthrough: http://127.0.0.1:$Port/projects/trpc-agent-go"
Write-Host 'This script starts only the local blog. It does not push, publish, play audio or start project backends.'
if ($Open) { Start-Process $taskUrl }
