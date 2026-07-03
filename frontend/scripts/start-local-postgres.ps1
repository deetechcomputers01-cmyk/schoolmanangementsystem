$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$pg = Join-Path $root ".local\postgresql-16.14\pgsql"
$data = Join-Path $root ".local\pgdata"
$log = Join-Path $root ".local\postgres.log"

& "$pg\bin\pg_ctl.exe" -D $data -l $log -o "-p 5432" start
