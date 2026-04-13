$ErrorActionPreference = "SilentlyContinue"

# Kill any process that currently owns port 3000.
$connections = Get-NetTCPConnection -LocalPort 3000 -State Listen
if ($connections) {
  $owningPids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $owningPids) {
    Stop-Process -Id $procId -Force
    Write-Output "Killed process using port 3000: $procId"
  }
}

# Remove stale Next.js dev lock file if present.
$lockPath = ".next\\dev\\lock"
if (Test-Path $lockPath) {
  Remove-Item $lockPath -Force
  Write-Output "Removed stale lock file: $lockPath"
}

# Kill ghost Next.js dev processes from this workspace.
$ghostProcesses = Get-CimInstance Win32_Process -Filter "name='node.exe'" |
  Where-Object {
    $_.CommandLine -match "Spurr_Website" -and
    ($_.CommandLine -match "next dev" -or $_.CommandLine -match "start-server.js" -or $_.CommandLine -match "next\\dist\\bin\\next")
  }

foreach ($ghost in $ghostProcesses) {
  Stop-Process -Id $ghost.ProcessId -Force
  Write-Output "Killed ghost Next process: $($ghost.ProcessId)"
}
