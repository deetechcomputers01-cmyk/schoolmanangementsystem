$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$pg = Join-Path $root ".local\postgresql-16.14\pgsql"
$data = Join-Path $root ".local\pgdata"

& "$pg\bin\pg_ctl.exe" -D $data stop
