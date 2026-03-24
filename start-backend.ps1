param(
    [int]$Port = 8081,
    [switch]$NoBrowser,
    [string]$MavenCommand = "mvn"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot "backend"

if (-not (Test-Path $backendPath)) {
    throw "No se encontro la carpeta backend en: $backendPath"
}

$pomPath = Join-Path $backendPath "pom.xml"
if (-not (Test-Path $pomPath)) {
    throw "No se encontro pom.xml en: $pomPath"
}

try {
    Get-Command $MavenCommand -ErrorAction Stop | Out-Null
} catch {
    throw "No se encontro Maven en PATH. Instala Maven o indica -MavenCommand con la ruta al ejecutable."
}

$backendRunning = $false
try {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
    if ($conn) {
        $backendRunning = $true
    }
} catch {
    $backendRunning = $false
}

if (-not $backendRunning) {
    $mavenArgs = @(
        "spring-boot:run",
        "-Dspring-boot.run.arguments=--server.port=$Port"
    )

    Start-Process -FilePath $MavenCommand -ArgumentList $mavenArgs -WorkingDirectory $backendPath | Out-Null

    $maxWaitSeconds = 40
    $started = $false

    for ($i = 0; $i -lt $maxWaitSeconds; $i++) {
        Start-Sleep -Seconds 1
        try {
            $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
            if ($conn) {
                $started = $true
                break
            }
        } catch {
            # Aun no esta escuchando.
        }
    }

    if (-not $started) {
        Write-Warning "El backend no respondio en el puerto $Port dentro de $maxWaitSeconds segundos. Revisa la consola de Maven."
    }
} else {
    Write-Host "Backend ya estaba en ejecucion en el puerto $Port."
}

if (-not $NoBrowser) {
    Start-Process "http://localhost:$Port/"
}

Write-Host "Backend disponible (o iniciandose) en: http://localhost:$Port/"
Write-Host "Para detenerlo, cierra el proceso Java/Maven que se abrio para spring-boot:run."
