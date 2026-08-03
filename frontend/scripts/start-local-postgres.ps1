$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$pg = Join-Path $root ".local\postgresql-16.14\pgsql"
$data = Join-Path $root ".local\pgdata"
$log = Join-Path $root ".local\postgres.log"

$pgCtl = Join-Path $pg "bin\pg_ctl.exe"
$status = & $pgCtl -D $data status 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Output "PostgreSQL is already running."
  exit 0
}

$pidFile = Join-Path $data "postmaster.pid"
if (Test-Path $pidFile) {
  $serverPid = (Get-Content -LiteralPath $pidFile | Select-Object -First 1)
  $process = if ($serverPid -match '^\d+$') { Get-Process -Id ([int]$serverPid) -ErrorAction SilentlyContinue } else { $null }
  if (-not $process -or $process.ProcessName -ne "postgres") {
    Remove-Item -LiteralPath $pidFile -Force
  }
}

& $pgCtl -D $data -l $log -o "-p 5432" -w start
if ($LASTEXITCODE -ne 0) {
  throw "PostgreSQL could not be started. Check $log for details."
}
