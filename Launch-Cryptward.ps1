param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$gameRoot = $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodePath = if ($nodeCommand) { $nodeCommand.Source } else { Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
if (-not (Test-Path -LiteralPath $nodePath)) { throw 'Node.js was not found. Install Node.js to play Cryptward.' }
if (-not (Test-Path -LiteralPath (Join-Path $gameRoot 'dist\index.html'))) { throw 'The game build is missing. Ask Codex to rebuild Cryptward.' }
$gamePort = 4173
while ($gamePort -le 4183) {
    $gameUrl = "http://127.0.0.1:$gamePort"
    $response = $null
    try { $response = Invoke-WebRequest -UseBasicParsing -Uri "$gameUrl/cryptward-health" -TimeoutSec 1 } catch {}
    if ($response -and $response.Content -eq 'CRYPTWARD_LOCAL') {
        if ($NoBrowser) { Write-Output $gameUrl } else { Start-Process $gameUrl }
        exit
    }
    $connection = New-Object System.Net.Sockets.TcpClient
    try { $connection.Connect('127.0.0.1', $gamePort); $busy = $true } catch { $busy = $false }
    $connection.Dispose()
    if (-not $busy) { break }
    $gamePort++
}
if ($gamePort -gt 4183) { throw 'Cryptward could not find an available local port.' }
$serverPath = Join-Path $gameRoot 'server.mjs'
Start-Process -FilePath $nodePath -ArgumentList @('"' + $serverPath + '"', "$gamePort") -WorkingDirectory $gameRoot -WindowStyle Hidden
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    $response = $null
    try { $response = Invoke-WebRequest -UseBasicParsing -Uri "$gameUrl/cryptward-health" -TimeoutSec 1 } catch {}
    if ($response -and $response.Content -eq 'CRYPTWARD_LOCAL') {
        if ($NoBrowser) { Write-Output $gameUrl } else { Start-Process $gameUrl }
        exit
    }
    Start-Sleep -Milliseconds 200
}
throw 'Cryptward could not start. Ask Codex to inspect the local game server.'
