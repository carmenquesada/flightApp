param(
    [string]$TomcatHome = $env:CATALINA_HOME,
    [bool]$OpenBrowser = $true
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceHtml = Join-Path $projectRoot "frontend\public\busquedaVuelos.html"

if (-not (Test-Path $sourceHtml)) {
    throw "No se encontro el HTML en: $sourceHtml"
}

if (-not [string]::IsNullOrWhiteSpace($TomcatHome) -and -not [System.IO.Path]::IsPathRooted($TomcatHome)) {
    $TomcatHome = Join-Path $projectRoot $TomcatHome
}

if ([string]::IsNullOrWhiteSpace($TomcatHome)) {
    throw "Define TOMCAT_HOME o CATALINA_HOME y vuelve a ejecutar el script."
}

$TomcatHome = [System.IO.Path]::GetFullPath($TomcatHome)

$startupBat = Join-Path $TomcatHome "bin\startup.bat"
if (-not (Test-Path $startupBat)) {
    throw "No se encontro startup.bat en: $startupBat"
}

$rootWebApp = Join-Path $TomcatHome "webapps\ROOT"
if (-not (Test-Path $rootWebApp)) {
    New-Item -ItemType Directory -Path $rootWebApp | Out-Null
}

# Publica el HTML como pagina principal de ROOT.
Copy-Item -Path $sourceHtml -Destination (Join-Path $rootWebApp "index.html") -Force

$env:CATALINA_HOME = $TomcatHome
if ([string]::IsNullOrWhiteSpace($env:CATALINA_BASE)) {
    $env:CATALINA_BASE = $TomcatHome
}

Start-Process -FilePath $startupBat -WorkingDirectory (Join-Path $TomcatHome "bin") | Out-Null
Start-Sleep -Seconds 3

$frontendOk = $false
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:8080/" -UseBasicParsing -TimeoutSec 5
    if ($resp.Content -match "Buscador simple de vuelos - FlyNow") {
        $frontendOk = $true
    }
} catch {
    $frontendOk = $false
}

if ($OpenBrowser) {
    Start-Process "http://localhost:8080/"
}

if ($frontendOk) {
    Write-Host "Frontend desplegado en Tomcat: http://localhost:8080/"
} else {
    Write-Warning "No se pudo verificar la pagina en http://localhost:8080/. Revisa si el puerto 8080 esta ocupado por otro servicio."
}

Write-Host "Para detener Tomcat: $TomcatHome\bin\shutdown.bat"
